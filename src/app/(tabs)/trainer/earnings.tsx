import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
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
import { colors, fontSize, gradientColors } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTrainerEarnings } from '@/api/hooks';
import type { TrainerPayout } from '@/types/trainerTypes';
import type { Transaction } from '@/types/trainerTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function payoutToTransaction(payout: TrainerPayout): Transaction {
    return {
        id: String(payout.payout_id),
        description: `${payout.client_name} · ${payout.payout_type_label} (${payout.status_label})`,
        amount: payout.amount_rs,
        type: payout.status === 'transferred' ? 'credit' : 'debit',
        date: payout.transferred_at ?? payout.booking_date,
    };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const SLIDE = 40;
const DUR = 300;

export default function TrainerEarnings() {
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();

    const { data, isLoading, refetch, isFetching } = useTrainerEarnings();

    const statsY = useSharedValue(SLIDE);
    const txY = useSharedValue(SLIDE);
    const anim = useRef({ statsY, txY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };
            v.statsY.value = SLIDE;
            v.statsY.value = withTiming(0, ease);
            v.txY.value = SLIDE;
            v.txY.value = withDelay(80, withTiming(0, ease));
        }, []),
    );

    const statsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: statsY.value }] }));
    const txStyle = useAnimatedStyle(() => ({ transform: [{ translateY: txY.value }] }));

    const summary = data?.summary;
    const payouts = data?.payouts ?? [];

    const statValues: Record<string, string> = {
        total_earned: summary ? `Rs. ${summary.total_earned_rs.toLocaleString('en-IN')}` : '—',
        pending_transfer: summary ? `Rs. ${summary.pending_transfer_rs.toLocaleString('en-IN')}` : '—',
        on_hold: summary ? `Rs. ${summary.on_hold_rs.toLocaleString('en-IN')}` : '—',
        total_bookings: summary ? String(summary.total_bookings_paid) : '—',
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
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor={colors.trainerPrimary}
                        colors={[colors.trainerPrimary]}
                    />
                )}
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

                    {/* Payouts list */}
                    <Animated.View style={txStyle}>
                        <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
                            Payout History
                        </Text>

                        {payouts.length === 0 ? (
                            <Text style={{ fontSize: fontSize.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>
                                No payouts yet
                            </Text>
                        ) : (
                            payouts.map((payout) => (
                                <TransactionCard key={payout.payout_id} transaction={payoutToTransaction(payout)} />
                            ))
                        )}
                    </Animated.View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
