import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { resolveImageUrl } from '@/lib';
import type { TrainerSession } from '@/types/trainerTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientGroup {
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    sessions: TrainerSession[]; // all sessions for this client (optimistic overrides applied)
}

interface ClientBookingGroupProps {
    group: ClientGroup;
    filterStatus: string; // active tab: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onComplete: (id: string) => void;
}

// ─── Status maps ──────────────────────────────────────────────────────────────

type SessionStatus = TrainerSession['status'];

const STATUS_LABEL: Record<SessionStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refund_pending: 'Refund Pending',
    refunded: 'Refunded',
};

const STATUS_COLOR: Record<SessionStatus, string> = {
    pending: colors.accent,
    accepted: colors.trainerPrimary,
    confirmed: colors.trainerPrimary,
    completed: colors.success,
    cancelled: colors.error,
    refund_pending: colors.accent,
    refunded: colors.success,
};

const STATUS_BG: Record<SessionStatus, string> = {
    pending: colors.accentBg,
    accepted: colors.trainerMuted,
    confirmed: colors.trainerMuted,
    completed: colors.statusNewBg,
    cancelled: colors.errorBg,
    refund_pending: colors.accentBg,
    refunded: colors.statusNewBg,
};

const STATUS_ICON: Record<SessionStatus, keyof typeof Ionicons.glyphMap> = {
    pending: 'time-outline',
    accepted: 'checkmark-circle-outline',
    confirmed: 'checkmark-circle-outline',
    completed: 'trophy-outline',
    cancelled: 'close-circle-outline',
    refund_pending: 'refresh-outline',
    refunded: 'checkmark-done-outline',
};

// Priority order for dominant status badge on summary card
const STATUS_PRIORITY: SessionStatus[] = [
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

function getStatusCounts(sessions: TrainerSession[]): Partial<Record<SessionStatus, number>> {
    return sessions.reduce<Partial<Record<SessionStatus, number>>>((acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1;
        return acc;
    }, {});
}

function getDateRange(sessions: TrainerSession[]): string {
    const dates = sessions.map((s) => s.date).sort();
    if (dates.length === 1) return formatDate(dates[0]);
    return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`;
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

interface DetailSheetProps {
    group: ClientGroup;
    filterStatus: string;
    onClose: () => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onComplete: (id: string) => void;
}

function DetailSheet({ group, filterStatus, onClose, onAccept, onReject, onComplete }: DetailSheetProps) {
    const { authState } = useAuth();
    const insets = useSafeAreaInsets();
    const visibleSessions = filterStatus === 'all'
        ? group.sessions
        : group.sessions.filter((s) => s.status === filterStatus);
    const totalAmount = visibleSessions.reduce((sum, s) => sum + s.totalAmount, 0);
    const sorted = [...visibleSessions].sort((a, b) => a.date.localeCompare(b.date));

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
                            backgroundColor: colors.trainerMuted,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {group.clientAvatar ? (
                            <ExpoImage
                                source={{
                                    uri: resolveImageUrl(group.clientAvatar),
                                    headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                cachePolicy="none"
                            />
                        ) : (
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.trainerPrimary }}>
                                {getInitials(group.clientName)}
                            </Text>
                        )}
                    </View>
                    <View>
                        <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.textPrimary }}>
                            {group.clientName}
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

            {/* Session list */}
            <ScrollView
                style={{ marginTop: 8 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
            >
                {sorted.map((session) => {
                    const showActions = session.status === 'pending' || session.status === 'confirmed';

                    return (
                        <View
                            key={session.id}
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: radius.card,
                                padding: 14,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                            }}
                        >
                            {/* Date + status row */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                    {formatDateFull(session.date)}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                        paddingHorizontal: 8,
                                        paddingVertical: 3,
                                        borderRadius: radius.full,
                                        backgroundColor: STATUS_BG[session.status],
                                    }}
                                >
                                    <Ionicons name={STATUS_ICON[session.status]} size={11} color={STATUS_COLOR[session.status]} />
                                    <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: STATUS_COLOR[session.status] }}>
                                        {STATUS_LABEL[session.status]}
                                    </Text>
                                </View>
                            </View>

                            {/* Time + amount */}
                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Ionicons name="time-outline" size={13} color={colors.textSubtle} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>
                                        {`${to12h(session.startTime)} – ${to12h(session.endTime)}`}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Ionicons name="cash-outline" size={13} color={colors.textSubtle} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>
                                        {`₹${session.totalAmount.toLocaleString('en-IN')}`}
                                    </Text>
                                </View>
                            </View>

                            {/* Accepted: waiting for client to pay */}
                            {session.status === 'accepted' && (
                                <View
                                    style={{
                                        marginTop: 10,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        backgroundColor: colors.trainerMuted,
                                        borderRadius: radius.md,
                                        paddingHorizontal: 10,
                                        paddingVertical: 7,
                                    }}
                                >
                                    <Ionicons name="hourglass-outline" size={13} color={colors.trainerPrimary} />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.trainerPrimary, fontWeight: '600' }}>
                                        Waiting for client to pay
                                    </Text>
                                </View>
                            )}

                            {/* Action buttons */}
                            {showActions && (
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                    {session.status === 'pending' && (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => onAccept(session.id)}
                                                activeOpacity={0.8}
                                                style={{
                                                    flex: 1,
                                                    height: 36,
                                                    borderRadius: radius.md,
                                                    backgroundColor: colors.successDark,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'row',
                                                    gap: 5,
                                                }}
                                            >
                                                <Ionicons name="checkmark-circle-outline" size={14} color={colors.white} />
                                                <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => onReject(session.id)}
                                                activeOpacity={0.8}
                                                style={{
                                                    flex: 1,
                                                    height: 36,
                                                    borderRadius: radius.md,
                                                    backgroundColor: colors.white,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'row',
                                                    gap: 5,
                                                    borderWidth: 1.5,
                                                    borderColor: colors.error,
                                                }}
                                            >
                                                <Ionicons name="close-circle-outline" size={14} color={colors.error} />
                                                <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.error }}>Reject</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {session.status === 'confirmed' && (
                                        <TouchableOpacity
                                            onPress={() => onComplete(session.id)}
                                            activeOpacity={0.8}
                                            style={{
                                                flex: 1,
                                                height: 36,
                                                borderRadius: radius.md,
                                                backgroundColor: colors.successDark,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                                gap: 5,
                                            }}
                                        >
                                            <Ionicons name="checkmark-done-outline" size={14} color={colors.white} />
                                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>Mark Completed</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

export default function ClientBookingGroup({ group, filterStatus, onAccept, onReject, onComplete }: ClientBookingGroupProps) {
    const { authState } = useAuth();
    const [sheetOpen, setSheetOpen] = useState(false);

    const visibleSessions = filterStatus === 'all'
        ? group.sessions
        : group.sessions.filter((s) => s.status === filterStatus);

    const counts = getStatusCounts(visibleSessions);
    const dateRange = getDateRange(visibleSessions);
    const totalAmount = visibleSessions.reduce((sum, s) => sum + s.totalAmount, 0);
    const pendingCount = counts.pending ?? 0;

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
                {/* Client row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: radius.full,
                                backgroundColor: colors.trainerMuted,
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {group.clientAvatar ? (
                                <ExpoImage
                                    source={{
                                        uri: resolveImageUrl(group.clientAvatar),
                                        headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    cachePolicy="none"
                                />
                            ) : (
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.trainerPrimary }}>
                                    {getInitials(group.clientName)}
                                </Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                                {group.clientName}
                            </Text>
                            <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, marginTop: 2 }}>
                                {dateRange}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Session count badge */}
                        <View
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: radius.full,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.textSecondary }}>
                                {`${visibleSessions.length} session${visibleSessions.length !== 1 ? 's' : ''}`}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                    </View>
                </View>

                {/* Status summary row */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                        {filterStatus === 'all' ? (
                            (STATUS_PRIORITY.filter((s) => (counts[s] ?? 0) > 0) as SessionStatus[]).map((status) => (
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
                                    backgroundColor: STATUS_BG[filterStatus as SessionStatus] ?? colors.surface,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.caption,
                                        fontWeight: '600',
                                        color: STATUS_COLOR[filterStatus as SessionStatus] ?? colors.textMuted,
                                    }}
                                >
                                    {`${visibleSessions.length} ${STATUS_LABEL[filterStatus as SessionStatus] ?? filterStatus}`}
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
                    onAccept={onAccept}
                    onReject={onReject}
                    onComplete={onComplete}
                />
            </Modal>
        </>
    );
}
