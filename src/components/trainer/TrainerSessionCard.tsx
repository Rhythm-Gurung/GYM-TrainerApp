import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';
import type { TrainerSession } from '@/types/trainerTypes';

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

interface TrainerSessionCardProps {
    session: TrainerSession;
}

export default function TrainerSessionCard({ session }: TrainerSessionCardProps) {
    return (
        <View
            style={{
                backgroundColor: colors.white,
                borderRadius: radius.card,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                marginBottom: 10,
            }}
        >
            {/* Client avatar + name + status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <View
                        style={{
                            width: 34,
                            height: 34,
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
    );
}
