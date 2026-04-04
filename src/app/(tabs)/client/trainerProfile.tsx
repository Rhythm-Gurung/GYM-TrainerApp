import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApiMutation } from '@/api/hooks/useApiMutation';
import { useApiQuery } from '@/api/hooks/useApiQuery';
import { clientService } from '@/api/services/client.service';
import ReviewCard from '@/components/client/ReviewCard';
import TrainerProfileCard from '@/components/client/TrainerProfileCard';
import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { resolveImageUrl } from '@/lib';
import type { ApiGalleryItem } from '@/types/clientTypes';
import { mapApiReview, mapApiTrainer } from '@/types/clientTypes';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['About', 'Reviews', 'Portfolio'] as const;

type TabType = typeof TABS[number];

// ─── Gallery helpers (mirrors gallery.tsx) ────────────────────────────────────

type GalleryGroup = {
    key: string;
    items: ApiGalleryItem[];
    isCollection: boolean;
};

function withVersion(url: string | undefined, version: number): string | undefined {
    if (!url) return undefined;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${version}`;
}

function buildGalleryGroups(items: ApiGalleryItem[]): GalleryGroup[] {
    const collectionMap = new Map<string, GalleryGroup>();
    const ordered = items.reduce<GalleryGroup[]>((acc, item) => {
        if (item.collection_id) {
            const existing = collectionMap.get(item.collection_id);
            if (existing) {
                existing.items.push(item);
            } else {
                const group: GalleryGroup = { key: item.collection_id, items: [item], isCollection: false };
                collectionMap.set(item.collection_id, group);
                acc.push(group);
            }
        } else {
            acc.push({ key: `solo-${item.id}`, items: [item], isCollection: false });
        }
        return acc;
    }, []);
    return ordered.map((g) => ({ ...g, isCollection: g.items.length > 1 }));
}

// ─── Animation constants ──────────────────────────────────────────────────────

const SLIDE = 40;
const DUR = 320;
const CTA_HEIGHT = 80;
const GRID_GAP = 8;
const GRID_COLUMNS = 2;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerProfile() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height: screenHeight } = useWindowDimensions();
    const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();

    const [activeTab, setActiveTab] = useState<TabType>(() => {
         if (initialTab && TABS.includes(initialTab as TabType)) {
            return initialTab as TabType;
        }
        return 'About';
    });
    const { authState } = useAuth();
    const authHeader = { Authorization: `Bearer ${authState.token ?? ''}` };

    // ── Gallery viewer state (mirrors gallery.tsx) ─────────────────────────
    const [galleryVersion, setGalleryVersion] = useState(() => Date.now());
    const [isViewerVisible, setIsViewerVisible] = useState(false);
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const [innerIndex, setInnerIndex] = useState(0);
    const [viewerHeight, setViewerHeight] = useState(screenHeight);
    const outerListRef = useRef<FlatList<GalleryGroup>>(null);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const openViewer = useCallback((groupIndex: number) => {
        setSelectedGroupIndex(groupIndex);
        setInnerIndex(0);
        setIsViewerVisible(true);
        StatusBar.setBarStyle('light-content', true);
    }, []);

    const closeViewer = useCallback(() => {
        setIsViewerVisible(false);
        setInnerIndex(0);
        StatusBar.setBarStyle('dark-content', true);
    }, []);

    const handleOuterScroll = useCallback(
        (event: { nativeEvent: { contentOffset: { y: number } } }) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / viewerHeight);
            setSelectedGroupIndex(index);
            setInnerIndex(0);
        },
        [viewerHeight],
    );

    const handleInnerScroll = useCallback(
        (event: { nativeEvent: { contentOffset: { x: number } } }) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setInnerIndex(index);
        },
        [width],
    );

    // ── Fetch trainer detail ───────────────────────────────────────────────
    const { data: apiTrainer, isLoading: loadingTrainer, refetch: refetchTrainer } = useApiQuery(
        `client:trainer:${id}`,
        () => clientService.getTrainerDetail(id),
        { enabled: Boolean(id) },
    );

    const trainer = apiTrainer ? mapApiTrainer(apiTrainer) : null;

    // ── Fetch gallery ──────────────────────────────────────────────────────
    const { data: galleryData, isLoading: loadingGallery, refetch: refetchGallery } = useApiQuery(
        `client:trainer:${id}:gallery`,
        () => clientService.getTrainerGallery(id),
        { enabled: Boolean(id) },
    );
    const galleryGroups = useMemo(() => buildGalleryGroups(galleryData ?? []), [galleryData]);

    // Grid tile size (same math as gallery.tsx)
    const containerWidth = Math.max(width - 40, 120);
    const tileSize = Math.floor((containerWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

    // ── Fetch certifications ───────────────────────────────────────────────
    const { data: certData, refetch: refetchCerts } = useApiQuery(
        `client:trainer:${id}:certifications`,
        () => clientService.getTrainerCertifications(id),
        { enabled: Boolean(id) },
    );
    const certItems = certData ?? [];

    const certifications = certItems.length > 0
        ? certItems
        : (trainer?.certifications ?? []).map((c) => ({
            id: Number(c.id),
            name: c.name,
            issuer: c.issuer,
            year: c.year,
            image_url: c.image_url ?? '',
        }));

    // ── Cert viewer state ──────────────────────────────────────────────────
    const [certViewerUri, setCertViewerUri] = useState<string | null>(null);

    const openCertViewer = useCallback((uri: string) => setCertViewerUri(uri), []);
    const closeCertViewer = useCallback(() => setCertViewerUri(null), []);

    // ── Favourite ──────────────────────────────────────────────────────────
    const [isFavorited, setIsFavorited] = useState<boolean | null>(null);
    const currentFavoriteState = isFavorited !== null ? isFavorited : (apiTrainer?.is_favourited ?? false);

    useEffect(() => {
        setIsFavorited(null);
    }, [id]);

    const { mutate: toggleFav } = useApiMutation(
        () => clientService.toggleFavourite(id),
        {
            onSuccess: (result) => {
                if (result && typeof result.is_favourited === 'boolean') {
                    setIsFavorited(result.is_favourited);
                }
            },
            showErrorToast: true,
        },
    );

    // ── Reviews ────────────────────────────────────────────────────────────
    const { data: reviewsData, isLoading: loadingReviews, refetch: refetchReviews } = useApiQuery(
        `client:trainer:${id}:reviews`,
        () => clientService.getTrainerReviews(id),
        { enabled: Boolean(id) },
    );
    const reviews = (reviewsData?.data ?? []).map((r) => mapApiReview(r, id));

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setGalleryVersion(Date.now());

        try {
            await Promise.all([
                refetchTrainer(),
                refetchGallery(),
                refetchCerts(),
                refetchReviews(),
            ]);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchCerts, refetchGallery, refetchReviews, refetchTrainer]);

    // ── Animations ────────────────────────────────────────────────────────
    const cardY = useSharedValue(SLIDE);
    const tabsY = useSharedValue(SLIDE);
    const contentY = useSharedValue(SLIDE);
    const animRef = useRef({ cardY, tabsY, contentY });

    useFocusEffect(
        useCallback(() => {
            const v = animRef.current;
            const ease = { duration: DUR };
            v.cardY.value = SLIDE; v.cardY.value = withTiming(0, ease);
            v.tabsY.value = SLIDE; v.tabsY.value = withDelay(100, withTiming(0, ease));
            v.contentY.value = SLIDE; v.contentY.value = withDelay(180, withTiming(0, ease));
        }, []),
    );

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));
    const tabsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: tabsY.value }] }));
    const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: contentY.value }] }));

    function handleTabChange(tab: TabType) {
        setActiveTab(tab);
        animRef.current.contentY.value = 20;
        animRef.current.contentY.value = withTiming(0, { duration: 200 });
    }

    // ── Guards ────────────────────────────────────────────────────────────
    if (loadingTrainer) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!trainer) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <Text style={{ fontSize: fontSize.body, color: colors.textMuted }}>Trainer not found</Text>
            </SafeAreaView>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* ── Cert full-screen viewer ────────────────────────────────────── */}
            <Modal
                transparent={false}
                animationType="fade"
                visible={certViewerUri !== null}
                onRequestClose={closeCertViewer}
                statusBarTranslucent
                navigationBarTranslucent
            >
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    {certViewerUri && (
                        <ExpoImage
                            source={{ uri: certViewerUri, headers: authHeader }}
                            style={{ flex: 1 }}
                            contentFit="contain"
                            cachePolicy="none"
                        />
                    )}
                    <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                            <TouchableOpacity
                                onPress={closeCertViewer}
                                activeOpacity={0.75}
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: radius.full,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.45)',
                                }}
                            >
                                <Ionicons name="close" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* ── Gallery full-screen viewer (vertical groups + horizontal swipe) ─ */}
            <Modal
                transparent={false}
                animationType="fade"
                visible={isViewerVisible}
                onRequestClose={closeViewer}
                statusBarTranslucent
                navigationBarTranslucent
            >
                <View
                    style={{ flex: 1, backgroundColor: '#000' }}
                    onLayout={(e) => {
                        const h = e.nativeEvent.layout.height;
                        if (h > 0) setViewerHeight(h);
                    }}
                >
                    {/* Outer: vertical paging — one page per group */}
                    <FlatList
                        ref={outerListRef}
                        data={galleryGroups}
                        keyExtractor={(g) => g.key}
                        pagingEnabled
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={handleOuterScroll}
                        initialScrollIndex={selectedGroupIndex}
                        style={{ flex: 1 }}
                        getItemLayout={(_, index) => ({
                            length: viewerHeight,
                            offset: viewerHeight * index,
                            index,
                        })}
                        onScrollToIndexFailed={(info) => {
                            outerListRef.current?.scrollToOffset({
                                offset: info.index * viewerHeight,
                                animated: false,
                            });
                        }}
                        renderItem={({ item: group }) => {
                            if (group.isCollection) {
                                return (
                                    <View style={{ width, height: viewerHeight }}>
                                        {/* Inner: horizontal paging — images within collection */}
                                        <FlatList
                                            data={group.items}
                                            keyExtractor={(img) => String(img.id)}
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            onMomentumScrollEnd={handleInnerScroll}
                                            style={{ flex: 1 }}
                                            getItemLayout={(_, idx) => ({
                                                length: width,
                                                offset: width * idx,
                                                index: idx,
                                            })}
                                            renderItem={({ item }) => {
                                                const uri = withVersion(resolveImageUrl(item.image_url), galleryVersion);
                                                return (
                                                    <View style={{ width, height: viewerHeight }}>
                                                        {uri ? (
                                                            <ExpoImage
                                                                source={{ uri, headers: authHeader }}
                                                                style={{ flex: 1 }}
                                                                contentFit="contain"
                                                                cachePolicy="none"
                                                            />
                                                        ) : (
                                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: fontSize.caption }}>
                                                                    Image unavailable
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {!!item.caption?.trim() && (
                                                            <View style={{
                                                                position: 'absolute',
                                                                bottom: 80,
                                                                left: 20,
                                                                right: 20,
                                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                                borderRadius: radius.sm,
                                                                paddingHorizontal: 12,
                                                                paddingVertical: 8,
                                                            }}
                                                            >
                                                                <Text style={{ color: '#fff', fontSize: fontSize.body, lineHeight: 20 }}>
                                                                    {item.caption}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            }}
                                        />
                                    </View>
                                );
                            }

                            // Single image
                            const single = group.items[0];
                            const uri = withVersion(resolveImageUrl(single.image_url), galleryVersion);
                            return (
                                <View style={{ width, height: viewerHeight }}>
                                    {uri ? (
                                        <ExpoImage
                                            source={{ uri, headers: authHeader }}
                                            style={{ flex: 1 }}
                                            contentFit="contain"
                                            cachePolicy="none"
                                        />
                                    ) : (
                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: fontSize.caption }}>
                                                Image unavailable
                                            </Text>
                                        </View>
                                    )}
                                    {!!single.caption?.trim() && (
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 80,
                                            left: 20,
                                            right: 20,
                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                            borderRadius: radius.sm,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                        }}
                                        >
                                            <Text style={{ color: '#fff', fontSize: fontSize.body, lineHeight: 20 }}>
                                                {single.caption}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        }}
                    />

                    {/* Top overlay: close + counter */}
                    <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
                            <TouchableOpacity
                                onPress={closeViewer}
                                activeOpacity={0.75}
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: radius.full,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.45)',
                                }}
                            >
                                <Ionicons name="close" size={22} color="#fff" />
                            </TouchableOpacity>

                            <View style={{ flex: 1, alignItems: 'center' }}>
                                {(galleryGroups[selectedGroupIndex]?.items.length ?? 0) > 1 && (
                                    <Text style={{ color: '#fff', fontSize: fontSize.caption, fontWeight: '600' }}>
                                        {`${innerIndex + 1} / ${galleryGroups[selectedGroupIndex]!.items.length}`}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </SafeAreaView>

                    {/* Bottom dot indicators for collections */}
                    {(galleryGroups[selectedGroupIndex]?.items.length ?? 0) > 1 && (
                        <View style={{
                            position: 'absolute',
                            bottom: 28,
                            left: 0,
                            right: 0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 5,
                        }}
                        >
                            {galleryGroups[selectedGroupIndex]!.items.map((item, i) => (
                                <View
                                    key={item.id}
                                    style={{
                                        width: i === innerIndex ? 18 : 5,
                                        height: 5,
                                        borderRadius: 3,
                                        backgroundColor: i === innerIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                                    }}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </Modal>

            {/* ── Scrollable body ────────────────────────────────────────────── */}
            <ScrollView
                contentContainerStyle={{ paddingBottom: CTA_HEIGHT + insets.bottom + 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                )}
            >
                {/* Hero gradient */}
                <HeroGradient gradient={gradientColors.primary} height={200} paddingTopExtra={12}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: radius.sm,
                                backgroundColor: colors.white15,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.white} />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => toggleFav()}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.white15,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={currentFavoriteState ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={currentFavoriteState ? colors.heartActive : colors.white}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </HeroGradient>

                <View style={{ paddingHorizontal: 20, marginTop: -94 }}>

                    {/* Profile card */}
                    <Animated.View style={[{ overflow: 'visible' }, cardStyle]}>
                        <TrainerProfileCard trainer={trainer} />
                    </Animated.View>

                    {/* Tab switcher */}
                    <Animated.View style={[{ marginTop: 20, overflow: 'visible' }, tabsStyle]}>
                        <View style={{
                            flexDirection: 'row',
                            backgroundColor: colors.surface,
                            borderRadius: 16,
                            padding: 5,
                            gap: 4,
                        }}
                        >
                            {TABS.map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => handleTabChange(tab)}
                                    activeOpacity={0.7}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        backgroundColor: activeTab === tab ? colors.white : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: fontSize.tag,
                                        fontWeight: '600',
                                        color: activeTab === tab ? colors.textPrimary : colors.textMuted,
                                    }}
                                    >
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Tab content */}
                    <Animated.View style={[{ marginTop: 20, overflow: 'visible' }, contentStyle]}>

                        {/* ── About ──────────────────────────────────────── */}
                        {activeTab === 'About' && (
                            <View style={{ gap: 24 }}>
                                {/* Bio */}
                                <View>
                                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
                                        Bio
                                    </Text>
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, lineHeight: 20 }}>
                                        {trainer.bio}
                                    </Text>
                                </View>

                                {/* Expertise */}
                                <View>
                                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>
                                        Expertise
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                        {trainer.expertise.map((item) => (
                                            <View
                                                key={item}
                                                style={{
                                                    backgroundColor: colors.primarySurface,
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 6,
                                                    borderRadius: radius.full,
                                                    borderWidth: 1,
                                                    borderColor: colors.primaryBorderSm,
                                                }}
                                            >
                                                <Text style={{ fontSize: fontSize.tag, color: colors.primary, fontWeight: '600' }}>
                                                    {item}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Certifications */}
                                {certifications.length > 0 && (
                                    <View>
                                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>
                                            Certifications
                                        </Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{ gap: GRID_GAP }}
                                        >
                                            {certifications.map((cert) => {
                                                const CERT_TILE = tileSize;
                                                const resolvedUri = resolveImageUrl(cert.image_url);
                                                return (
                                                    <TouchableOpacity
                                                        key={cert.id}
                                                        activeOpacity={resolvedUri ? 0.75 : 1}
                                                        onPress={() => { if (resolvedUri) openCertViewer(resolvedUri); }}
                                                        style={{ width: CERT_TILE, gap: 6 }}
                                                    >
                                                        {resolvedUri ? (
                                                            <ExpoImage
                                                                source={{ uri: resolvedUri, headers: authHeader }}
                                                                style={{
                                                                    width: CERT_TILE,
                                                                    height: CERT_TILE,
                                                                    borderRadius: radius.sm,
                                                                    backgroundColor: colors.surface,
                                                                }}
                                                                contentFit="cover"
                                                                cachePolicy="none"
                                                            />
                                                        ) : (
                                                            <View style={{
                                                                width: CERT_TILE,
                                                                height: CERT_TILE,
                                                                borderRadius: radius.sm,
                                                                backgroundColor: colors.accentBg,
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                            >
                                                                <Ionicons name="ribbon-outline" size={32} color={colors.accent} />
                                                            </View>
                                                        )}

                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ── Reviews ────────────────────────────────────── */}
                        {activeTab === 'Reviews' && (
                            <View>
                                {loadingReviews && (
                                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
                                )}
                                {!loadingReviews && reviews.length > 0 && (
                                    <>
                                        {reviewsData && (
                                            <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginBottom: 12 }}>
                                                {`${reviewsData.count} review${reviewsData.count === 1 ? '' : 's'} · Avg ${reviewsData.average_rating.toFixed(1)} ★`}
                                            </Text>
                                        )}
                                        {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                                    </>
                                )}
                                {!loadingReviews && reviews.length === 0 && (
                                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                                        <View style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 18,
                                            backgroundColor: colors.surface,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 12,
                                        }}
                                        >
                                            <Ionicons name="star-outline" size={24} color={colors.textDisabled} />
                                        </View>
                                        <Text style={{ fontSize: fontSize.body, color: colors.textMuted }}>
                                            No reviews yet
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ── Portfolio ───────────────────────────────────── */}
                        {activeTab === 'Portfolio' && (
                            <View>
                                {loadingGallery && (
                                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
                                )}

                                {!loadingGallery && galleryGroups.length > 0 && (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
                                        {galleryGroups.map((group, groupIndex) => {
                                            const coverItem = group.items[0];
                                            const imageUri = withVersion(
                                                resolveImageUrl(coverItem.image_url),
                                                galleryVersion,
                                            );
                                            if (!imageUri) return null;

                                            return (
                                                <TouchableOpacity
                                                    key={group.key}
                                                    activeOpacity={0.82}
                                                    onPress={() => openViewer(groupIndex)}
                                                    style={{ width: tileSize }}
                                                >
                                                    <ExpoImage
                                                        source={{ uri: imageUri, headers: authHeader }}
                                                        style={{
                                                            width: tileSize,
                                                            height: tileSize,
                                                            borderRadius: radius.sm,
                                                            backgroundColor: colors.surface,
                                                        }}
                                                        contentFit="cover"
                                                        cachePolicy="none"
                                                    />

                                                    {/* Collection badge */}
                                                    {group.isCollection && (
                                                        <View style={{
                                                            position: 'absolute',
                                                            top: 5,
                                                            left: 5,
                                                            backgroundColor: 'rgba(0,0,0,0.55)',
                                                            borderRadius: 4,
                                                            paddingHorizontal: 5,
                                                            paddingVertical: 2,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                        }}
                                                        >
                                                            <Ionicons name="copy-outline" size={10} color="#fff" />
                                                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                                                {group.items.length}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}

                                {!loadingGallery && galleryGroups.length === 0 && (
                                    <View style={{ alignItems: 'center', paddingVertical: 56 }}>
                                        <View style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 20,
                                            backgroundColor: colors.surface,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 14,
                                        }}
                                        >
                                            <Ionicons name="images-outline" size={28} color={colors.textDisabled} />
                                        </View>
                                        <Text style={{ fontSize: fontSize.body, color: colors.textMuted }}>
                                            No portfolio images yet
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                    </Animated.View>
                </View>
            </ScrollView>

            {/* ── Fixed bottom CTA ───────────────────────────────────────────── */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: insets.bottom + 16,
                backgroundColor: colors.background,
                borderTopWidth: 1,
                borderTopColor: colors.surfaceBorder,
            }}
            >
                <TouchableOpacity
                    onPress={() => {
                        router.push({ pathname: '/(tabs)/client/bookSession', params: { id: trainer.id } });
                    }}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: colors.primary,
                        borderRadius: radius.card,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                >
                    <Ionicons name="calendar-outline" size={18} color={colors.white} />
                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>
                        {`Book Session · ₹${trainer.hourlyRate}/hr`}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
