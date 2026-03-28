import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrainerBookings, useTrainerProfile } from '@/api/hooks/useTrainerBookings';
import { useTrainerEarnings } from '@/api/hooks/useTrainerEarnings';
import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';

const SLIDE = 40;
const DUR = 300;

// Outer paddingHorizontal (20*2) + card padding (16*2) + y-axis label buffer
const CHART_H_OFFSET = 20 * 2 + 16 * 2 + 8;

type LinePoint = { x: string; y: number };

type PieDatum = { x: string; y: number; color: string };

type GiftedLinePoint = {
    value: number;
    label: string;
    dataPointColor?: string;
};

type GiftedPieSlice = {
    value: number;
    color: string;
};

type SessionWithOptionalAmount = {
    date?: string;
    status?: string;
    amount_rs?: number;
};

const STATUS_COLORS: Record<string, string> = {
    Confirmed: colors.action,
    Completed: colors.success,
    Accepted: colors.accent,
    Cancelled: colors.error,
    'No data': colors.surfaceBorder,
};

const PIE_STATUSES = ['Confirmed', 'Completed', 'Accepted', 'Cancelled'] as const;

function isoDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function isoFromUnknownDate(value: unknown): string | null {
    if (typeof value !== 'string' || value.length === 0) return null;
    // Accept "YYYY-MM-DD" directly.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Attempt ISO / datetime parse; keep only date part.
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return isoDateOnly(parsed);
}

function formatDayLabel(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function TrainerAnalysis() {
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const { data: earningsData, isLoading: earningsLoading, refetch: refetchEarnings, isFetching: earningsFetching } = useTrainerEarnings();
    const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings, isFetching: bookingsFetching } = useTrainerBookings();
    const { data: profileStats, isLoading: profileLoading, refetch: refetchProfile, isFetching: profileFetching } = useTrainerProfile();

    const isLoading = earningsLoading || bookingsLoading || profileLoading;
    const isFetching = earningsFetching || bookingsFetching || profileFetching;

    const statsY = useSharedValue(SLIDE);
    const chartsY = useSharedValue(SLIDE);
    const anim = useRef({ statsY, chartsY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };
            v.statsY.value = SLIDE;
            v.statsY.value = withTiming(0, ease);
            v.chartsY.value = SLIDE;
            v.chartsY.value = withDelay(80, withTiming(0, ease));
        }, []),
    );

    const statsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: statsY.value }] }));
    const chartsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: chartsY.value }] }));

    const onRefresh = useCallback(async () => {
        await Promise.all([refetchEarnings(), refetchBookings(), refetchProfile()]);
    }, [refetchEarnings, refetchBookings, refetchProfile]);

    const summary = earningsData?.summary ?? null;

    const { lineData, pieData, totalSessions } = useMemo(() => {
        const now = new Date();
        const sessions: SessionWithOptionalAmount[] = (bookingsData ?? []) as SessionWithOptionalAmount[];

        const last7: string[] = Array.from({ length: 7 }, (_, idx) => {
            const i = 6 - idx;
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            return isoDateOnly(d);
        });

        const earningsByDay = new Map<string, number>(last7.map((day) => [day, 0]));

        // Build earnings series from payout history (supports multiple payouts per day).
        const payouts = earningsData?.payouts ?? [];
        payouts.forEach((p) => {
            const day = isoFromUnknownDate((p as { booking_date?: unknown }).booking_date);
            if (!day || !earningsByDay.has(day)) return;
            const amount = typeof (p as { amount_rs?: unknown }).amount_rs === 'number' ? (p as { amount_rs: number }).amount_rs : 0;
            earningsByDay.set(day, (earningsByDay.get(day) ?? 0) + amount);
        });

        const line: LinePoint[] = last7.map((day) => ({ x: formatDayLabel(day), y: earningsByDay.get(day) ?? 0 }));

        const statusCounts = sessions.reduce(
            (acc, s) => {
                const st = (s?.status ?? 'unknown') as string;
                acc[st] = (acc[st] ?? 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        const total = sessions.length;

        const pie: PieDatum[] = PIE_STATUSES
            .map((label) => ({
                x: label,
                y: statusCounts[label.toLowerCase()] ?? 0,
                color: STATUS_COLORS[label],
            }))
            .filter((d) => d.y > 0);

        const safePie: PieDatum[] = pie.length > 0 ? pie : [{ x: 'No data', y: 1, color: STATUS_COLORS['No data'] }];

        return {
            lineData: line,
            pieData: safePie,
            totalSessions: total,
        };
    }, [bookingsData, earningsData?.payouts]);

    const activeLegend = pieData[0]?.x === 'No data' ? [] : pieData;

    const avgRating = profileStats?.avg_rating != null ? profileStats.avg_rating.toFixed(1) : '—';
    const totalEarned = summary ? `₹${summary.total_earned_rs.toLocaleString('en-IN')}` : '—';

    const chartWidth = screenWidth - CHART_H_OFFSET;

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
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
            <HeroGradient gradient={gradientColors.trainer} fixed />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={onRefresh}
                        tintColor={colors.trainerPrimary}
                        colors={[colors.trainerPrimary]}
                    />
                )}
            >
                {/* Hero title */}
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.white }}>
                        Analysis
                    </Text>
                    <Text style={{ fontSize: fontSize.body, color: colors.white65, marginTop: 2, fontWeight: '500' }}>
                        Your performance at a glance
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 20, marginTop: -48, gap: 16 }}>
                    <Animated.View style={[{ flexDirection: 'row', gap: 12 }, statsStyle]}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: colors.white,
                                borderRadius: radius.card,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                ...shadow.cardSubtle,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textSubtle }}>
                                Total Earned
                            </Text>
                            <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary, marginTop: 6 }}>
                                {totalEarned}
                            </Text>
                        </View>

                        <View
                            style={{
                                flex: 1,
                                backgroundColor: colors.white,
                                borderRadius: radius.card,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                ...shadow.cardSubtle,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textSubtle }}>
                                Avg Rating
                            </Text>
                            <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary, marginTop: 6 }}>
                                {avgRating}
                            </Text>
                        </View>
                    </Animated.View>

                    <Animated.View style={chartsStyle}>
                        {/* Line Chart */}
                        <View
                            style={{
                                backgroundColor: colors.white,
                                borderRadius: radius.card,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                ...shadow.cardSubtle,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary }}>
                                    Earnings (7 days)
                                </Text>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textSubtle }}>
                                    Completed only
                                </Text>
                            </View>

                            <View style={{ marginTop: 10, overflow: 'hidden', paddingRight: 6 }}>
                                <LineChart
                                    data={lineData.map((p): GiftedLinePoint => ({
                                        value: p.y,
                                        label: p.x,
                                        dataPointColor: colors.trainerPrimary,
                                    }))}
                                    height={180}
                                    width={chartWidth}
                                    spacing={Math.floor((chartWidth - 20) / 7)}
                                    initialSpacing={10}
                                    thickness={2}
                                    color={colors.trainerPrimary}
                                    dataPointsColor={colors.trainerPrimary}
                                    dataPointsRadius={4}
                                    areaChart
                                    startFillColor={colors.trainerPrimary}
                                    endFillColor={colors.trainerPrimary}
                                    startOpacity={0.18}
                                    endOpacity={0.02}
                                    yAxisColor={colors.surfaceBorder}
                                    xAxisColor={colors.surfaceBorder}
                                    yAxisTextStyle={{ color: colors.textSubtle, fontSize: 10 }}
                                    xAxisLabelTextStyle={{ color: colors.textSubtle, fontSize: 10 }}
                                    noOfSections={4}
                                    rulesType="solid"
                                    rulesColor={colors.surfaceBorder}
                                    yAxisTextNumberOfLines={1}
                                    hideYAxisText={false}
                                />
                            </View>
                        </View>

                        {/* Pie Chart */}
                        <View
                            style={{
                                marginTop: 16,
                                backgroundColor: colors.white,
                                borderRadius: radius.card,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                ...shadow.cardSubtle,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary }}>
                                    Session Status
                                </Text>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textSubtle }}>
                                    {`${totalSessions} total`}
                                </Text>
                            </View>

                            <View style={{ marginTop: 10, alignItems: 'center' }}>
                                <PieChart
                                    data={pieData.map((d): GiftedPieSlice => ({
                                        value: d.y,
                                        color: d.color,
                                    }))}
                                    radius={90}
                                    innerRadius={70}
                                    donut
                                />
                            </View>

                            {/* Color legend */}
                            {activeLegend.length > 0 && (
                                <View
                                    style={{
                                        marginTop: 14,
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: 8,
                                    }}
                                >
                                    {activeLegend.map((d) => (
                                        <View
                                            key={d.x}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                backgroundColor: colors.surface,
                                                borderRadius: radius.full,
                                                paddingHorizontal: 10,
                                                paddingVertical: 5,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: d.color,
                                                }}
                                            />
                                            <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                                {d.x}
                                            </Text>
                                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textSubtle }}>
                                                {d.y}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
