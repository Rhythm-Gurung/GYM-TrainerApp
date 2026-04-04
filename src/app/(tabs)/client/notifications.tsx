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

// New minimalistic tab types
type BookingTab = 'all' | 'active' | 'completed' | 'issues';

// Map old status values to new tab groups
function statusToTab(status: string): BookingTab {
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

    // Issues category
    if (t.includes('cancel') || t.includes('dispute') || t.includes('no show') || t.includes('missed')) return 'issues';

    // Completed
    if (t.includes('session completed') || t.includes('completed session') || t.includes('marked as completed')) return 'completed';

    // Active (everything else that indicates ongoing activity)
    if (
        t.includes('accept')
        || t.includes('approved')
        || t.includes('pay')
        || t.includes('confirm')
        || t.includes('paid')
        || t.includes('in progress')
        || t.includes('session started')
        || t.includes('verification')
        || t.includes('request')
        || t.includes('pending')
    ) return 'active';

    return 'all';
}

function getBookingTabFromNotification(n: AppNotification): BookingTab {
    const raw = (n.data ?? {}) as Record<string, unknown>;
    const statusVal = raw.booking_status ?? raw.status ?? raw.tab;
    const status = typeof statusVal === 'string' ? statusVal.toLowerCase() : '';

    // If we have a known status, map it to the new tab
    if (status) {
        const mappedTab = statusToTab(status);
        if (mappedTab !== 'all') return mappedTab;
    }

    // Fall back to text inference
    return inferBookingTabFromText(`${n.title} ${n.message}`);
}

// Shared values are declared per-slot at the top level of a component to satisfy
// React hook rules (no hooks inside loops). Count matches mockNotifications.
function NotificationList({
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
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            )}
        >
            {!hasNotifications ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary }}>
                        No notifications
                    </Text>
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '500', color: colors.textMuted, textAlign: 'center' }}>
                        You’re all caught up for now.
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
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                                You’re all caught up
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
                            />
                        </TouchableOpacity>
                    ))}
                </>
            )}
        </ScrollView>
    );
}

export default function ClientNotifications() {
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
        // Optimistic UI update
        if (!n.isRead) {
            setLocalNotifications((prev) => (prev ?? notifications).map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
            notificationService.markRead(n.id).catch(() => {
                // Roll back by refetching
                refetch();
            });
        }

        if (n.type === 'booking') {
            const tab = getBookingTabFromNotification(n);
            const raw = (n.data ?? {}) as Record<string, unknown>;
            const bookingId = raw.booking_id ?? raw.bookingId;
            const requestId = raw.request_id ?? raw.requestId;

            router.push({
                pathname: '/(tabs)/client/bookings',
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
                    <Ionicons name="checkmark-done-outline" size={15} color={colors.primary} />
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.primary }}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            <NotificationList
                notifications={notifications}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onPressItem={handlePressItem}
            />
        </SafeAreaView>
    );
}
