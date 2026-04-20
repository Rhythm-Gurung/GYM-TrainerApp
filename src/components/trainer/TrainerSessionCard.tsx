import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { resolveImageUrl } from '@/lib';
import type { TrainerSession } from '@/types/trainerTypes';

// ─── Status maps ──────────────────────────────────────────────────────────────

type SessionStatus = TrainerSession['status'];

const STATUS_LABEL: Record<SessionStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refund_pending: 'Refund Pending',
    refunded: 'Refunded',
    disputed: 'Disputed',
    no_show_client: 'No Show',
    session_was_taken_but_not_end_by_client: 'Not Ended',
    missed: 'Missed',
};

const STATUS_COLOR: Record<SessionStatus, string> = {
    pending: colors.accent,
    accepted: colors.trainerPrimary,
    confirmed: colors.trainerPrimary,
    in_progress: colors.trainerPrimary,
    completed: colors.success,
    cancelled: colors.error,
    refund_pending: colors.accent,
    refunded: colors.success,
    disputed: colors.error,
    no_show_client: colors.error,
    session_was_taken_but_not_end_by_client: colors.accent,
    missed: colors.error,
};

const STATUS_BG: Record<SessionStatus, string> = {
    pending: colors.accentBg,
    accepted: colors.trainerMuted,
    confirmed: colors.trainerMuted,
    in_progress: colors.trainerMuted,
    completed: colors.statusNewBg,
    cancelled: colors.errorBg,
    refund_pending: colors.accentBg,
    refunded: colors.statusNewBg,
    disputed: colors.errorBg,
    no_show_client: colors.errorBg,
    session_was_taken_but_not_end_by_client: colors.accentBg,
    missed: colors.errorBg,
};

const STATUS_ICON: Record<SessionStatus, keyof typeof Ionicons.glyphMap> = {
    pending: 'time-outline',
    accepted: 'checkmark-circle-outline',
    confirmed: 'checkmark-circle-outline',
    in_progress: 'play-circle-outline',
    completed: 'trophy-outline',
    cancelled: 'close-circle-outline',
    refund_pending: 'refresh-outline',
    refunded: 'checkmark-done-outline',
    disputed: 'alert-circle-outline',
    no_show_client: 'person-remove-outline',
    session_was_taken_but_not_end_by_client: 'hourglass-outline',
    missed: 'ban-outline',
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
    onPress?: () => void;
}

export default function TrainerSessionCard({ session, onPress }: TrainerSessionCardProps) {
    const { authState } = useAuth();
    const [imgError, setImgError] = useState(false);
    const avatarUrl = resolveImageUrl(session.clientAvatar);
    const showImage = !!avatarUrl && !imgError;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
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
                            overflow: 'hidden',
                            marginRight: 10,
                        }}
                    >
                        {showImage ? (
                            <ExpoImage
                                source={{
                                    uri: avatarUrl,
                                    headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                cachePolicy="none"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.trainerPrimary }}>
                                {getInitials(session.clientName)}
                            </Text>
                        )}
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
        </TouchableOpacity>
    );
}
