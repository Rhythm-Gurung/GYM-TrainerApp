import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import khaltiLogo from '../../../../assets/images/Khalti.png';

import { useApiMutation } from '@/api/hooks/useApiMutation';
import { useBookings, useCancelBooking, useInitiateBulkPayment, useInitiatePayment } from '@/api/hooks/useBookSession';
import { useBookingChatSessions } from '@/api/hooks/useBookingChat';
import { clientService } from '@/api/services/client.service';
import ReviewModal from '@/components/client/ReviewModal';
import TrainerBookingGroup, { type TrainerGroup } from '@/components/client/TrainerBookingGroup';
import { colors, fontSize, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast, showSuccessToast } from '@/lib';
import { chatEvents } from '@/lib/chatEvents';
import type { Booking } from '@/types/clientTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = Booking['status'];
type FilterValue = 'all' | 'active' | 'completed' | 'issues';

// Status groupings for the minimalistic 4-tab approach
const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'accepted', 'confirmed', 'in_progress'];
const COMPLETED_STATUSES: BookingStatus[] = ['completed'];
const ISSUES_STATUSES: BookingStatus[] = ['disputed', 'no_show_client', 'session_was_taken_but_not_end_by_client', 'missed', 'cancelled', 'refund_pending', 'refunded'];

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: FilterValue }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Issues', value: 'issues' },
];

// Helper to check if a booking matches a filter
function bookingMatchesFilter(status: BookingStatus, filter: FilterValue): boolean {
    if (filter === 'all') return true;
    if (filter === 'active') return ACTIVE_STATUSES.includes(status);
    if (filter === 'completed') return COMPLETED_STATUSES.includes(status);
    if (filter === 'issues') return ISSUES_STATUSES.includes(status);
    return false;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientBookings() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { tab, bookingId, requestId } = useLocalSearchParams<{ tab?: string; bookingId?: string; requestId?: string }>();
    const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
    const { authState } = useAuth();

    const { data: bookings, isLoading, refetch } = useBookings();
    const { data: chatSessions, refetch: refetchChatSessions } = useBookingChatSessions();
    const { mutateAsync: cancelBooking } = useCancelBooking();
    const { mutateAsync: initiatePayment } = useInitiatePayment();
    const { mutateAsync: initiateBulkPayment } = useInitiateBulkPayment();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
    const [isPaymentRedirecting, setIsPaymentRedirecting] = useState(false);

    // Review modal state
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);

    // Track reviews by booking ID (booking_id -> review_id)
    const [reviewsByBooking, setReviewsByBooking] = useState<Record<string, string>>({});

    // Optimistic status overrides keyed by booking id
    const [statusOverrides, setStatusOverrides] = useState<Record<string, Booking['status']>>({});

    // Real-time unread count cache: backend-sourced via polling + WebSocket patches
    const [unreadOverrides, setUnreadOverrides] = useState<Record<string, number>>({});

    // Create a map of bookingId -> unreadCount for quick lookup (from API + real-time patches)
    const unreadCountMap = useMemo(() => {
        const map: Record<string, number> = {};
        chatSessions?.forEach((session) => {
            const key = session.bookingId;
            // Use real-time patch if available, else fall back to API value
            map[key] = unreadOverrides[key] ?? session.unreadCount;
        });
        return map;
    }, [chatSessions, unreadOverrides]);

    // Sync active filter from navigation param every time the screen is focused
    useFocusEffect(
        useCallback(() => {
            if (tab && STATUS_TABS.some((t) => t.value === tab)) {
                setActiveFilter(tab as FilterValue);
            }
        }, [tab]),
    );

    // Refetch bookings data on screen focus (critical for session verification requests)
    useFocusEffect(
        useCallback(() => {
            refetch().catch(() => { });
        }, [refetch]),
    );

    // Refresh badge counts on screen focus (real-time updates come via useBadgeWebSocket in layout)
    useFocusEffect(
        useCallback(() => {
            refetchChatSessions().catch(() => { });
        }, [refetchChatSessions]),
    );

    // Listen for real-time unread updates via WebSocket
    useEffect(() => {
        const unsubscribe = chatEvents.on('unread_update', (data) => {
            if (__DEV__) {
                console.warn(`[ClientBookings] WS unread patch: booking ${data.bookingId} -> ${data.unreadCount}`);
            }
            setUnreadOverrides((prev) => ({
                ...prev,
                [data.bookingId]: data.unreadCount,
            }));
        });
        return unsubscribe;
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setStatusOverrides({});
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    const handleCancel = useCallback(async (id: string) => {
        try {
            const updated = await cancelBooking(id);
            setStatusOverrides((prev) => ({ ...prev, [id]: updated.status }));
            refetch();
        } catch {
            // error toast already handled by useApiMutation
        }
    }, [cancelBooking, refetch]);

    const handlePayNow = useCallback(async (booking: Booking) => {
        setIsPaymentRedirecting(true);
        try {
            const { payment_url } = await initiatePayment(booking.id);
            setIsPaymentRedirecting(false);
            await WebBrowser.openBrowserAsync(payment_url);
            // Browser closed — check payment result directly
            const result = await clientService.getPaymentStatus(booking.id);
            if (result.status === 'completed') {
                setStatusOverrides((prev) => ({ ...prev, [booking.id]: 'confirmed' }));
                setConfirmedBooking(booking);
                refetch();
            } else if (
                result.status === 'failed'
                || result.status === 'cancelled'
                || result.status === 'expired'
            ) {
                showErrorToast('Payment was not completed. Please try again.');
            }
        } catch {
            setIsPaymentRedirecting(false);
            refetch().catch(() => { });
            // initiatePayment errors are shown by useApiMutation toast
        }
    }, [initiatePayment, refetch]);

    const handlePaySelected = useCallback(async (selectedBookings: Booking[]) => {
        if (selectedBookings.length === 0) return;

        if (selectedBookings.length === 1) {
            await handlePayNow(selectedBookings[0]);
            return;
        }

        setIsPaymentRedirecting(true);
        try {
            const bookingIds = selectedBookings.map((b) => b.id);
            const idempotencyKey = `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

            const bulkInit = await initiateBulkPayment({
                bookingIds,
                idempotencyKey,
            });

            if (!bulkInit.payment_url || !bulkInit.payment_group_id) {
                setIsPaymentRedirecting(false);
                showErrorToast('Could not initiate bulk payment. Please try again.');
                return;
            }

            setIsPaymentRedirecting(false);
            await WebBrowser.openBrowserAsync(bulkInit.payment_url);

            const bulkStatus = await clientService.getBulkPaymentStatus(bulkInit.payment_group_id);
            const completedLike = new Set(['confirmed', 'completed']);
            const failedLike = new Set(['failed', 'cancelled', 'expired']);

            const confirmedIds = bulkStatus.bookings
                .filter((item) => completedLike.has(String(item.status).toLowerCase()))
                .map((item) => item.bookingId)
                .filter(Boolean);

            if (String(bulkStatus.status).toLowerCase() === 'completed' || confirmedIds.length > 0) {
                if (confirmedIds.length > 0) {
                    setStatusOverrides((prev) => confirmedIds.reduce<Record<string, Booking['status']>>(
                        (acc, id) => ({ ...acc, [id]: 'confirmed' }),
                        { ...prev },
                    ));
                }
                refetch();
                return;
            }

            if (failedLike.has(String(bulkStatus.status).toLowerCase())) {
                showErrorToast('Bulk payment was not completed. Please try again.');
            }
        } catch {
            setIsPaymentRedirecting(false);
            refetch().catch(() => { });
            // bulk payment errors are shown by useApiMutation toast when available
        }
    }, [handlePayNow, initiateBulkPayment, refetch]);

    const handleOpenBookingChat = useCallback((booking: Booking) => {
        router.push({
            pathname: '/(tabs)/client/bookingChatRoom' as never,
            params: {
                bookingId: booking.id,
                partnerName: booking.trainerName,
            },
        });
    }, [router]);

    const handleLeaveReview = useCallback((booking: Booking) => {
        setSelectedBookingForReview(booking);
        setReviewModalVisible(true);
    }, []);

    const { mutateAsync: submitReview } = useApiMutation(
        async ({ trainerId, bookingId: reviewBookingId, rating, comment }: { trainerId: string; bookingId: string; rating: number; comment: string }) => {
            const response = await clientService.postReview(trainerId, reviewBookingId, rating, comment);
            // After successful review submission, mark this booking as reviewed
            setReviewsByBooking((prev) => ({ ...prev, [reviewBookingId]: 'submitted' }));
            return response;
        },
        {
            onSuccess: () => showSuccessToast('Thank you for your review!'),
        },
    );

    const handleSubmitReview = useCallback(async (rating: number, comment: string) => {
        if (!selectedBookingForReview) return;

        await submitReview({
            trainerId: selectedBookingForReview.trainerId,
            bookingId: selectedBookingForReview.id,
            rating,
            comment,
        });

        setReviewModalVisible(false);
        setSelectedBookingForReview(null);
    }, [selectedBookingForReview, submitReview]);

    const { mutateAsync: deleteReview } = useApiMutation(
        async ({ trainerId, reviewId }: { trainerId: string; reviewId: string }) => {
            await clientService.deleteReview(trainerId, reviewId);
        },
        {
            onSuccess: () => showSuccessToast('Review deleted successfully'),
        },
    );

    const handleDeleteReview = useCallback(async (booking: Booking) => {
        const reviewId = reviewsByBooking[booking.id];
        if (!reviewId) return;

        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete your review? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteReview({
                                trainerId: booking.trainerId,
                                reviewId,
                            });
                            // Remove from local tracking
                            setReviewsByBooking((prev) => {
                                const updated = { ...prev };
                                delete updated[booking.id];
                                return updated;
                            });
                        } catch {
                            // Error toast already shown by useApiMutation
                        }
                    },
                },
            ],
        );
    }, [reviewsByBooking, deleteReview]);

    // Apply status overrides on top of server data
    const allBookings = useMemo(
        () => (bookings ?? []).map((b) => {
            const override = statusOverrides[b.id];
            return override ? { ...b, status: override } : b;
        }),
        [bookings, statusOverrides],
    );

    // Group bookings by trainer — one card per trainer
    const filteredGroups = useMemo<TrainerGroup[]>(() => {
        const groups = Object.values(
            allBookings.reduce<Record<string, TrainerGroup>>((acc, booking) => {
                if (acc[booking.trainerId]) {
                    acc[booking.trainerId].bookings.push(booking);
                } else {
                    acc[booking.trainerId] = {
                        trainerId: booking.trainerId,
                        trainerName: booking.trainerName,
                        bookings: [booking],
                    };
                }
                return acc;
            }, {}),
        );

        if (activeFilter === 'all') return groups;

        // Filter groups by active filter using the helper function
        // ALWAYS include the group containing focusBookingId for session verification
        return groups.filter((g) => {
            const hasMatchingStatus = g.bookings.some((b) => bookingMatchesFilter(b.status, activeFilter));
            const hasFocusedBooking = bookingId && g.bookings.some((b) => b.id === bookingId);
            return hasMatchingStatus || hasFocusedBooking;
        });
    }, [allBookings, activeFilter, bookingId]);

    return (
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>

                {/* ── Header ───────────────────────────────────────────────────── */}
                <View
                    style={{
                        paddingHorizontal: 20,
                        paddingTop: 14,
                        paddingBottom: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.surfaceBorder,
                    }}
                >
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                        My Bookings
                    </Text>

                    {/* Filter chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingTop: 12 }}
                    >
                        {STATUS_TABS.map((statusTab) => {
                            const isActive = activeFilter === statusTab.value;
                            return (
                                <TouchableOpacity
                                    key={statusTab.value}
                                    onPress={() => {
                                        setActiveFilter(statusTab.value);
                                        router.setParams({ tab: statusTab.value });
                                    }}
                                    activeOpacity={0.75}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 7,
                                        borderRadius: radius.full,
                                        backgroundColor: isActive ? colors.primary : colors.surface,
                                        borderWidth: 1,
                                        borderColor: isActive ? colors.primary : colors.surfaceBorder,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: fontSize.tag,
                                            fontWeight: '600',
                                            color: isActive ? colors.white : colors.textMuted,
                                        }}
                                    >
                                        {statusTab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* ── List ─────────────────────────────────────────────────────── */}
                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={{
                            padding: 20,
                            paddingBottom: tabBarHeight + 16,
                            flexGrow: 1,
                        }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={(
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                tintColor={colors.primary}
                                colors={[colors.primary]}
                            />
                        )}
                    >
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group) => (
                                <TrainerBookingGroup
                                    key={group.trainerId}
                                    group={group}
                                    filterStatus={activeFilter}
                                    onCancel={handleCancel}
                                    onPayNow={handlePayNow}
                                    onPaySelected={handlePaySelected}
                                    onOpenChat={handleOpenBookingChat}
                                    onLeaveReview={handleLeaveReview}
                                    onDeleteReview={handleDeleteReview}
                                    reviewsByBooking={reviewsByBooking}
                                    unreadCountMap={unreadCountMap}
                                    focusBookingId={bookingId}
                                    focusRequestId={requestId}
                                />
                            ))
                        ) : (
                            /* ── Empty state ─────────────────────────────────────── */
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
                                <View
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 20,
                                        backgroundColor: colors.surface,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 16,
                                    }}
                                >
                                    <Ionicons name="calendar-outline" size={28} color={colors.textDisabled} />
                                </View>
                                <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                                    No bookings
                                </Text>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
                                    {`You don't have any ${activeFilter === 'all' ? '' : `${activeFilter} `}bookings yet.`}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                )}

            </SafeAreaView>

            {/* ── Khalti redirect loading ──────────────────────────────────── */}
            <Modal
                visible={isPaymentRedirecting}
                transparent
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(20, 18, 18, 0)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View
                        style={{
                            backgroundColor: colors.white,
                            borderRadius: radius.card,
                            paddingHorizontal: 24,
                            paddingVertical: 22,
                            alignItems: 'center',
                            gap: 14,
                            width: '100%',
                            maxWidth: 320,
                            shadowColor: '#000',
                            shadowOpacity: 0.18,
                            shadowRadius: 18,
                            shadowOffset: { width: 0, height: 10 },
                            elevation: 8,
                        }}
                    >
                        <View
                            style={{
                                width: 68,
                                height: 68,
                                borderRadius: 18,
                                backgroundColor: colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            <Image
                                source={khaltiLogo}
                                style={{ width: 46, height: 46 }}
                                resizeMode="contain"
                            />
                        </View>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>
                            Redirecting to Khalti...
                        </Text>
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
                            Please wait while we open the payment gateway.
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* ── Payment success modal ─────────────────────────────────────── */}
            <Modal
                visible={!!confirmedBooking}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmedBooking(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View
                        style={{
                            backgroundColor: colors.white,
                            borderRadius: radius.card,
                            padding: 28,
                            width: '100%',
                            alignItems: 'center',
                        }}
                    >
                        {/* Icon */}
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: colors.statusNewBg,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name="checkmark-circle" size={36} color={colors.success} />
                        </View>

                        <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 }}>
                            Payment Confirmed!
                        </Text>
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginBottom: 24, textAlign: 'center' }}>
                            Your booking has been confirmed.
                        </Text>

                        {/* Details */}
                        {confirmedBooking && (
                            <View style={{ width: '100%', gap: 10, marginBottom: 24 }}>
                                {[
                                    {
                                        icon: 'person-outline' as const,
                                        label: 'Trainer',
                                        value: confirmedBooking.trainerName,
                                    },
                                    {
                                        icon: 'people-outline' as const,
                                        label: 'Client',
                                        value: authState.user?.full_name ?? authState.user?.username ?? '—',
                                    },
                                    {
                                        icon: 'calendar-outline' as const,
                                        label: 'Date',
                                        value: new Date(confirmedBooking.date).toLocaleDateString('en-IN', {
                                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                                        }),
                                    },
                                    {
                                        icon: 'time-outline' as const,
                                        label: 'Time',
                                        value: (() => {
                                            const to12h = (t: string) => {
                                                const [h, m] = t.split(':').map(Number);
                                                return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                                            };
                                            return `${to12h(confirmedBooking.startTime)} – ${to12h(confirmedBooking.endTime)}`;
                                        })(),
                                    },
                                    {
                                        icon: 'cash-outline' as const,
                                        label: 'Amount Paid',
                                        value: `₹${confirmedBooking.totalAmount.toLocaleString('en-IN')}`,
                                    },
                                ].map(({ icon, label, value }) => (
                                    <View
                                        key={label}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 10,
                                            backgroundColor: colors.surface,
                                            borderRadius: radius.md,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                        }}
                                    >
                                        <Ionicons name={icon} size={16} color={colors.textSubtle} />
                                        <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, width: 76 }}>{label}</Text>
                                        <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                                            {value}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => setConfirmedBooking(null)}
                            activeOpacity={0.8}
                            style={{
                                width: '100%',
                                height: 44,
                                borderRadius: radius.md,
                                backgroundColor: colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Review Modal ───────────────────────────────────────────────── */}
            {selectedBookingForReview && (
                <ReviewModal
                    visible={reviewModalVisible}
                    onClose={() => {
                        setReviewModalVisible(false);
                        setSelectedBookingForReview(null);
                    }}
                    onSubmit={handleSubmitReview}
                    trainerName={selectedBookingForReview.trainerName}
                    bookingDate={new Date(selectedBookingForReview.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                    bookingTime={`${selectedBookingForReview.startTime} - ${selectedBookingForReview.endTime}`}
                />
            )}
        </>
    );
}
