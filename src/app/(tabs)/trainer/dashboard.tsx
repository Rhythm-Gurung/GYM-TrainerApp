import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApiQuery } from '@/api/hooks/useApiQuery';
import { useTrainerBookings, useTrainerProfile } from '@/api/hooks/useTrainerBookings';
import { useTrainerEarnings } from '@/api/hooks/useTrainerEarnings';
import { notificationService } from '@/api/services/notification.service';
import StatsCard from '@/components/client/StatsCard';
import TrainerSessionCard from '@/components/trainer/TrainerSessionCard';
import ChatFab from '@/components/ui/ChatFab';
import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import {
    QUICK_ACTION_CONFIGS,
    STAT_CARD_CONFIGS,
} from '@/constants/trainerDashboard.constants';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

const SLIDE = 40;
const DUR = 300;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerDashboard() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const greeting = getGreeting();

    const { data: earningsData, isLoading: earningsLoading, refetch: refetchEarnings } = useTrainerEarnings();
    const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useTrainerBookings();
    const { data: profileStats, isLoading: profileLoading, refetch: refetchProfile } = useTrainerProfile();

    const { data: notificationStats, refetch: refetchNotificationStats } = useApiQuery(
        'notifications:stats',
        () => notificationService.getStats(),
        { staleTime: 30 * 1000, showErrorToast: false },
    );

    const unreadCount = notificationStats?.unreadCount ?? 0;
    const fabBottom = tabBarHeight + 16;

    const handleOpenChat = useCallback(() => {
        router.push('/(tabs)/trainer/chatDetail' as never);
    }, [router]);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const statsY = useSharedValue(SLIDE);
    const actionsY = useSharedValue(SLIDE);
    const sessionsY = useSharedValue(SLIDE);

    const anim = useRef({ statsY, actionsY, sessionsY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };
            v.statsY.value = SLIDE;
            v.statsY.value = withTiming(0, ease);
            v.actionsY.value = SLIDE;
            v.actionsY.value = withDelay(80, withTiming(0, ease));
            v.sessionsY.value = SLIDE;
            v.sessionsY.value = withDelay(160, withTiming(0, ease));
        }, []),
    );

    useFocusEffect(
        useCallback(() => {
            refetchEarnings().catch(() => { });
            refetchBookings().catch(() => { });
            refetchProfile().catch(() => { });
            refetchNotificationStats().catch(() => { });
        }, [refetchEarnings, refetchBookings, refetchProfile, refetchNotificationStats]),
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([refetchEarnings(), refetchBookings(), refetchProfile(), refetchNotificationStats()]);
        setIsRefreshing(false);
    }, [refetchEarnings, refetchBookings, refetchProfile, refetchNotificationStats]);

    const statsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: statsY.value }] }));
    const actionsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: actionsY.value }] }));
    const sessionsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sessionsY.value }] }));

    const isLoading = earningsLoading || bookingsLoading || profileLoading;

    const summary = earningsData?.summary ?? null;
    const sessions = bookingsData ?? [];

    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const acceptedCount = sessions.filter((s) => s.status === 'accepted').length;
    const uniqueClientsCount = new Set(
        sessions.filter((s) => s.status === 'confirmed').map((s) => s.clientId),
    ).size;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const upcomingSessions = sessions
        .filter((s) => {
            if (s.status !== 'confirmed') return false;
            if (s.date > todayStr) return true;
            if (s.date === todayStr) return s.startTime >= currentTimeStr;
            return false;
        })
        .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
        .slice(0, 3);

    const pendingAmount = summary !== null ? summary.pending_transfer_rs + summary.on_hold_rs : null;

    const statValues: Record<string, string> = {
        earnings: summary ? `₹${summary.total_earned_rs.toLocaleString('en-IN')}` : '—',
        pending: pendingAmount !== null ? `₹${pendingAmount.toLocaleString('en-IN')}` : '—',
        sessions: bookingsData ? String(completedSessions) : '—',
        rating: profileStats?.avg_rating != null ? profileStats.avg_rating.toFixed(1) : '—',
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <HeroGradient gradient={gradientColors.trainer} fixed />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.trainerPrimary}
                        colors={[colors.trainerPrimary]}
                    />
                )}
            >
                {/* Hero title row */}
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ fontSize: fontSize.body, color: colors.white65, fontWeight: '500' }}>
                            {`${greeting} 👋`}
                        </Text>
                        <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.white, marginTop: 2 }}>
                            Dashboard
                        </Text>
                    </View>

                    {/* Notification bell */}
                    <TouchableOpacity
                        onPress={() => router.push('/trainer/notifications' as never)}
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
                                    backgroundColor: colors.error,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 4,
                                    borderWidth: 1.5,
                                    borderColor: colors.trainerPrimary,
                                }}
                            >
                                <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                    {unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 20, marginTop: -48, gap: 20 }}>

                    {/* Stats 2×2 Grid */}
                    <Animated.View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, statsStyle]}>
                        {STAT_CARD_CONFIGS.map((cfg) => (
                            <View key={cfg.id} style={{ width: '47%' }}>
                                <StatsCard
                                    title={cfg.title}
                                    value={statValues[cfg.id] ?? '—'}
                                    icon={cfg.icon}
                                    iconColor={colors.trainerPrimary}
                                    iconBg={colors.trainerMuted}
                                />
                            </View>
                        ))}
                    </Animated.View>

                    {/* Quick Actions */}
                    <Animated.View style={[{ flexDirection: 'row', gap: 12 }, actionsStyle]}>
                        {QUICK_ACTION_CONFIGS.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                onPress={() => {
                                    if (action.id === 'accept') router.push({ pathname: '/trainer/bookings', params: { tab: 'accepted' } } as never);
                                    if (action.id === 'clients') router.push({ pathname: '/trainer/bookings', params: { tab: 'completed' } } as never);
                                    if (action.id === 'analytics') router.push('/trainer/analysis' as never);
                                }}
                                activeOpacity={0.7}
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.white,
                                    borderRadius: radius.card,
                                    padding: 16,
                                    alignItems: 'center',
                                    gap: 8,
                                    borderWidth: 1,
                                    borderColor: colors.surfaceBorder,
                                    ...shadow.cardSubtle,
                                }}
                            >
                                <View style={{ position: 'relative' }}>
                                    <View
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: radius.sm,
                                            backgroundColor: action.iconBg,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons name={action.icon} size={20} color={action.iconColor} />
                                    </View>
                                    {action.id === 'accept' && acceptedCount > 0 && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: -4,
                                                right: -6,
                                                minWidth: 18,
                                                height: 18,
                                                borderRadius: 9,
                                                backgroundColor: colors.accent,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingHorizontal: 4,
                                            }}
                                        >
                                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                                {acceptedCount}
                                            </Text>
                                        </View>
                                    )}
                                    {action.id === 'clients' && uniqueClientsCount > 0 && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: -4,
                                                right: -6,
                                                minWidth: 18,
                                                height: 18,
                                                borderRadius: 9,
                                                backgroundColor: colors.action,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingHorizontal: 4,
                                            }}
                                        >
                                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                                {uniqueClientsCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: colors.textMuted }}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>

                    {/* Upcoming Sessions */}
                    <Animated.View style={sessionsStyle}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                                Upcoming Sessions
                            </Text>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/trainer/bookings', params: { tab: 'confirmed' } } as never)}>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.trainerPrimary }}>
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {upcomingSessions.length > 0 ? (
                            upcomingSessions.map((session) => (
                                <TrainerSessionCard
                                    key={session.id}
                                    session={session}
                                    onPress={() => router.push({ pathname: '/trainer/bookings', params: { tab: 'confirmed' } } as never)}
                                />
                            ))
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                                <Ionicons name="calendar-outline" size={36} color={colors.textDisabled} />
                                <Text style={{ fontSize: fontSize.body, color: colors.textSubtle, marginTop: 8 }}>
                                    No upcoming sessions
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                </View>
            </ScrollView>

            <ChatFab
                onPress={handleOpenChat}
                variant="trainer"
                iconName="sparkles"
                bottom={fabBottom}
                accessibilityLabel="Chat with SETu AI"
            />
        </SafeAreaView>
    );
}
