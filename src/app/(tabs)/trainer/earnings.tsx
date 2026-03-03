import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
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
import TransactionCard from '@/components/trainer/TransactionCard';
import HeroGradient from '@/components/ui/HeroGradient';
import { EARNINGS_STAT_CONFIGS } from '@/constants/trainerEarnings.constants';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast } from '@/lib';
import { fetchMockEarnings } from '@/mockData/trainerEarnings.mock';
import type { EarningsSummary } from '@/types/clientTypes';
import type { Transaction } from '@/types/trainerTypes';

// ─── Screen ───────────────────────────────────────────────────────────────────

const SLIDE = 40;
const DUR = 300;

export default function TrainerEarnings() {
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();

    const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const statsY = useSharedValue(SLIDE);
    const commissionY = useSharedValue(SLIDE);
    const txY = useSharedValue(SLIDE);
    const anim = useRef({ statsY, commissionY, txY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };
            v.statsY.value = SLIDE;
            v.statsY.value = withTiming(0, ease);
            v.commissionY.value = SLIDE;
            v.commissionY.value = withDelay(80, withTiming(0, ease));
            v.txY.value = SLIDE;
            v.txY.value = withDelay(160, withTiming(0, ease));
        }, []),
    );

    useFocusEffect(
        useCallback(() => {
            fetchMockEarnings()
                .then(({ earnings: e, transactions: t }) => {
                    setEarnings(e);
                    setTransactions(t);
                })
                .catch(() => showErrorToast('Failed to load earnings', 'Error'))
                .finally(() => setIsLoading(false));
        }, []),
    );

    const statsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: statsY.value }] }));
    const commissionStyle = useAnimatedStyle(() => ({ transform: [{ translateY: commissionY.value }] }));
    const txStyle = useAnimatedStyle(() => ({ transform: [{ translateY: txY.value }] }));

    const commissionPct = earnings
        ? Math.round((earnings.commissionPaid / earnings.totalEarnings) * 100)
        : 0;

    const statValues: Record<string, string> = {
        earnings: earnings ? `₹${earnings.totalEarnings.toLocaleString('en-IN')}` : '—',
        pending: earnings ? `₹${earnings.pendingPayouts.toLocaleString('en-IN')}` : '—',
        completed: earnings ? `₹${earnings.completedPayouts.toLocaleString('en-IN')}` : '—',
        commission: earnings ? `₹${earnings.commissionPaid.toLocaleString('en-IN')}` : '—',
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
            >
                {/* Hero title */}
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.white }}>
                        Earnings
                    </Text>
                    <Text style={{ fontSize: fontSize.body, color: colors.white65, marginTop: 2, fontWeight: '500' }}>
                        Track your income &amp; payouts
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 20, marginTop: -48, gap: 20 }}>

                    {/* Stats 2×2 grid */}
                    <Animated.View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, statsStyle]}>
                        {EARNINGS_STAT_CONFIGS.map((cfg) => (
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

                    {/* Commission Breakdown */}
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
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>
                            Commission Breakdown
                        </Text>

                        <View style={{ gap: 10 }}>
                            {/* Rate row */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Rate</Text>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                    {`${earnings?.commissionRate ?? 0}%`}
                                </Text>
                            </View>

                            {/* Total paid row */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Total Paid</Text>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                    {`₹${earnings?.commissionPaid.toLocaleString('en-IN') ?? 0}`}
                                </Text>
                            </View>

                            {/* Progress bar */}
                            <View
                                style={{
                                    height: 10,
                                    backgroundColor: colors.surface,
                                    borderRadius: radius.full,
                                    overflow: 'hidden',
                                    marginTop: 4,
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
                        </View>
                    </Animated.View>

                    {/* Recent Transactions */}
                    <Animated.View style={txStyle}>
                        <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
                            Recent Transactions
                        </Text>

                        {transactions.map((txn) => (
                            <TransactionCard key={txn.id} transaction={txn} />
                        ))}
                    </Animated.View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
