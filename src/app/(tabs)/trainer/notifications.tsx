import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApiQuery } from '@/api/hooks/useApiQuery';
import { notificationService } from '@/api/services/notification.service';
import NotificationCard from '@/components/client/NotificationCard';
import { colors, fontSize, radius } from '@/constants/theme';
import type { AppNotification } from '@/types/clientTypes';

const DUR = 280;
const STAGGER = 55;

// New minimalistic 4-tab approach
type BookingTab = 'all' | 'active' | 'completed' | 'issues';

// Map old statuses to new tabs
function mapStatusToTab(status: string): BookingTab {
    const s = status.toLowerCase();
    // Active statuses
    if (['pending', 'accepted', 'confirmed', 'in_progress'].includes(s)) return 'active';
    // Completed
    if (s === 'completed') return 'completed';
    // Issues
    if (['disputed', 'no_show_client', 'session_was_taken_but_not_end_by_client', 'missed', 'cancelled', 'refund_pending', 'refunded'].includes(s)) return 'issues';
    return 'all';
}

function inferBookingTabFromText(text: string): BookingTab {
    const t = text.toLowerCase();

    // Issues
    if (t.includes('cancel') || t.includes('dispute') || t.includes('no show') || t.includes('missed') || t.includes('end missed') || t.includes('refund')) return 'issues';

    // Completed
    if (t.includes('session completed') || t.includes('completed session') || t.includes('marked as completed')) return 'completed';

    // Active - pending, accepted, confirmed, in_progress
    if (
        t.includes('accept')
        || t.includes('approved')
        || t.includes('pay now')
        || t.includes('pending payment')
        || t.includes('awaiting payment')
        || t.includes('complete payment')
        || t.includes('payment completed')
        || t.includes('confirm')
        || t.includes('paid')
        || t.includes('in progress')
        || t.includes('session started')
        || t.includes('start verification')
        || t.includes('start session request')
        || t.includes('end verification')
        || t.includes('end session request')
        || t.includes('pending')
        || t.includes('request')
    ) return 'active';

    return 'all';
}

function getBookingTabFromNotification(n: AppNotification): BookingTab {
    const raw = (n.data ?? {}) as Record<string, unknown>;
    const statusVal = raw.booking_status ?? raw.status ?? raw.tab;
    const status = typeof statusVal === 'string' ? statusVal.toLowerCase() : '';

    // Try to map the status directly
    if (status) {
        return mapStatusToTab(status);
    }

    // Fall back to text inference
    return inferBookingTabFromText(`${n.title} ${n.message}`);
}
function TrainerNotificationList({
    notifications,
    isRefreshing,
    onRefresh,
    onPressItem,
}: {
    notifications: AppNotification[];
    isRefreshing: boolean;
    onRefresh: () => void;
    onPressItem: (n: AppNotification) => void;
}) {
    const hasNotifications = notifications.length > 0;
    const allRead = hasNotifications && notifications.every((n) => n.isRead);

    const contentContainerStyle = hasNotifications
        ? { padding: 20, paddingBottom: 24 }
        : {
            padding: 20,
            paddingBottom: 24,
            flexGrow: 1,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        };

    return (
        <ScrollView
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            refreshControl={(
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.trainerPrimary}
                    colors={[colors.trainerPrimary]}
                />
            )}
        >
            {!hasNotifications ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary }}>
                        No notifications
                    </Text>
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '500', color: colors.textMuted, textAlign: 'center' }}>
                        You&apos;re all caught up for now.
                    </Text>
                </View>
            ) : (
                <>
                    {allRead && (
                        <View
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderRadius: radius.md,
                                backgroundColor: colors.trainerSurface,
                                borderWidth: 1,
                                borderColor: colors.trainerBorderSm,
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                                You&apos;re all caught up
                            </Text>
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '500', color: colors.textMuted, marginTop: 2 }}>
                                No unread notifications.
                            </Text>
                        </View>
                    )}

                    {notifications.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onPressItem(item)}
                            activeOpacity={0.8}
                        >
                            <NotificationCard
                                notification={item}
                                enteringDelayMs={index * STAGGER}
                                enteringDurationMs={DUR}
                                unreadBg={colors.trainerSurface}
                                unreadBorder={colors.trainerBorderSm}
                                unreadDot={colors.trainerPrimary}
                            />
                        </TouchableOpacity>
                    ))}
                </>
            )}
        </ScrollView>
    );
}

export default function TrainerNotifications() {
    const router = useRouter();

    const [localNotifications, setLocalNotifications] = useState<AppNotification[] | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data, refetch } = useApiQuery(
        'notifications:list',
        () => notificationService.getNotifications(),
        {
            staleTime: 30 * 1000,
            showErrorToast: false,
            onSuccess: (items) => setLocalNotifications(items),
        },
    );

    const notifications = useMemo(
        () => localNotifications ?? data ?? [],
        [localNotifications, data],
    );

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        refetch().finally(() => setIsRefreshing(false));
    }, [refetch]);

    const handlePressItem = useCallback((n: AppNotification) => {
        if (!n.isRead) {
            setLocalNotifications((prev) => (prev ?? notifications).map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
            notificationService.markRead(n.id).catch(() => {
                refetch();
            });
        }

        if (n.type === 'booking') {
            const tab = getBookingTabFromNotification(n);
            const raw = (n.data ?? {}) as Record<string, unknown>;
            const bookingId = raw.booking_id ?? raw.bookingId;
            const requestId = raw.request_id ?? raw.requestId;
            router.push({
                pathname: '/trainer/bookings',
                params: {
                    tab,
                    bookingId: typeof bookingId === 'string' || typeof bookingId === 'number' ? String(bookingId) : undefined,
                    requestId: typeof requestId === 'string' || typeof requestId === 'number' ? String(requestId) : undefined,
                },
            } as never);
        }
    }, [notifications, refetch, router]);

    const handleMarkAllRead = useCallback(() => {
        setLocalNotifications((prev) => (prev ?? notifications).map((x) => ({ ...x, isRead: true })));
        notificationService.markAllRead().catch(() => {
            refetch();
        });
    }, [notifications, refetch]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
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
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.sm,
                            backgroundColor: colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                        Notifications
                    </Text>
                </View>

                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    activeOpacity={0.7}
                    onPress={handleMarkAllRead}
                >
                    <Ionicons name="checkmark-done-outline" size={15} color={colors.trainerPrimary} />
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.trainerPrimary }}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            <TrainerNotificationList
                notifications={notifications}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onPressItem={handlePressItem}
            />
        </SafeAreaView>
    );
}
