import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApiQuery } from '@/api/hooks/useApiQuery';
import { clientService } from '@/api/services/client.service';
import { notificationService } from '@/api/services/notification.service';
import StatsCard from '@/components/client/StatsCard';
import TrainerCard from '@/components/client/TrainerCard';
import ChatFab from '@/components/ui/ChatFab';
import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { expertiseCategories } from '@/data/mockData';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { resolveImageUrl } from '@/lib';
import { mapApiTrainer } from '@/types/clientTypes';

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

// Positive translateY = element starts BELOW its final position → slides UP
const SLIDE = 40;
const DUR = 300;

export default function ClientHome() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const greeting = getGreeting();
    const { authState } = useAuth();
    const authHeader = { Authorization: `Bearer ${authState.token ?? ''}` };

    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data: apiTrainers, refetch: refetchTrainers } = useApiQuery(
        'client:trainers',
        () => clientService.getTrainers(),
        { staleTime: 2 * 60 * 1000 },
    );

    const { data: apiFavourites, refetch: refetchFavourites } = useApiQuery(
        'client:favourites',
        () => clientService.getFavourites(),
        { staleTime: 60 * 1000 },
    );

    const { data: bookingStats, refetch: refetchBookingStats } = useApiQuery(
        'bookings:stats',
        () => clientService.getBookingsStats(),
        { staleTime: 60 * 1000, showErrorToast: false },
    );

    const { data: notificationStats, refetch: refetchNotificationStats } = useApiQuery(
        'notifications:stats',
        () => notificationService.getStats(),
        { staleTime: 30 * 1000, showErrorToast: false },
    );

    const unreadCount = notificationStats?.unreadCount ?? 0;

    const allTrainers = useMemo(
        () => (apiTrainers ?? []).map(mapApiTrainer),
        [apiTrainers],
    );

    const browseCategories = useMemo(() => {
        const counts = allTrainers
            .flatMap((t) => (t.expertise ?? []))
            .map((cat) => String(cat).trim())
            .filter(Boolean)
            .reduce<Record<string, number>>((acc, cat) => {
                acc[cat] = (acc[cat] ?? 0) + 1;
                return acc;
            }, {});

        const fromApi = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);

        const list = fromApi.length > 0 ? fromApi : expertiseCategories;
        return list.slice(0, 8);
    }, [allTrainers]);

    const topTrainers = useMemo(
        () => allTrainers
            .filter((t) => t.reviewCount > 0)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 4),
        [allTrainers],
    );
    const recentlyViewed = useMemo(
        () => allTrainers.slice(0, 4),
        [allTrainers],
    );

    const statsY = useSharedValue(SLIDE);
    const catsY = useSharedValue(SLIDE);
    const trainersY = useSharedValue(SLIDE);
    const recentY = useSharedValue(SLIDE);

    const anim = useRef({ statsY, catsY, trainersY, recentY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };

            v.statsY.value = SLIDE;
            v.statsY.value = withTiming(0, ease);

            v.catsY.value = SLIDE;
            v.catsY.value = withDelay(80, withTiming(0, ease));

            v.trainersY.value = SLIDE;
            v.trainersY.value = withDelay(160, withTiming(0, ease));

            v.recentY.value = SLIDE;
            v.recentY.value = withDelay(240, withTiming(0, ease));

            refetchNotificationStats();
        }, [refetchNotificationStats]),
    );

    const statsStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: statsY.value }],
    }));
    const catsStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: catsY.value }],
    }));
    const trainersStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: trainersY.value }],
    }));
    const recentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: recentY.value }],
    }));

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([
            refetchTrainers(),
            refetchFavourites(),
            refetchBookingStats(),
            refetchNotificationStats(),
        ]);
        setIsRefreshing(false);
    }, [refetchTrainers, refetchFavourites, refetchBookingStats, refetchNotificationStats]);

    const fabBottom = tabBarHeight + 16;

    const handleOpenChat = useCallback(() => {
        router.push('/(tabs)/client/chatDetail' as never);
    }, [router]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
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
                {/* Hero / Header */}
                <HeroGradient gradient={gradientColors.primary} paddingTopExtra={20} paddingBottom={36}>
                    {/* Greeting row */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View>
                            <Text style={{ fontSize: fontSize.body, color: colors.white65, fontWeight: '500' }}>
                                {`${greeting} 👋`}
                            </Text>
                            <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.white, marginTop: 2 }}>
                                Find Your Trainer
                            </Text>
                        </View>

                        {/* Notification Bell */}
                        <TouchableOpacity
                            onPress={() => router.push('/client/notifications' as never)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: radius.icon,
                                backgroundColor: colors.white15,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="notifications-outline" size={20} color={colors.white} />
                            {unreadCount > 0 && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -4,
                                        right: -4,
                                        minWidth: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        backgroundColor: colors.accent,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingHorizontal: 4,
                                        borderWidth: 1.5,
                                        borderColor: colors.primary,
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                        {unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <TouchableOpacity
                        onPress={() => router.push('/client/discover' as never)}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: colors.white18,
                            borderRadius: radius.card,
                            paddingHorizontal: 16,
                            paddingVertical: 13,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="search-outline" size={16} color={colors.white60} />
                        <Text style={{ flex: 1, fontSize: fontSize.body, color: colors.white55, marginLeft: 10 }}>
                            Search trainers, skills, locations...
                        </Text>
                        <Ionicons name="options-outline" size={16} color={colors.white60} />
                    </TouchableOpacity>
                </HeroGradient>

                {/* Content */}
                <View style={{ paddingHorizontal: 20, marginTop: 20, overflow: 'visible' }}>

                    {/* Quick Stats */}
                    <Animated.View className="flex-row" style={[{ gap: 10, overflow: 'visible' }, statsStyle]}>
                        <StatsCard
                            title="Trainers"
                            value={String(apiTrainers?.length ?? 0)}
                            icon="trending-up-outline"
                            onPress={() => router.push('/client/discover' as never)}
                        />
                        <StatsCard
                            title="Sessions"
                            value={bookingStats ? String(bookingStats.totalCount) : '—'}
                            icon="time-outline"
                        />
                        <StatsCard
                            title="Saved"
                            value={String(apiFavourites?.length ?? 0)}
                            icon="heart-outline"
                            onPress={() => router.push('/(tabs)/client/profile?scrollTo=favourites' as never)}
                        />
                    </Animated.View>

                    {/* Browse Categories */}
                    <Animated.View style={[{ marginTop: 28, overflow: 'visible' }, catsStyle]}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                                Browse Categories
                            </Text>
                            <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                        >
                            {browseCategories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => router.push(`/client/discover?expertise=${cat}` as never)}
                                    activeOpacity={0.7}
                                    style={{
                                        backgroundColor: colors.surface,
                                        borderRadius: radius.md,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderWidth: 1,
                                        borderColor: colors.surfaceBorder,
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textSecondary, fontWeight: '500' }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* Top Rated Trainers */}
                    <Animated.View style={[{ marginTop: 28, overflow: 'visible' }, trainersStyle]}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                                Top Rated Trainers
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/client/discover' as never)}>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.primary }}>
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ gap: 12 }}>
                            {topTrainers.map((trainer) => (
                                <TrainerCard
                                    key={trainer.id}
                                    trainer={trainer}
                                    onPress={() => router.push(`/client/trainerProfile?id=${trainer.id}&tab=Reviews` as never)}
                                />
                            ))}
                        </View>
                    </Animated.View>

                    {/* Recently Viewed */}
                    <Animated.View style={[{ marginTop: 28, marginBottom: 8, overflow: 'visible' }, recentStyle]}>
                        <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
                            Recently Viewed
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 16, paddingBottom: 4 }}
                        >
                            {recentlyViewed.map((t) => {
                                const initials = t.name.split(' ').map((n) => n[0]).join('');
                                const firstName = t.name.split(' ')[0];
                                const avatarUri = resolveImageUrl(t.avatar);
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => router.push(`/client/trainerProfile?id=${t.id}` as never)}
                                        activeOpacity={0.75}
                                        style={{ width: 72, alignItems: 'center', gap: 8 }}
                                    >
                                        {avatarUri ? (
                                            <ExpoImage
                                                source={{ uri: avatarUri, headers: authHeader }}
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: radius.card,
                                                    borderWidth: 1.5,
                                                    borderColor: colors.primaryBorderSm,
                                                }}
                                                contentFit="cover"
                                                cachePolicy="none"
                                            />
                                        ) : (
                                            <View
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: radius.card,
                                                    backgroundColor: colors.primaryMuted,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: 1.5,
                                                    borderColor: colors.primaryBorderSm,
                                                }}
                                            >
                                                <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.primary }}>
                                                    {initials}
                                                </Text>
                                            </View>
                                        )}
                                        <Text
                                            style={{ fontSize: fontSize.caption, color: colors.textMuted, fontWeight: '500', textAlign: 'center' }}
                                            numberOfLines={1}
                                        >
                                            {firstName}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                </View>
            </ScrollView>

            <ChatFab
                onPress={handleOpenChat}
                variant="ai"
                bottom={fabBottom}
                accessibilityLabel="Chat with SETu AI"
            />
        </SafeAreaView>
    );
}
