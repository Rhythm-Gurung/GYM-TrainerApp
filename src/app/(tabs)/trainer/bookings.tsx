import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
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

import TrainerBookingCard from '@/components/trainer/TrainerBookingCard';
import {
    STATUS_TABS,
    type BookingFilterStatus,
} from '@/constants/trainerBookings.constants';
import { colors, fontSize, radius } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib';
import { fetchMockTrainerBookings } from '@/mockData/trainerBookings.mock';
import type { TrainerSession } from '@/types/trainerTypes';

// ─── Screen ───────────────────────────────────────────────────────────────────

const SLIDE = 30;
const DUR = 300;

export default function TrainerBookings() {
    const tabBarHeight = useTabBarHeight();
    const { tab } = useLocalSearchParams<{ tab?: string }>();

    const [bookings, setBookings] = useState<TrainerSession[]>([]);
    const [activeTab, setActiveTab] = useState<BookingFilterStatus>('pending');
    const [isLoading, setIsLoading] = useState(true);

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
            fetchMockTrainerBookings()
                .then(setBookings)
                .catch(() => showErrorToast('Failed to load bookings', 'Error'))
                .finally(() => setIsLoading(false));
        }, []),
    );

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

    const filtered =
        activeTab === 'all'
            ? bookings
            : bookings.filter((b) => b.status === activeTab);

    const handleAccept = (id: string) => {
        setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'confirmed' } : b)),
        );
        showSuccessToast('Booking accepted');
    };

    const handleReject = (id: string) => {
        setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)),
        );
        showInfoToast('Booking rejected');
    };

    const handleComplete = (id: string) => {
        setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'completed' } : b)),
        );
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
            >
                {filtered.length > 0 ? (
                    filtered.map((session) => (
                        <TrainerBookingCard
                            key={session.id}
                            session={session}
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
