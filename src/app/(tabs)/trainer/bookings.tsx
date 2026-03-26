import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConfirmBooking, useCancelTrainerBooking, useTrainerBookings } from '@/api/hooks/useTrainerBookings';
import ClientBookingGroup, { type ClientGroup } from '@/components/trainer/ClientBookingGroup';
import { colors, fontSize, radius } from '@/constants/theme';
import {
    STATUS_TABS,
    type BookingFilterStatus,
} from '@/constants/trainerBookings.constants';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showInfoToast, showSuccessToast } from '@/lib';
import type { TrainerSession } from '@/types/trainerTypes'; // used in statusOverrides Record type

// ─── Screen ───────────────────────────────────────────────────────────────────

const SLIDE = 30;
const DUR = 300;

export default function TrainerBookings() {
    const tabBarHeight = useTabBarHeight();
    const { tab } = useLocalSearchParams<{ tab?: string }>();

    const { data, isLoading, isFetching, refetch } = useTrainerBookings();
    const { mutateAsync: confirmBooking } = useConfirmBooking();
    const { mutateAsync: cancelTrainerBooking } = useCancelTrainerBooking();

    const [statusOverrides, setStatusOverrides] = useState<Record<string, TrainerSession['status']>>({});
    const [activeTab, setActiveTab] = useState<BookingFilterStatus>('pending');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const listY = useSharedValue(SLIDE);
    const listOpacity = useSharedValue(0);
    const anim = useRef({ listY, listOpacity });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            v.listY.value = SLIDE;
            v.listOpacity.value = 0;
            v.listY.value = withTiming(0, { duration: DUR });
            v.listOpacity.value = withTiming(1, { duration: DUR });
        }, []),
    );

    useFocusEffect(
        useCallback(() => {
            // Refresh on focus to show new booking requests.
            // NOTE: useApiQuery swallows errors and shows its own toast by default.
            refetch().catch(() => { });
        }, [refetch]),
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Drop optimistic UI overrides so we always reflect the server truth after refresh.
        setStatusOverrides({});
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    // Sync active tab from navigation param every time the screen is focused
    useFocusEffect(
        useCallback(() => {
            if (tab && STATUS_TABS.some((t) => t.value === tab)) {
                setActiveTab(tab as BookingFilterStatus);
            }
        }, [tab]),
    );

    const listStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: listY.value }],
        opacity: listOpacity.value,
    }));

    const bookings = useMemo<TrainerSession[]>(() => {
        const base = data ?? [];
        if (!base.length) return [];
        return base.map((b) => {
            const override = statusOverrides[b.id];
            return override ? { ...b, status: override } : b;
        });
    }, [data, statusOverrides]);

    // Group sessions by client — one card per client
    const filteredGroups = useMemo<ClientGroup[]>(() => {
        const groups = Object.values(
            bookings.reduce<Record<string, ClientGroup>>((acc, session) => {
                if (acc[session.clientId]) {
                    acc[session.clientId].sessions.push(session);
                } else {
                    acc[session.clientId] = {
                        clientId: session.clientId,
                        clientName: session.clientName,
                        clientAvatar: session.clientAvatar ?? '',
                        sessions: [session],
                    };
                }
                return acc;
            }, {}),
        );
        if (activeTab === 'all') return groups;
        return groups.filter((g) => g.sessions.some((s) => s.status === activeTab));
    }, [bookings, activeTab]);

    const handleAccept = useCallback(async (id: string) => {
        // Optimistic update — status moves to 'accepted' (client must now pay)
        setStatusOverrides((prev) => ({ ...prev, [id]: 'accepted' }));
        try {
            await confirmBooking(id);
            showSuccessToast('Booking accepted. Waiting for client to pay.');
        } catch {
            // Revert optimistic update on failure
            setStatusOverrides((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    }, [confirmBooking]);

    const handleReject = useCallback(async (id: string) => {
        setStatusOverrides((prev) => ({ ...prev, [id]: 'cancelled' }));
        try {
            await cancelTrainerBooking({ id, reason: 'Not available on that day' });
            showInfoToast('Booking rejected');
        } catch {
            setStatusOverrides((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    }, [cancelTrainerBooking]);

    const handleComplete = (id: string) => {
        setStatusOverrides((prev) => ({ ...prev, [id]: 'completed' }));
        showSuccessToast('Session marked as completed');
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            {/* Sticky header */}
            <View
                style={{
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                    backgroundColor: colors.background,
                }}
            >
                <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                    Manage Bookings
                </Text>

                {/* Filter tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingTop: 12 }}
                >
                    {STATUS_TABS.map((statusTab) => {
                        const isActive = activeTab === statusTab.value;
                        return (
                            <TouchableOpacity
                                key={statusTab.value}
                                onPress={() => setActiveTab(statusTab.value)}
                                activeOpacity={0.75}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 7,
                                    borderRadius: radius.full,
                                    backgroundColor: isActive ? colors.trainerPrimary : colors.surface,
                                    borderWidth: 1,
                                    borderColor: isActive ? colors.trainerPrimary : colors.surfaceBorder,
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

            {/* Booking list */}
            <Animated.ScrollView
                style={listStyle}
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: tabBarHeight + 16,
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={isRefreshing || (isFetching && !isLoading)}
                        onRefresh={handleRefresh}
                        tintColor={colors.trainerPrimary}
                        colors={[colors.trainerPrimary]}
                    />
                )}
            >
                {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                        <ClientBookingGroup
                            key={group.clientId}
                            group={group}
                            filterStatus={activeTab}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onComplete={handleComplete}
                        />
                    ))
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: radius.card,
                                backgroundColor: colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <Ionicons name="calendar-outline" size={26} color={colors.textDisabled} />
                        </View>
                        <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.textMuted }}>
                            No bookings
                        </Text>
                        <Text style={{ fontSize: fontSize.tag, color: colors.textSubtle, marginTop: 4 }}>
                            No bookings in this category yet
                        </Text>
                    </View>
                )}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}
