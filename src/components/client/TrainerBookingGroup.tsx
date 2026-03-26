import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrainerDetail } from '@/api/hooks/useBookSession';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { resolveImageUrl } from '@/lib';
import type { Booking, BookingStatus } from '@/types/clientTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

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
    completed: 'Completed',
    cancelled: 'Cancelled',
    refund_pending: 'Refund Pending',
    refunded: 'Refunded',
};

const STATUS_COLOR: Record<BookingStatus, string> = {
    pending: colors.accent,
    accepted: colors.primary,
    confirmed: colors.primary,
    completed: colors.success,
    cancelled: colors.error,
    refund_pending: colors.accent,
    refunded: colors.success,
};

const STATUS_BG: Record<BookingStatus, string> = {
    pending: colors.accentBg,
    accepted: colors.primaryMuted,
    confirmed: colors.primaryMuted,
    completed: colors.statusNewBg,
    cancelled: colors.errorBg,
    refund_pending: colors.accentBg,
    refunded: colors.statusNewBg,
};

const STATUS_ICON: Record<BookingStatus, keyof typeof Ionicons.glyphMap> = {
    pending: 'time-outline',
    accepted: 'checkmark-circle-outline',
    confirmed: 'checkmark-circle-outline',
    completed: 'trophy-outline',
    cancelled: 'close-circle-outline',
    refund_pending: 'refresh-outline',
    refunded: 'checkmark-done-outline',
};

const STATUS_PRIORITY: BookingStatus[] = [
    'pending', 'accepted', 'confirmed', 'completed', 'refund_pending', 'refunded', 'cancelled',
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

function DetailSheet({ group, filterStatus, onClose, onCancel, onPayNow, trainerAvatar }: {
    group: TrainerGroup;
    filterStatus: string;
    onClose: () => void;
    onCancel: (id: string) => void;
    onPayNow: (booking: Booking) => void;
    trainerAvatar?: string;
}) {
    const { authState } = useAuth();
    const insets = useSafeAreaInsets();
    const visibleBookings = filterStatus === 'all'
        ? group.bookings
        : group.bookings.filter((b) => b.status === filterStatus);
    const totalAmount = visibleBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const sorted = [...visibleBookings].sort((a, b) => a.date.localeCompare(b.date));

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
                maxHeight: '88%',
                paddingBottom: Math.max(insets.bottom, 16),
            }}
        >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder }} />
            </View>

            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                        style={{
                            width: 42,
                            height: 42,
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

            {/* Booking list */}
            <ScrollView
                style={{ marginTop: 8 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
            >
                {sorted.map((booking) => {
                    const cancellable = booking.status === 'pending' || booking.status === 'accepted';
                    return (
                        <View
                            key={booking.id}
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: radius.card,
                                padding: 14,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                            }}
                        >
                            {/* Date + status */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                    {formatDateFull(booking.date)}
                                </Text>
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
                            </View>

                            {/* Time + amount */}
                            <View style={{ flexDirection: 'row', gap: 16 }}>
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
                            {booking.status === 'accepted' && (
                                <TouchableOpacity
                                    onPress={() => {
                                        onClose();
                                        onPayNow(booking);
                                    }}
                                    activeOpacity={0.8}
                                    style={{
                                        marginTop: 12,
                                        height: 38,
                                        borderRadius: radius.md,
                                        backgroundColor: colors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 6,
                                    }}
                                >
                                    <Ionicons name="card-outline" size={15} color={colors.white} />
                                    <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                        {`Pay Now  ₹${booking.totalAmount.toLocaleString('en-IN')}`}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Refund message */}
                            {booking.status === 'refund_pending' && (
                                <View
                                    style={{
                                        marginTop: 10,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        backgroundColor: colors.accentBg,
                                        borderRadius: radius.md,
                                        paddingHorizontal: 10,
                                        paddingVertical: 7,
                                    }}
                                >
                                    <Ionicons name="information-circle-outline" size={13} color={colors.accent} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.accent, fontWeight: '600', flex: 1 }}>
                                        Cancelled — 70% refund will be processed within a few days
                                    </Text>
                                </View>
                            )}

                            {/* Cancel button — only for pending / accepted */}
                            {cancellable && (
                                <TouchableOpacity
                                    onPress={() => confirmCancel(booking.id, booking.date)}
                                    activeOpacity={0.8}
                                    style={{
                                        marginTop: 12,
                                        height: 34,
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
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

export default function TrainerBookingGroup({ group, filterStatus, onCancel, onPayNow }: {
    group: TrainerGroup;
    filterStatus: string;
    onCancel: (id: string) => void;
    onPayNow: (booking: Booking) => void;
}) {
    const { authState } = useAuth();
    const [sheetOpen, setSheetOpen] = useState(false);

    const { data: trainerDetail } = useTrainerDetail(group.trainerId);

    const visibleBookings = filterStatus === 'all'
        ? group.bookings
        : group.bookings.filter((b) => b.status === filterStatus);

    const counts = getStatusCounts(visibleBookings);
    const dateRange = getDateRange(visibleBookings);
    const totalAmount = visibleBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingCount = counts.pending ?? 0;
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
                                {`${group.bookings.length} session${group.bookings.length !== 1 ? 's' : ''}`}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                    </View>
                </View>

                {/* Status summary + total */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                        {filterStatus === 'all' ? (
                            (STATUS_PRIORITY.filter((s) => (counts[s] ?? 0) > 0) as BookingStatus[]).map((status) => (
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
                            ))
                        ) : (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: radius.full,
                                    backgroundColor: STATUS_BG[filterStatus as BookingStatus] ?? colors.surface,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.caption,
                                        fontWeight: '600',
                                        color: STATUS_COLOR[filterStatus as BookingStatus] ?? colors.textMuted,
                                    }}
                                >
                                    {`${visibleBookings.length} ${STATUS_LABEL[filterStatus as BookingStatus] ?? filterStatus}`}
                                </Text>
                            </View>
                        )}
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
                onRequestClose={() => setSheetOpen(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
                    activeOpacity={1}
                    onPress={() => setSheetOpen(false)}
                />
                <DetailSheet
                    group={group}
                    filterStatus={filterStatus}
                    onClose={() => setSheetOpen(false)}
                    onCancel={onCancel}
                    onPayNow={onPayNow}
                    trainerAvatar={resolvedTrainerAvatar}
                />
            </Modal>
        </>
    );
}
