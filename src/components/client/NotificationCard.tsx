import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { colors, fontSize, radius } from '@/constants/theme';
import type { AppNotification } from '@/types/clientTypes';

type NotificationType = AppNotification['type'];

const TYPE_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
    booking: 'calendar-outline',
    payment: 'card-outline',
    review: 'star-outline',
    system: 'information-circle-outline',
};

const TYPE_BG: Record<NotificationType, string> = {
    booking: colors.primaryMuted,
    payment: colors.statusNewBg,
    review: colors.accentBg,
    system: colors.systemBg,
};

const TYPE_ICON_COLOR: Record<NotificationType, string> = {
    booking: colors.primary,
    payment: colors.success,
    review: colors.accent,
    system: colors.system,
};

export interface NotificationCardProps {
    notification: AppNotification;
    enteringDelayMs?: number;
    enteringDurationMs?: number;
    /** Unread state colors — defaults to client (primary) palette */
    unreadBg?: string;
    unreadBorder?: string;
    unreadDot?: string;
}

export default function NotificationCard({
    notification,
    enteringDelayMs = 0,
    enteringDurationMs = 280,
    unreadBg,
    unreadBorder,
    unreadDot,
}: NotificationCardProps) {

    const dateObj = new Date(notification.createdAt);
    const formattedDate = Number.isNaN(dateObj.getTime())
        ? String(notification.createdAt)
        : dateObj.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <Animated.View
            entering={FadeInLeft.duration(enteringDurationMs).delay(enteringDelayMs)}
            style={{ marginBottom: 8, overflow: 'visible' }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    gap: 12,
                    padding: 16,
                    borderRadius: radius.card,
                    // Use solid opaque colors — semi-transparent + elevation causes
                    // black corner artifacts on Android.
                    backgroundColor: notification.isRead ? colors.white : (unreadBg ?? colors.primarySurface),
                    borderWidth: 1,
                    borderColor: notification.isRead ? colors.surfaceBorder : (unreadBorder ?? colors.primaryBorderSm),
                }}
            >
                {/* Type icon */}
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.sm,
                        backgroundColor: TYPE_BG[notification.type],
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Ionicons
                        name={TYPE_ICON[notification.type]}
                        size={18}
                        color={TYPE_ICON_COLOR[notification.type]}
                    />
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary }}>
                        {notification.title}
                    </Text>
                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 2, lineHeight: 18 }}>
                        {notification.message}
                    </Text>
                    <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle, marginTop: 6, fontWeight: '500' }}>
                        {formattedDate}
                    </Text>
                </View>

                {/* Unread dot */}
                {!notification.isRead && (
                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: unreadDot ?? colors.primary,
                            flexShrink: 0,
                            marginTop: 4,
                        }}
                    />
                )}
            </View>
        </Animated.View>
    );
}
