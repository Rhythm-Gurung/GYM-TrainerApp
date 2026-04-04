import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { colors, fontSize, radius } from '@/constants/theme';
import type { Booking } from '@/types/clientTypes';

// ─── Status maps ──────────────────────────────────────────────────────────────

type BookingStatus = Booking['status'];

const STATUS_LABEL: Record<BookingStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
    no_show_client: 'No Show',
    session_was_taken_but_not_end_by_client: 'End Missed',
    missed: 'Missed',
    refund_pending: 'Refund Pending',
    refunded: 'Refunded',
};

const STATUS_COLOR: Record<BookingStatus, string> = {
    pending: colors.accent,
    accepted: colors.primary,
    confirmed: colors.primary,
    in_progress: colors.action,
    completed: colors.success,
    disputed: colors.error,
    cancelled: colors.error,
    no_show_client: colors.warning,
    session_was_taken_but_not_end_by_client: colors.warning,
    missed: colors.warning,
    refund_pending: colors.accent,
    refunded: colors.success,
};

const STATUS_BG: Record<BookingStatus, string> = {
    pending: colors.accentBg,
    accepted: colors.primaryMuted,
    confirmed: colors.primaryMuted,
    in_progress: colors.actionBg,
    completed: colors.statusNewBg,
    disputed: colors.errorBg,
    cancelled: colors.errorBg,
    no_show_client: colors.accentBg,
    session_was_taken_but_not_end_by_client: colors.accentBg,
    missed: colors.accentBg,
    refund_pending: colors.accentBg,
    refunded: colors.statusNewBg,
};

const STATUS_ICON: Record<BookingStatus, keyof typeof Ionicons.glyphMap> = {
    pending: 'time-outline',
    accepted: 'checkmark-circle-outline',
    confirmed: 'checkmark-circle-outline',
    in_progress: 'play-circle-outline',
    completed: 'trophy-outline',
    disputed: 'warning-outline',
    cancelled: 'close-circle-outline',
    no_show_client: 'alert-circle-outline',
    session_was_taken_but_not_end_by_client: 'alert-circle-outline',
    missed: 'alert-circle-outline',
    refund_pending: 'refresh-outline',
    refunded: 'checkmark-done-outline',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface BookingCardProps {
    booking: Booking;
    /** Optional shared value for coordinated stagger animations from the parent. */
    animX?: SharedValue<number>;
    /** Unread message count for this booking (shows badge if > 0). */
    unreadCount?: number;
}

export default function BookingCard({ booking, animX, unreadCount }: BookingCardProps) {
    // Fallback for when the parent doesn't supply an animX (e.g. dynamic lists)
    const fallbackX = useSharedValue(0);
    const xValue = animX ?? fallbackX;
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: xValue.value }],
    }));

    return (
        <Animated.View style={[animStyle, { marginBottom: 10, overflow: 'visible' }]}>
            <View
                style={{
                    backgroundColor: colors.white,
                    borderRadius: radius.card,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                }}
            >
                {/* Trainer name + status badge + unread badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text
                        style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: 8 }}
                        numberOfLines={1}
                    >
                        {booking.trainerName}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Status badge */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: radius.full,
                                backgroundColor: STATUS_BG[booking.status],
                            }}
                        >
                            <Ionicons name={STATUS_ICON[booking.status]} size={12} color={STATUS_COLOR[booking.status]} />
                            <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: STATUS_COLOR[booking.status] }}>
                                {STATUS_LABEL[booking.status]}
                            </Text>
                        </View>

                        {/* Unread message badge (only for confirmed bookings) */}
                        {booking.status === 'confirmed' && unreadCount != null && unreadCount > 0 && (
                            <View
                                style={{
                                    minWidth: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: colors.error,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.white }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.surfaceBorder, marginBottom: 12 }} />

                {/* Session details */}
                <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSubtle} />
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                            {formatDate(booking.date)}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="time-outline" size={14} color={colors.textSubtle} />
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                            {`${booking.startTime} – ${booking.endTime}`}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="cash-outline" size={14} color={colors.textSubtle} />
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                            {`₹${booking.totalAmount.toLocaleString('en-IN')}`}
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}
