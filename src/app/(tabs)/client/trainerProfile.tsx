import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import ReviewCard from '@/components/client/ReviewCard';
import TrainerProfileCard from '@/components/client/TrainerProfileCard';
import { colors, fontSize, gradientColors, radius } from '@/constants/theme';
import { mockReviews, mockTrainers } from '@/data/mockData';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['About', 'Reviews', 'Portfolio'] as const;
type TabType = typeof TABS[number];

// ─── Animation constants ──────────────────────────────────────────────────────

const SLIDE = 40;
const DUR = 320;
const CTA_HEIGHT = 80; // approximate height of the fixed book button area

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerProfile() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [activeTab, setActiveTab] = useState<TabType>('About');
    const [isFavorited, setIsFavorited] = useState(false);

    const trainer = mockTrainers.find((t) => t.id === id);
    const reviews = mockReviews.filter((r) => r.trainerId === id);

    // ── Shared values ─────────────────────────────────────────────────────────
    const cardY = useSharedValue(SLIDE);
    const tabsY = useSharedValue(SLIDE);
    const contentY = useSharedValue(SLIDE);

    const animRef = useRef({ cardY, tabsY, contentY });

    useFocusEffect(
        useCallback(() => {
            const v = animRef.current;
            const ease = { duration: DUR };

            v.cardY.value = SLIDE;
            v.cardY.value = withTiming(0, ease);

            v.tabsY.value = SLIDE;
            v.tabsY.value = withDelay(100, withTiming(0, ease));

            v.contentY.value = SLIDE;
            v.contentY.value = withDelay(180, withTiming(0, ease));
        }, []),
    );

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));
    const tabsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: tabsY.value }] }));
    const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: contentY.value }] }));

    // ── Tab switch: re-animate content ────────────────────────────────────────
    function handleTabChange(tab: TabType) {
        setActiveTab(tab);
        animRef.current.contentY.value = 20;
        animRef.current.contentY.value = withTiming(0, { duration: 200 });
    }

    if (!trainer) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <Text style={{ fontSize: fontSize.body, color: colors.textMuted }}>Trainer not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Tab bar is hidden for this screen via _layout.tsx */}

            {/* ── Scrollable body ────────────────────────────────────────────── */}
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: CTA_HEIGHT + insets.bottom + 16,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero gradient */}
                <LinearGradient
                    colors={gradientColors.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        height: 200,
                        paddingTop: insets.top + 12,
                        paddingHorizontal: 20,
                        borderBottomLeftRadius: radius.hero,
                        borderBottomRightRadius: radius.hero,
                        overflow: 'hidden',
                    }}
                >
                    {/* Back / Fav / Share row */}
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
                                onPress={() => setIsFavorited((prev) => !prev)}
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
                                    name={isFavorited ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={isFavorited ? colors.heartActive : colors.white}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.white15,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                activeOpacity={0.7}
                                onPress={() => {
                                    // TODO: share trainer profile
                                }}
                            >
                                <Ionicons name="share-outline" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* ── Content below hero ─────────────────────────────────── */}
                <View style={{ paddingHorizontal: 20, marginTop: -28 }}>

                    {/* Profile card */}
                    <Animated.View style={[{ overflow: 'visible' }, cardStyle]}>
                        <TrainerProfileCard trainer={trainer} />
                    </Animated.View>

                    {/* Tab switcher */}
                    <Animated.View style={[{ marginTop: 20, overflow: 'visible' }, tabsStyle]}>
                        <View
                            style={{
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
                                    <Text
                                        style={{
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
                                <View>
                                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>
                                        Certifications
                                    </Text>
                                    <View style={{ gap: 10 }}>
                                        {trainer.certifications.map((cert) => (
                                            <View
                                                key={cert.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: 14,
                                                    backgroundColor: colors.surface,
                                                    borderRadius: radius.md,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: radius.sm,
                                                        backgroundColor: colors.accentBg,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Ionicons name="ribbon-outline" size={18} color={colors.accent} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                                        {cert.name}
                                                    </Text>
                                                    <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginTop: 2 }}>
                                                        {`${cert.issuer} · ${cert.year}`}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── Reviews ────────────────────────────────────── */}
                        {activeTab === 'Reviews' && (
                            <View>
                                {reviews.length > 0 ? (
                                    reviews.map((r) => <ReviewCard key={r.id} review={r} />)
                                ) : (
                                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                                        <View
                                            style={{
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
                            <View style={{ alignItems: 'center', paddingVertical: 56 }}>
                                <View
                                    style={{
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
                                    Portfolio coming soon
                                </Text>
                            </View>
                        )}

                    </Animated.View>
                </View>
            </ScrollView>

            {/* ── Fixed bottom CTA ───────────────────────────────────────────── */}
            <View
                style={{
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
                        // TODO: Navigate to booking screen
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
