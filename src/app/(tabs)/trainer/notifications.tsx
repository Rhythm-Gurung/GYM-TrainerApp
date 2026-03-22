import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import NotificationCard from '@/components/client/NotificationCard';
import { colors, fontSize, radius } from '@/constants/theme';
import { MOCK_TRAINER_NOTIFICATIONS } from '@/mockData/trainerDashboard.mock';

const SLIDE = -40;
const DUR = 280;
const STAGGER = 55;

// Shared values declared per-slot to satisfy React hook rules (no hooks in loops).
// Count matches MOCK_TRAINER_NOTIFICATIONS length (5).
function TrainerNotificationList({ isRefreshing, onRefresh }: { isRefreshing: boolean; onRefresh: () => void }) {
    const x0 = useSharedValue(SLIDE);
    const x1 = useSharedValue(SLIDE);
    const x2 = useSharedValue(SLIDE);
    const x3 = useSharedValue(SLIDE);
    const x4 = useSharedValue(SLIDE);

    const animRef = useRef({ x0, x1, x2, x3, x4 });

    useFocusEffect(
        useCallback(() => {
            const v = animRef.current;
            const ease = { duration: DUR };

            v.x0.value = SLIDE;
            v.x0.value = withTiming(0, ease);

            v.x1.value = SLIDE;
            v.x1.value = withDelay(STAGGER, withTiming(0, ease));

            v.x2.value = SLIDE;
            v.x2.value = withDelay(STAGGER * 2, withTiming(0, ease));

            v.x3.value = SLIDE;
            v.x3.value = withDelay(STAGGER * 3, withTiming(0, ease));

            v.x4.value = SLIDE;
            v.x4.value = withDelay(STAGGER * 4, withTiming(0, ease));
        }, []),
    );

    const slots = [x0, x1, x2, x3, x4];

    return (
        <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
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
            {MOCK_TRAINER_NOTIFICATIONS.map((item, index) => (
                <NotificationCard
                    key={item.id}
                    notification={item}
                    animX={slots[index]}
                    unreadBg={colors.trainerSurface}
                    unreadBorder={colors.trainerBorderSm}
                    unreadDot={colors.trainerPrimary}
                />
            ))}
        </ScrollView>
    );
}

export default function TrainerNotifications() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    }, []);

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
                    onPress={() => {
                        // TODO: mark all as read via API
                    }}
                >
                    <Ionicons name="checkmark-done-outline" size={15} color={colors.trainerPrimary} />
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.trainerPrimary }}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            <TrainerNotificationList isRefreshing={isRefreshing} onRefresh={handleRefresh} />
        </SafeAreaView>
    );
}
