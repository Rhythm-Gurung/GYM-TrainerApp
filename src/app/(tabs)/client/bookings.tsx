import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBookings, useCancelBooking, useInitiatePayment } from '@/api/hooks/useBookSession';
import { clientService } from '@/api/services/client.service';
import TrainerBookingGroup, { type TrainerGroup } from '@/components/client/TrainerBookingGroup';
import { colors, fontSize, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { showErrorToast } from '@/lib';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import type { Booking } from '@/types/clientTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = Booking['status'];
type FilterValue = BookingStatus | 'all';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: FilterValue }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientBookings() {
    const tabBarHeight = useTabBarHeight();
    const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
    const { authState } = useAuth();

    const { data: bookings, isLoading, refetch } = useBookings();
    const { mutateAsync: cancelBooking } = useCancelBooking();
    const { mutateAsync: initiatePayment } = useInitiatePayment();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

    // Optimistic status overrides keyed by booking id
    const [statusOverrides, setStatusOverrides] = useState<Record<string, Booking['status']>>({});

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setStatusOverrides({});
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    const handleCancel = useCallback(async (id: string) => {
        try {
            const updated = await cancelBooking(id);
            setStatusOverrides((prev) => ({ ...prev, [id]: updated.status }));
            refetch();
        } catch {
            // error toast already handled by useApiMutation
        }
    }, [cancelBooking, refetch]);

    const handlePayNow = useCallback(async (booking: Booking) => {
        try {
            const { payment_url } = await initiatePayment(booking.id);
            await WebBrowser.openBrowserAsync(payment_url);
            // Browser closed — check payment result directly
            const result = await clientService.getPaymentStatus(booking.id);
            if (result.status === 'completed') {
                setStatusOverrides((prev) => ({ ...prev, [booking.id]: 'confirmed' }));
                setConfirmedBooking(booking);
                refetch();
            } else if (
                result.status === 'failed'
                || result.status === 'cancelled'
                || result.status === 'expired'
            ) {
                showErrorToast('Payment was not completed. Please try again.');
            }
        } catch {
            // initiatePayment errors are shown by useApiMutation toast
        }
    }, [initiatePayment, refetch]);

    // Apply status overrides on top of server data
    const allBookings = useMemo(
        () => (bookings ?? []).map((b) => {
            const override = statusOverrides[b.id];
            return override ? { ...b, status: override } : b;
        }),
        [bookings, statusOverrides],
    );

    // Group bookings by trainer — one card per trainer
    const filteredGroups = useMemo<TrainerGroup[]>(() => {
        const groups = Object.values(
            allBookings.reduce<Record<string, TrainerGroup>>((acc, booking) => {
                if (acc[booking.trainerId]) {
                    acc[booking.trainerId].bookings.push(booking);
                } else {
                    acc[booking.trainerId] = {
                        trainerId: booking.trainerId,
                        trainerName: booking.trainerName,
                        bookings: [booking],
                    };
                }
                return acc;
            }, {}),
        );
        if (activeFilter === 'all') return groups;
        return groups.filter((g) => g.bookings.some((b) => b.status === activeFilter));
    }, [allBookings, activeFilter]);

    return (
        <>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <View
                style={{
                    paddingHorizontal: 20,
                    paddingTop: 14,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                }}
            >
                <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                    My Bookings
                </Text>

                {/* Filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingTop: 12 }}
                >
                    {STATUS_TABS.map((tab) => {
                        const isActive = activeFilter === tab.value;
                        return (
                            <TouchableOpacity
                                key={tab.value}
                                onPress={() => setActiveFilter(tab.value)}
                                activeOpacity={0.75}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 7,
                                    borderRadius: radius.full,
                                    backgroundColor: isActive ? colors.primary : colors.surface,
                                    borderWidth: 1,
                                    borderColor: isActive ? colors.primary : colors.surfaceBorder,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.tag,
                                        fontWeight: '600',
                                        color: isActive ? colors.white : colors.textMuted,
                                    }}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── List ─────────────────────────────────────────────────────── */}
            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{
                        padding: 20,
                        paddingBottom: tabBarHeight + 16,
                        flexGrow: 1,
                    }}
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
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                            <TrainerBookingGroup key={group.trainerId} group={group} filterStatus={activeFilter} onCancel={handleCancel} onPayNow={handlePayNow} />
                        ))
                    ) : (
                        /* ── Empty state ─────────────────────────────────────── */
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
                            <View
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 20,
                                    backgroundColor: colors.surface,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons name="calendar-outline" size={28} color={colors.textDisabled} />
                            </View>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                                No bookings
                            </Text>
                            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
                                {`You don't have any ${activeFilter === 'all' ? '' : `${activeFilter} `}bookings yet.`}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}

        </SafeAreaView>

        {/* ── Payment success modal ─────────────────────────────────────── */}
        <Modal
            visible={!!confirmedBooking}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmedBooking(null)}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <View
                    style={{
                        backgroundColor: colors.white,
                        borderRadius: radius.card,
                        padding: 28,
                        width: '100%',
                        alignItems: 'center',
                    }}
                >
                    {/* Icon */}
                    <View
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: colors.statusNewBg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={36} color={colors.success} />
                    </View>

                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 }}>
                        Payment Confirmed!
                    </Text>
                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginBottom: 24, textAlign: 'center' }}>
                        Your booking has been confirmed.
                    </Text>

                    {/* Details */}
                    {confirmedBooking && (
                        <View style={{ width: '100%', gap: 10, marginBottom: 24 }}>
                            {[
                                {
                                    icon: 'person-outline' as const,
                                    label: 'Trainer',
                                    value: confirmedBooking.trainerName,
                                },
                                {
                                    icon: 'people-outline' as const,
                                    label: 'Client',
                                    value: authState.user?.full_name ?? authState.user?.username ?? '—',
                                },
                                {
                                    icon: 'calendar-outline' as const,
                                    label: 'Date',
                                    value: new Date(confirmedBooking.date).toLocaleDateString('en-IN', {
                                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                                    }),
                                },
                                {
                                    icon: 'time-outline' as const,
                                    label: 'Time',
                                    value: (() => {
                                        const to12h = (t: string) => {
                                            const [h, m] = t.split(':').map(Number);
                                            return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                                        };
                                        return `${to12h(confirmedBooking.startTime)} – ${to12h(confirmedBooking.endTime)}`;
                                    })(),
                                },
                                {
                                    icon: 'cash-outline' as const,
                                    label: 'Amount Paid',
                                    value: `₹${confirmedBooking.totalAmount.toLocaleString('en-IN')}`,
                                },
                            ].map(({ icon, label, value }) => (
                                <View
                                    key={label}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 10,
                                        backgroundColor: colors.surface,
                                        borderRadius: radius.md,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                    }}
                                >
                                    <Ionicons name={icon} size={16} color={colors.textSubtle} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, width: 76 }}>{label}</Text>
                                    <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                                        {value}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => setConfirmedBooking(null)}
                        activeOpacity={0.8}
                        style={{
                            width: '100%',
                            height: 44,
                            borderRadius: radius.md,
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
        </>
    );
}
