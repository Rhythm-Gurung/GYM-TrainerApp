import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingCard from '@/components/client/BookingCard';
import { colors, fontSize, radius } from '@/constants/theme';
import { mockBookings } from '@/data/mockData';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import type { Booking } from '@/types/clientTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = Booking['status'];
type FilterValue = BookingStatus | 'all';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: FilterValue }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

// ─── Animation constants ──────────────────────────────────────────────────────

// Negative X → starts left, slides into place (same as notifications)
const SLIDE = -40;
const DUR = 280;
const STAGGER = 60;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientBookings() {
    const tabBarHeight = useTabBarHeight();
    const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

    const filtered =
        activeFilter === 'all'
            ? mockBookings
            : mockBookings.filter((b) => b.status === activeFilter);

    // ── Animation ─────────────────────────────────────────────────────────────
    // Shared values declared per-slot (hook rules: no hooks inside loops).
    // Count matches mockBookings length (3).
    const x0 = useSharedValue(SLIDE);
    const x1 = useSharedValue(SLIDE);
    const x2 = useSharedValue(SLIDE);

    // Wrap in ref so useCallback can mutate without react-hooks/immutability errors
    const animRef = useRef({ x0, x1, x2 });

    useFocusEffect(
        useCallback(() => {
            const v = animRef.current;
            const ease = { duration: DUR };

            v.x0.value = SLIDE; v.x0.value = withTiming(0, ease);
            v.x1.value = SLIDE; v.x1.value = withDelay(STAGGER, withTiming(0, ease));
            v.x2.value = SLIDE; v.x2.value = withDelay(STAGGER * 2, withTiming(0, ease));
        }, []),
    );

    // Re-animate when filter changes
    function handleFilterChange(value: FilterValue) {
        setActiveFilter(value);
        const v = animRef.current;
        const ease = { duration: DUR };
        v.x0.value = SLIDE; v.x0.value = withTiming(0, ease);
        v.x1.value = SLIDE; v.x1.value = withDelay(STAGGER, withTiming(0, ease));
        v.x2.value = SLIDE; v.x2.value = withDelay(STAGGER * 2, withTiming(0, ease));
    }

    const slots = [x0, x1, x2];

    return (
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
                    {STATUS_TABS.map((tab) => {
                        const isActive = activeFilter === tab.value;
                        return (
                            <TouchableOpacity
                                key={tab.value}
                                onPress={() => handleFilterChange(tab.value)}
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
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── List ─────────────────────────────────────────────────────── */}
            <ScrollView
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: tabBarHeight + 16,
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
            >
                {filtered.length > 0 ? (
                    filtered.map((booking, index) => (
                        <BookingCard key={booking.id} booking={booking} animX={slots[index]} />
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

        </SafeAreaView>
    );
}
