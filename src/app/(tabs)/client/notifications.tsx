import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import NotificationCard from '@/components/client/NotificationCard';
import { colors, fontSize, radius } from '@/constants/theme';
import { mockNotifications } from '@/data/mockData';

const SLIDE = -40; // negative X → starts left, slides into place
const DUR = 280;
const STAGGER = 55;

// Shared values are declared per-slot at the top level of a component to satisfy
// React hook rules (no hooks inside loops). Count matches mockNotifications.
function NotificationList() {
    const x0 = useSharedValue(SLIDE);
    const x1 = useSharedValue(SLIDE);
    const x2 = useSharedValue(SLIDE);

    // Wrap in ref so useCallback can mutate without react-hooks/immutability errors
    const animRef = useRef({ x0, x1, x2 });

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
        }, []),
    );

    const slots = [x0, x1, x2];

    return (
        <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
        >
            {mockNotifications.map((item, index) => (
                <NotificationCard
                    key={item.id}
                    notification={item}
                    animX={slots[index]}
                />
            ))}
        </ScrollView>
    );
}

export default function ClientNotifications() {
    const router = useRouter();

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
                    <Ionicons name="checkmark-done-outline" size={15} color={colors.primary} />
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.primary }}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            <NotificationList />
        </SafeAreaView>
    );
}
