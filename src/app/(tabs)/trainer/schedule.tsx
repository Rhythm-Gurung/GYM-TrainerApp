import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import DayScheduleCard from '@/components/trainer/DayScheduleCard';
import HeroGradient from '@/components/ui/HeroGradient';
import { DEFAULT_NEW_SLOT } from '@/constants/trainerSchedule.constants';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast, showSuccessToast } from '@/lib';
import { fetchMockSchedule, saveMockSchedule } from '@/mockData/trainerSchedule.mock';
import type { DaySchedule } from '@/types/trainerTypes';

// ─── Screen ───────────────────────────────────────────────────────────────────

const SLIDE = 30;
const DUR = 300;

export default function TrainerSchedule() {
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();

    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const listY = useSharedValue(SLIDE);
    const anim = useRef({ listY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            v.listY.value = SLIDE;
            v.listY.value = withTiming(0, { duration: DUR });
        }, []),
    );

    useFocusEffect(
        useCallback(() => {
            fetchMockSchedule()
                .then(setSchedule)
                .catch(() => showErrorToast('Failed to load schedule', 'Error'))
                .finally(() => setIsLoading(false));
        }, []),
    );

    const listStyle = useAnimatedStyle(() => ({ transform: [{ translateY: listY.value }] }));

    const toggleDay = (dayIndex: number) => {
        setSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex
                    ? {
                          ...d,
                          enabled: !d.enabled,
                          slots: !d.enabled
                              ? [{ id: `${dayIndex}-${Date.now()}`, ...DEFAULT_NEW_SLOT }]
                              : [],
                      }
                    : d),
            ),
        );
    };

    const addSlot = (dayIndex: number) => {
        setSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex
                    ? {
                          ...d,
                          slots: [
                              ...d.slots,
                              { id: `${dayIndex}-${Date.now()}`, ...DEFAULT_NEW_SLOT },
                          ],
                      }
                    : d),
            ),
        );
    };

    const removeSlot = (dayIndex: number, slotId: string) => {
        setSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex
                    ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
                    : d),
            ),
        );
    };

    const updateSlot = (
        dayIndex: number,
        slotId: string,
        field: 'startTime' | 'endTime',
        value: string,
    ) => {
        setSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex
                    ? {
                          ...d,
                          slots: d.slots.map((s) =>
                              (s.id === slotId ? { ...s, [field]: value } : s),
                          ),
                      }
                    : d),
            ),
        );
    };

    const handleSave = () => {
        setIsSaving(true);
        saveMockSchedule(schedule)
            .then(() => showSuccessToast('Availability saved!'))
            .catch(() => showErrorToast('Failed to save availability', 'Error'))
            .finally(() => setIsSaving(false));
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
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <HeroGradient gradient={gradientColors.trainer} fixed />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hero title */}
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.white }}>
                        Availability
                    </Text>
                    <Text style={{ fontSize: fontSize.body, color: colors.white65, marginTop: 2, fontWeight: '500' }}>
                        Set your weekly schedule
                    </Text>
                </View>

                <Animated.View style={[{ paddingHorizontal: 20, marginTop: -48 }, listStyle]}>
                    {schedule.map((day) => (
                        <DayScheduleCard
                            key={day.dayOfWeek}
                            day={day}
                            onToggle={() => toggleDay(day.dayOfWeek)}
                            onAddSlot={() => addSlot(day.dayOfWeek)}
                            onRemoveSlot={(slotId) => removeSlot(day.dayOfWeek, slotId)}
                            onUpdateSlot={(slotId, field, value) =>
                                updateSlot(day.dayOfWeek, slotId, field, value)}
                        />
                    ))}

                    {/* Save button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.8}
                        style={{
                            height: 52,
                            borderRadius: radius.card,
                            backgroundColor: isSaving ? colors.trainerMuted : colors.trainerPrimary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 8,
                            marginTop: 8,
                            ...shadow.trainer,
                        }}
                    >
                        <Ionicons name="save-outline" size={18} color={colors.white} />
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>
                            {isSaving ? 'Saving...' : 'Save Availability'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}
