import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
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

import StatsCard from '@/components/client/StatsCard';
import TrainerSessionCard from '@/components/trainer/TrainerSessionCard';
import HeroGradient from '@/components/ui/HeroGradient';
import {
    QUICK_ACTION_CONFIGS,
    STAT_CARD_CONFIGS,
} from '@/constants/trainerDashboard.constants';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast } from '@/lib';
import {
    fetchMockTrainerDashboard,
    MOCK_AVG_RATING,
    MOCK_TOTAL_SESSIONS,
    MOCK_UNREAD_NOTIFICATIONS,
} from '@/mockData/trainerDashboard.mock';
import type { EarningsSummary } from '@/types/clientTypes';
import type { TrainerSession } from '@/types/trainerTypes';

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

    const [sessions, setSessions] = useState<TrainerSession[]>([]);
    const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const statsY = useSharedValue(SLIDE);
    const actionsY = useSharedValue(SLIDE);
    const commissionY = useSharedValue(SLIDE);
    const sessionsY = useSharedValue(SLIDE);

    const anim = useRef({ statsY, actionsY, commissionY, sessionsY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };
            v.statsY.value = SLIDE;
            v.statsY.value = withTiming(0, ease);
            v.actionsY.value = SLIDE;
            v.actionsY.value = withDelay(80, withTiming(0, ease));
            v.commissionY.value = SLIDE;
            v.commissionY.value = withDelay(160, withTiming(0, ease));
            v.sessionsY.value = SLIDE;
            v.sessionsY.value = withDelay(240, withTiming(0, ease));
        }, []),
    );

    useFocusEffect(
        useCallback(() => {
            fetchMockTrainerDashboard()
                .then(({ sessions: s, earnings: e }) => {
                    setSessions(s);
                    setEarnings(e);
                })
                .catch(() => showErrorToast('Failed to load dashboard', 'Error'))
                .finally(() => setIsLoading(false));
        }, []),
    );

    const statsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: statsY.value }] }));
    const actionsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: actionsY.value }] }));
    const commissionStyle = useAnimatedStyle(() => ({ transform: [{ translateY: commissionY.value }] }));
    const sessionsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sessionsY.value }] }));

    const pendingCount = sessions.filter((s) => s.status === 'pending').length;
    const upcomingSessions = sessions.filter((s) => s.status === 'confirmed').slice(0, 3);

    const statValues: Record<string, string> = {
        earnings: earnings ? `₹${earnings.totalEarnings.toLocaleString('en-IN')}` : '—',
        pending: earnings ? `₹${earnings.pendingPayouts.toLocaleString('en-IN')}` : '—',
        sessions: String(MOCK_TOTAL_SESSIONS),
        rating: String(MOCK_AVG_RATING),
    };

    const commissionPct = earnings
        ? Math.round((earnings.commissionPaid / earnings.totalEarnings) * 100)
        : 0;

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
                        {MOCK_UNREAD_NOTIFICATIONS > 0 && (
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
                                    {MOCK_UNREAD_NOTIFICATIONS}
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
                                    if (action.id === 'accept') router.push({ pathname: '/trainer/bookings', params: { tab: 'pending' } } as never);
                                    if (action.id === 'analytics') router.push('/trainer/earnings' as never);
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
                                    {action.id === 'accept' && pendingCount > 0 && (
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
                                                {pendingCount}
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

                    {/* Commission */}
                    <Animated.View
                        style={[
                            {
                                backgroundColor: colors.white,
                                borderRadius: radius.card,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                ...shadow.cardSubtle,
                            },
                            commissionStyle,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                                Commission
                            </Text>
                            <View
                                style={{
                                    backgroundColor: colors.surface,
                                    borderRadius: radius.full,
                                    paddingHorizontal: 10,
                                    paddingVertical: 2,
                                }}
                            >
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textMuted }}>
                                    {`${earnings?.commissionRate ?? 0}%`}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                height: 10,
                                backgroundColor: colors.surface,
                                borderRadius: radius.full,
                                overflow: 'hidden',
                            }}
                        >
                            <View
                                style={{
                                    height: '100%',
                                    width: `${commissionPct}%`,
                                    backgroundColor: colors.trainerPrimary,
                                    borderRadius: radius.full,
                                }}
                            />
                        </View>

                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginTop: 8 }}>
                            {`₹${earnings?.commissionPaid.toLocaleString('en-IN') ?? 0} paid`}
                        </Text>
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
                                <TrainerSessionCard key={session.id} session={session} />
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
        </SafeAreaView>
    );
}
