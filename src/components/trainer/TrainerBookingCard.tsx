import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { TrainerSession } from '@/types/trainerTypes';

// ─── Status maps ──────────────────────────────────────────────────────────────

type SessionStatus = TrainerSession['status'];

const STATUS_LABEL: Record<SessionStatus, string> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    pending: 'Pending',
    cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<SessionStatus, string> = {
    confirmed: colors.trainerPrimary,
    completed: colors.success,
    pending: colors.accent,
    cancelled: colors.error,
};

const STATUS_BG: Record<SessionStatus, string> = {
    confirmed: colors.trainerMuted,
    completed: colors.statusNewBg,
    pending: colors.accentBg,
    cancelled: colors.errorBg,
};

const STATUS_ICON: Record<SessionStatus, keyof typeof Ionicons.glyphMap> = {
    confirmed: 'checkmark-circle-outline',
    completed: 'trophy-outline',
    pending: 'time-outline',
    cancelled: 'close-circle-outline',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
    });
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TrainerBookingCardProps {
    session: TrainerSession;
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onComplete?: (id: string) => void;
}

export default function TrainerBookingCard({ session, onAccept, onReject, onComplete }: TrainerBookingCardProps) {
    const showActions = session.status === 'pending' || session.status === 'confirmed';

    return (
        <View
            style={{
                backgroundColor: colors.white,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                marginBottom: 12,
                overflow: 'hidden',
                ...shadow.card,
            }}
        >
            {/* Card body */}
            <View style={{ padding: 16 }}>
                {/* Client row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <View
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: radius.full,
                                backgroundColor: colors.trainerMuted,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.trainerPrimary }}>
                                {getInitials(session.clientName)}
                            </Text>
                        </View>
                        <Text
                            style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}
                            numberOfLines={1}
                        >
                            {session.clientName}
                        </Text>
                    </View>

                    {/* Status badge */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: radius.full,
                            backgroundColor: STATUS_BG[session.status],
                        }}
                    >
                        <Ionicons name={STATUS_ICON[session.status]} size={12} color={STATUS_COLOR[session.status]} />
                        <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: STATUS_COLOR[session.status] }}>
                            {STATUS_LABEL[session.status]}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.surfaceBorder, marginBottom: 12 }} />

                {/* Session details */}
                <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSubtle} />
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                            {formatDate(session.date)}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="time-outline" size={14} color={colors.textSubtle} />
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                            {`${session.startTime} – ${session.endTime}`}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="cash-outline" size={14} color={colors.textSubtle} />
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                            {`₹${session.totalAmount.toLocaleString('en-IN')}`}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Action buttons */}
            {showActions && (
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 10,
                        paddingHorizontal: 16,
                        paddingBottom: 14,
                        paddingTop: 4,
                    }}
                >
                    {session.status === 'pending' && (
                        <>
                            <TouchableOpacity
                                onPress={() => onAccept?.(session.id)}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    height: 40,
                                    borderRadius: radius.md,
                                    backgroundColor: colors.successDark,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    gap: 6,
                                    ...shadow.card,
                                }}
                            >
                                <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.white }}>
                                    Accept
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onReject?.(session.id)}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    height: 40,
                                    borderRadius: radius.md,
                                    backgroundColor: colors.white,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    gap: 6,
                                    borderWidth: 1.5,
                                    borderColor: colors.error,
                                }}
                            >
                                <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.error }}>
                                    Reject
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {session.status === 'confirmed' && (
                        <TouchableOpacity
                            onPress={() => onComplete?.(session.id)}
                            activeOpacity={0.8}
                            style={{
                                flex: 1,
                                height: 40,
                                borderRadius: radius.md,
                                backgroundColor: colors.successDark,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 6,
                                ...shadow.card,
                            }}
                        >
                            <Ionicons name="checkmark-done-outline" size={16} color={colors.white} />
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.white }}>
                                Mark Completed
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}
