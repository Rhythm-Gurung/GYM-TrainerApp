import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { AVAILABILITY_TABS } from '@/constants/trainerSchedule.constants';
import { colors, fontSize, radius } from '@/constants/theme';
import type { AvailabilityTab } from '@/types/trainerAvailability.types';

// ─── Component ────────────────────────────────────────────────────────────────

interface AvailabilityTabBarProps {
    activeTab: AvailabilityTab;
    onTabChange: (tab: AvailabilityTab) => void;
}

export default function AvailabilityTabBar({ activeTab, onTabChange }: AvailabilityTabBarProps) {
    return (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: colors.surface,
                borderRadius: radius.card,
                padding: 4,
                marginHorizontal: 20,
                marginBottom: 16,
            }}
        >
            {AVAILABILITY_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => onTabChange(tab.key)}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            paddingVertical: 8,
                            borderRadius: radius.md,
                            backgroundColor: isActive ? colors.white : 'transparent',
                        }}
                    >
                        <Ionicons
                            name={tab.icon as 'calendar-outline'}
                            size={14}
                            color={isActive ? colors.trainerPrimary : colors.textMuted}
                        />
                        <Text
                            style={{
                                fontSize: fontSize.tag,
                                fontWeight: isActive ? '700' : '500',
                                color: isActive ? colors.trainerPrimary : colors.textMuted,
                            }}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
