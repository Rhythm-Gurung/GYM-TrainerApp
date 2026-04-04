import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import khaltiLogo from '../../../assets/images/Khalti.png';

import { useTrainerDetail } from '@/api/hooks/useBookSession';
import BookingVerificationPanel from '@/components/ui/BookingVerificationPanel';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { resolveImageUrl } from '@/lib';
import type { Booking, BookingStatus } from '@/types/clientTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

// Status groupings for the minimalistic 4-tab approach
const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'accepted', 'confirmed', 'in_progress'];
const COMPLETED_STATUSES: BookingStatus[] = ['completed'];
const ISSUES_STATUSES: BookingStatus[] = ['disputed', 'no_show_client', 'session_was_taken_but_not_end_by_client', 'missed', 'cancelled', 'refund_pending', 'refunded'];

// Helper to check if a booking matches a filter
function bookingMatchesFilter(status: BookingStatus, filter: string): boolean {
    if (filter === 'all') return true;
    if (filter === 'active') return ACTIVE_STATUSES.includes(status);
    if (filter === 'completed') return COMPLETED_STATUSES.includes(status);
    if (filter === 'issues') return ISSUES_STATUSES.includes(status);
    // Fallback for direct status match (backwards compatibility)
    return status === filter;
}

export interface TrainerGroup {
    trainerId: string;
    trainerName: string;
    bookings: Booking[];
}

// ─── Status maps ──────────────────────────────────────────────────────────────

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

const STATUS_PRIORITY: BookingStatus[] = [
    'pending',
    'accepted',
    'confirmed',
    'in_progress',
    'completed',
    'disputed',
    'no_show_client',
    'session_was_taken_but_not_end_by_client',
    'missed',
    'refund_pending',
    'refunded',
    'cancelled',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    return name.split(' ').map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDateFull(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
    });
}

function to12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function getStatusCounts(bookings: Booking[]): Partial<Record<BookingStatus, number>> {
    return bookings.reduce<Partial<Record<BookingStatus, number>>>((acc, b) => {
        acc[b.status] = (acc[b.status] ?? 0) + 1;
        return acc;
    }, {});
}

function getDateRange(bookings: Booking[]): string {
    const dates = bookings.map((b) => b.date).sort();
    if (dates.length === 1) return formatDate(dates[0]);
    return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`;
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function DetailSheet({ group, filterStatus, focusBookingId, focusRequestId, onClose, onCancel, onPayNow, onPaySelected, onOpenChat, onLeaveReview, onDeleteReview, reviewsByBooking, trainerAvatar, unreadCountMap }: {
    group: TrainerGroup;
    filterStatus: string;
    focusBookingId?: string;
    focusRequestId?: string;
    onClose: () => void;
    onCancel: (id: string) => Promise<void> | void;
    onPayNow: (booking: Booking) => Promise<void> | void;
    onPaySelected: (bookings: Booking[]) => Promise<void> | void;
    onOpenChat: (booking: Booking) => void;
    onLeaveReview: (booking: Booking) => void;
    onDeleteReview: (booking: Booking) => void;
    reviewsByBooking: Record<string, string>;
    trainerAvatar?: string;
    unreadCountMap?: Record<string, number>;
}) {
    const { authState } = useAuth();
    const insets = useSafeAreaInsets();
    const visibleBookings = filterStatus === 'all'
        ? group.bookings
        : group.bookings.filter((b) => bookingMatchesFilter(b.status, filterStatus));
    const totalAmount = visibleBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const sorted = [...visibleBookings].sort((a, b) => a.date.localeCompare(b.date));
    const activeChatBookings = sorted.filter((b) => b.status === 'confirmed' || b.status === 'in_progress');
    const primaryConfirmedBooking = activeChatBookings[0] ?? null;
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(() => new Set());
    const [isBulkPaying, setIsBulkPaying] = useState(false);
    const [isBulkCancelling, setIsBulkCancelling] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const hasFocusScrolled = useRef(false);

    const acceptedBookings = sorted.filter((b) => b.status === 'accepted');
    const acceptedIds = acceptedBookings.map((b) => b.id);
    const cancellableBookings = sorted.filter((b) => b.status === 'pending' || b.status === 'accepted');
    // For bulk selection, check if we're in active filter with accepted bookings
    const isActiveFilterWithAccepted = filterStatus === 'active' && acceptedBookings.length > 0;
    const selectableIds = isActiveFilterWithAccepted ? acceptedIds : cancellableBookings.map((b) => b.id);
    const selectedCount = selectedBookingIds.size;
    const allSelectableSelected = selectableIds.length > 0
        && selectableIds.every((id) => selectedBookingIds.has(id));
    const isAcceptedSelection = isActiveFilterWithAccepted;
    const selectedAcceptedTotal = acceptedBookings.reduce((sum, booking) => (
        selectedBookingIds.has(booking.id) ? sum + booking.totalAmount : sum
    ), 0);

    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectionMode(false);
            setSelectedBookingIds(new Set());
            return;
        }
        setSelectionMode(true);
    };

    const toggleBookingSelection = (id: string) => {
        setSelectedBookingIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelectableSelected) {
            setSelectedBookingIds(new Set());
            return;
        }
        setSelectedBookingIds(new Set(selectableIds));
    };

    const runBulkPay = async () => {
        if (!isAcceptedSelection) return;
        const selected = acceptedBookings.filter((b) => selectedBookingIds.has(b.id));
        if (selected.length === 0) return;

        setIsBulkPaying(true);
        try {
            await Promise.resolve(onPaySelected(selected));
            setSelectedBookingIds(new Set());
            setSelectionMode(false);
        } finally {
            setIsBulkPaying(false);
        }
    };

    const runBulkCancel = async () => {
        const ids = Array.from(selectedBookingIds);
        if (ids.length === 0) return;

        setIsBulkCancelling(true);
        try {
            const batches = Array.from(
                { length: Math.ceil(ids.length / 5) },
                (_, index) => ids.slice(index * 5, index * 5 + 5),
            );
            await batches.reduce<Promise<void>>(
                (chain, batch) => chain.then(() => Promise.all(batch.map((id) => Promise.resolve(onCancel(id)))).then(() => { })),
                Promise.resolve(),
            );
            setSelectedBookingIds(new Set());
            setSelectionMode(false);
        } finally {
            setIsBulkCancelling(false);
        }
    };

    const confirmBulkPay = () => {
        if (!isAcceptedSelection || selectedCount === 0 || isBulkPaying || isBulkCancelling) return;
        Alert.alert(
            'Pay selected bookings?',
            `Proceed to payment for ${selectedCount} accepted booking${selectedCount !== 1 ? 's' : ''}?`,
            [
                { text: 'Not now', style: 'cancel' },
                { text: 'Pay selected', onPress: () => { runBulkPay().catch(() => { }); } },
            ],
        );
    };

    const confirmBulkCancel = () => {
        if (selectedCount === 0 || isBulkPaying || isBulkCancelling) return;
        Alert.alert(
            'Cancel selected bookings?',
            `Cancel ${selectedCount} booking request${selectedCount !== 1 ? 's' : ''}? This cannot be undone.`,
            [
                { text: 'Keep them', style: 'cancel' },
                { text: 'Cancel selected', style: 'destructive', onPress: () => { runBulkCancel().catch(() => { }); } },
            ],
        );
    };

    const confirmCancel = (id: string, dateStr: string) => {
        Alert.alert(
            'Cancel booking?',
            `Cancel your session on ${formatDateFull(dateStr)}? This cannot be undone.`,
            [
                { text: 'Keep it', style: 'cancel' },
                { text: 'Cancel booking', style: 'destructive', onPress: () => onCancel(id) },
            ],
        );
    };

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.white,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '92%',
                paddingBottom: Math.max(insets.bottom, 16),
            }}
        >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder }} />
            </View>

            {(filterStatus === 'active' || filterStatus === 'all') && primaryConfirmedBooking && (
                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
                    <TouchableOpacity
                        onPress={() => {
                            onClose();
                            onOpenChat(primaryConfirmedBooking);
                        }}
                        activeOpacity={0.8}
                        style={{
                            height: 42,
                            borderRadius: radius.md,
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 6,
                        }}
                    >
                        <Ionicons name="chatbubbles-outline" size={15} color={colors.white} />
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                            Chat with trainer
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                        style={{
                            width: 46,
                            height: 46,
                            borderRadius: radius.full,
                            backgroundColor: colors.primaryMuted,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {trainerAvatar ? (
                            <ExpoImage
                                source={{
                                    uri: resolveImageUrl(trainerAvatar),
                                    headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                cachePolicy="none"
                            />
                        ) : (
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.primary }}>
                                {getInitials(group.trainerName)}
                            </Text>
                        )}
                    </View>
                    <View>
                        <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.textPrimary }}>
                            {group.trainerName}
                        </Text>
                        <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, marginTop: 1 }}>
                            {`${sorted.length} session${sorted.length !== 1 ? 's' : ''} · ₹${totalAmount.toLocaleString('en-IN')} total`}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Bulk actions */}
            {selectableIds.length > 0 && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingTop: 14,
                        paddingBottom: 12,
                    }}
                >
                    <TouchableOpacity
                        onPress={toggleSelectionMode}
                        activeOpacity={0.8}
                        style={{
                            height: 36,
                            borderRadius: radius.full,
                            paddingHorizontal: 14,
                            backgroundColor: selectionMode ? colors.primaryMuted : colors.surface,
                            borderWidth: 1,
                            borderColor: selectionMode ? colors.primary : colors.surfaceBorder,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: selectionMode ? colors.primary : colors.textSecondary }}>
                            {selectionMode ? 'Done' : 'Select'}
                        </Text>
                    </TouchableOpacity>

                    {selectionMode && (
                        <TouchableOpacity
                            onPress={toggleSelectAll}
                            activeOpacity={0.8}
                            style={{
                                height: 36,
                                borderRadius: radius.full,
                                paddingHorizontal: 14,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.textSecondary }}>
                                {allSelectableSelected ? 'Clear all' : 'Select all'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Booking list */}
            <ScrollView
                ref={scrollViewRef}
                style={{ marginTop: 6 }}
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingBottom: selectionMode ? 14 : 22,
                    paddingTop: 4,
                }}
                showsVerticalScrollIndicator={false}
            >
                {sorted.map((booking) => {
                    const cancellable = booking.status === 'pending' || booking.status === 'accepted';
                    const selectable = selectableIds.includes(booking.id);
                    const isSelected = selectedBookingIds.has(booking.id);
                    const isFocusedBooking = focusBookingId === booking.id;
                    return (
                        <View
                            key={booking.id}
                            onLayout={isFocusedBooking ? (e) => {
                                if (!hasFocusScrolled.current) {
                                    hasFocusScrolled.current = true;
                                    scrollViewRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: true });
                                }
                            } : undefined}
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: radius.card,
                                padding: 18,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: isFocusedBooking ? colors.primary : colors.surfaceBorder,
                            }}
                        >
                            {/* Date + status + unread badge */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {selectionMode && selectable && (
                                        <TouchableOpacity
                                            onPress={() => toggleBookingSelection(booking.id)}
                                            activeOpacity={0.75}
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 6,
                                                borderWidth: 1.5,
                                                borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                                                backgroundColor: isSelected ? colors.primary : colors.white,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isSelected && <Ionicons name="checkmark" size={14} color={colors.white} />}
                                        </TouchableOpacity>
                                    )}
                                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                        {formatDateFull(booking.date)}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 4,
                                            paddingHorizontal: 8,
                                            paddingVertical: 3,
                                            borderRadius: radius.full,
                                            backgroundColor: STATUS_BG[booking.status],
                                        }}
                                    >
                                        <Ionicons name={STATUS_ICON[booking.status]} size={11} color={STATUS_COLOR[booking.status]} />
                                        <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: STATUS_COLOR[booking.status] }}>
                                            {STATUS_LABEL[booking.status]}
                                        </Text>
                                    </View>
                                    {(booking.status === 'confirmed' || booking.status === 'in_progress') && unreadCountMap && unreadCountMap[booking.id] != null && unreadCountMap[booking.id] > 0 && (
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
                                                {unreadCountMap[booking.id] > 99 ? '99+' : unreadCountMap[booking.id]}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Time + amount */}
                            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', rowGap: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Ionicons name="time-outline" size={13} color={colors.textSubtle} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>
                                        {`${to12h(booking.startTime)} – ${to12h(booking.endTime)}`}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Ionicons name="cash-outline" size={13} color={colors.textSubtle} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>
                                        {`₹${booking.totalAmount.toLocaleString('en-IN')}`}
                                    </Text>
                                </View>
                            </View>

                            {/* Pay Now — only when trainer has accepted */}
                            {booking.status === 'accepted' && !selectionMode && (
                                <TouchableOpacity
                                    onPress={() => {
                                        onClose();
                                        onPayNow(booking);
                                    }}
                                    activeOpacity={0.8}
                                    style={{
                                        marginTop: 14,
                                        height: 42,
                                        borderRadius: radius.md,
                                        backgroundColor: colors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 8,
                                    }}
                                >
                                    <ExpoImage
                                        source={khaltiLogo}
                                        style={{ width: 20, height: 20, borderRadius: 4 }}
                                        contentFit="contain"
                                    />
                                    <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                        {`Pay with Khalti  ₹${booking.totalAmount.toLocaleString('en-IN')}`}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Refund message */}
                            {booking.status === 'refund_pending' && (
                                <View
                                    style={{
                                        marginTop: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        backgroundColor: colors.accentBg,
                                        borderRadius: radius.md,
                                        paddingHorizontal: 12,
                                        paddingVertical: 9,
                                    }}
                                >
                                    <Ionicons name="information-circle-outline" size={13} color={colors.accent} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.accent, fontWeight: '600', flex: 1 }}>
                                        Cancelled — 70% refund will be processed within a few days
                                    </Text>
                                </View>
                            )}

                            {/* Cancel button — only for pending / accepted */}
                            {cancellable && !selectionMode && (
                                <TouchableOpacity
                                    onPress={() => confirmCancel(booking.id, booking.date)}
                                    activeOpacity={0.8}
                                    style={{
                                        marginTop: 14,
                                        height: 40,
                                        borderRadius: radius.md,
                                        borderWidth: 1.5,
                                        borderColor: colors.error,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 5,
                                    }}
                                >
                                    <Ionicons name="close-circle-outline" size={14} color={colors.error} />
                                    <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.error }}>
                                        Cancel booking
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Review section — only for completed bookings */}
                            {booking.status === 'completed' && !selectionMode && (
                                reviewsByBooking[booking.id] ? (
                                    // Review already sent - show status + delete button
                                    <View style={{ marginTop: 14, gap: 8 }}>
                                        {/* Review Sent status button */}
                                        <TouchableOpacity
                                            disabled
                                            style={{
                                                height: 42,
                                                borderRadius: radius.md,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1.5,
                                                borderColor: colors.success,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                                gap: 8,
                                            }}
                                        >
                                            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.success }}>
                                                Review Sent
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Delete review button */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                onClose();
                                                onDeleteReview(booking);
                                            }}
                                            activeOpacity={0.8}
                                            style={{
                                                height: 40,
                                                borderRadius: radius.md,
                                                borderWidth: 1.5,
                                                borderColor: colors.error,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                                gap: 5,
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={14} color={colors.error} />
                                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.error }}>
                                                Delete Review
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    // No review yet - show Leave Review button
                                    <TouchableOpacity
                                        onPress={() => {
                                            onClose();
                                            onLeaveReview(booking);
                                        }}
                                        activeOpacity={0.8}
                                        style={{
                                            marginTop: 14,
                                            height: 42,
                                            borderRadius: radius.md,
                                            backgroundColor: colors.primary,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            gap: 8,
                                        }}
                                    >
                                        <Ionicons name="star-outline" size={16} color={colors.white} />
                                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                            Leave Review
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}

                            <BookingVerificationPanel
                                bookingId={booking.id}
                                bookingDate={booking.date}
                                bookingStatus={booking.status}
                                viewerRole="client"
                                focusRequestId={focusRequestId}
                            />
                        </View>
                    );
                })}
            </ScrollView>

            {selectionMode && (
                <View
                    style={{
                        borderTopWidth: 1,
                        borderTopColor: colors.surfaceBorder,
                        paddingHorizontal: 20,
                        paddingTop: 14,
                        paddingBottom: 14,
                        gap: 14,
                    }}
                >
                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>
                        {`${selectedCount} selected`}
                    </Text>
                    {isAcceptedSelection && (
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                            {`Total to pay: ₹${selectedAcceptedTotal.toLocaleString('en-IN')}`}
                        </Text>
                    )}
                    {isAcceptedSelection ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                onPress={confirmBulkPay}
                                disabled={selectedCount === 0 || isBulkPaying || isBulkCancelling}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: radius.md,
                                    backgroundColor: selectedCount > 0 && !isBulkPaying && !isBulkCancelling ? colors.primary : colors.textDisabled,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    gap: 6,
                                }}
                            >
                                <ExpoImage
                                    source={khaltiLogo}
                                    style={{ width: 18, height: 18, borderRadius: 4 }}
                                    contentFit="contain"
                                />
                                <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                    {isBulkPaying ? 'Paying with Khalti...' : `Pay with Khalti (${selectedCount})`}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={confirmBulkCancel}
                                disabled={selectedCount === 0 || isBulkPaying || isBulkCancelling}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: radius.md,
                                    backgroundColor: selectedCount > 0 && !isBulkPaying && !isBulkCancelling ? colors.error : colors.textDisabled,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    gap: 6,
                                }}
                            >
                                <Ionicons name="close-circle-outline" size={15} color={colors.white} />
                                <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                    {isBulkCancelling ? 'Cancelling...' : `Cancel selected (${selectedCount})`}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={confirmBulkCancel}
                            disabled={selectedCount === 0 || isBulkPaying || isBulkCancelling}
                            activeOpacity={0.8}
                            style={{
                                height: 44,
                                borderRadius: radius.md,
                                backgroundColor: selectedCount > 0 && !isBulkPaying && !isBulkCancelling ? colors.error : colors.textDisabled,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 6,
                            }}
                        >
                            <Ionicons name="trash-outline" size={15} color={colors.white} />
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                {isBulkCancelling ? 'Cancelling...' : `Cancel selected (${selectedCount})`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

export default function TrainerBookingGroup({ group, filterStatus, onCancel, onPayNow, onPaySelected, onOpenChat, onLeaveReview, onDeleteReview, reviewsByBooking, unreadCountMap, focusBookingId, focusRequestId }: {
    group: TrainerGroup;
    filterStatus: string;
    onCancel: (id: string) => Promise<void> | void;
    onPayNow: (booking: Booking) => Promise<void> | void;
    onPaySelected: (bookings: Booking[]) => Promise<void> | void;
    onOpenChat: (booking: Booking) => void;
    onLeaveReview: (booking: Booking) => void;
    onDeleteReview: (booking: Booking) => void;
    reviewsByBooking: Record<string, string>;
    unreadCountMap?: Record<string, number>;
    focusBookingId?: string;
    focusRequestId?: string;
}) {
    const { authState } = useAuth();
    const [sheetOpen, setSheetOpen] = useState(() => (
        Boolean(focusBookingId && group.bookings.some((booking) => booking.id === focusBookingId))
    ));

    // Auto-open sheet when navigating to a specific booking (e.g., from notification)
    useEffect(() => {
        if (!focusBookingId || !group.bookings.some((booking) => booking.id === focusBookingId)) return;

        setTimeout(() => {
            setSheetOpen(true);
        }, 0);
    }, [focusBookingId, focusRequestId, group.bookings, group.trainerId, group.trainerName]);

    const { data: trainerDetail } = useTrainerDetail(group.trainerId);

    const visibleBookings = filterStatus === 'all'
        ? group.bookings
        : group.bookings.filter((b) => bookingMatchesFilter(b.status, filterStatus));

    const counts = getStatusCounts(visibleBookings);
    const dateRange = getDateRange(visibleBookings);
    const totalAmount = visibleBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingCount = counts.pending ?? 0;
    const totalUnread = visibleBookings.reduce((sum, b) => sum + (unreadCountMap?.[b.id] ?? 0), 0);
    const resolvedTrainerAvatar = visibleBookings.find((b) => b.trainerAvatar)?.trainerAvatar
        ?? group.bookings.find((b) => b.trainerAvatar)?.trainerAvatar
        ?? trainerDetail?.avatar
        ?? undefined;

    return (
        <>
            <TouchableOpacity
                onPress={() => setSheetOpen(true)}
                activeOpacity={0.75}
                style={{
                    backgroundColor: colors.white,
                    borderRadius: radius.card,
                    borderWidth: 1,
                    borderColor: pendingCount > 0 ? `${colors.accent}40` : colors.surfaceBorder,
                    marginBottom: 12,
                    padding: 16,
                    ...shadow.card,
                }}
            >
                {/* Trainer row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: radius.full,
                                backgroundColor: colors.primaryMuted,
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {resolvedTrainerAvatar ? (
                                <ExpoImage
                                    source={{
                                        uri: resolveImageUrl(resolvedTrainerAvatar),
                                        headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    cachePolicy="none"
                                />
                            ) : (
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.primary }}>
                                    {getInitials(group.trainerName)}
                                </Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                                {group.trainerName}
                            </Text>
                            <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, marginTop: 2 }}>
                                {dateRange}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: radius.full,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.textSecondary }}>
                                {`${visibleBookings.length} session${visibleBookings.length !== 1 ? 's' : ''}`}
                            </Text>
                        </View>
                        {/* Unread badge */}
                        {totalUnread > 0 && (
                            <View
                                style={{
                                    minWidth: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: colors.error,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.white }}>
                                    {totalUnread > 99 ? '99+' : totalUnread}
                                </Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                    </View>
                </View>

                {/* Status summary + total */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                        {/* Always show status breakdown badges */}
                        {(STATUS_PRIORITY.filter((s) => (counts[s] ?? 0) > 0) as BookingStatus[]).map((status) => (
                            <View
                                key={status}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: radius.full,
                                    backgroundColor: STATUS_BG[status],
                                }}
                            >
                                <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: STATUS_COLOR[status] }}>
                                    {`${counts[status]} ${STATUS_LABEL[status]}`}
                                </Text>
                            </View>
                        ))}
                    </View>
                    <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.textSecondary }}>
                        {`₹${totalAmount.toLocaleString('en-IN')}`}
                    </Text>
                </View>
            </TouchableOpacity>

            <Modal
                visible={sheetOpen}
                transparent
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setSheetOpen(false)}
            >
                <View style={{ flex: 1 }}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            backgroundColor: 'rgba(0,0,0,0.45)',
                        }}
                        activeOpacity={1}
                        onPress={() => setSheetOpen(false)}
                    />
                    <DetailSheet
                        group={group}
                        filterStatus={filterStatus}
                        focusBookingId={focusBookingId}
                        focusRequestId={focusRequestId}
                        onClose={() => setSheetOpen(false)}
                        onCancel={onCancel}
                        onPayNow={onPayNow}
                        onPaySelected={onPaySelected}
                        onOpenChat={onOpenChat}
                        onLeaveReview={onLeaveReview}
                        onDeleteReview={onDeleteReview}
                        reviewsByBooking={reviewsByBooking}
                        trainerAvatar={resolvedTrainerAvatar}
                        unreadCountMap={unreadCountMap}
                    />
                </View>
            </Modal>
        </>
    );
}
