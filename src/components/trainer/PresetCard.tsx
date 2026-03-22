import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

import { DAYS_OF_WEEK } from '@/constants/trainerSchedule.constants';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { AvailabilityPreset } from '@/types/trainerAvailability.types';

// ─── Component ────────────────────────────────────────────────────────────────

interface PresetCardProps {
    preset: AvailabilityPreset;
    isApplying: boolean;
    isActive: boolean;
    activeScopeText?: string | null;
    onApply: (preset: AvailabilityPreset) => void;
    onDelete: (id: string) => void;
}

export default function PresetCard({ preset, isApplying, isActive, activeScopeText, onApply, onDelete }: PresetCardProps) {
    const activeDayCount = preset.schedule.filter((d) => d.enabled).length;
    const activeDayIndices = preset.schedule.filter((d) => d.enabled).map((d) => d.dayOfWeek);

    const confirmDelete = () => {
        Alert.alert(
            'Delete record?',
            `"${preset.name}" will be removed.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(preset.id) },
            ],
        );
    };

    return (
        <View
            style={{
                backgroundColor: colors.white,
                borderRadius: radius.card,
                padding: 16,
                borderWidth: 1,
                borderColor: isActive ? colors.trainerBorder : colors.surfaceBorder,
                marginBottom: 12,
                ...shadow.cardSubtle,
            }}
        >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.md,
                        backgroundColor: colors.trainerMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name={preset.icon as 'bookmark-outline'} size={20} color={colors.trainerPrimary} />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.textPrimary }}>
                        {preset.name}
                    </Text>
                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 1 }}>
                        {preset.description}
                    </Text>
                </View>

                {/* Active badge + day count + delete */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {isActive && (
                        <View style={{ backgroundColor: colors.statusNewBg, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.successDark }}>
                                Active
                            </Text>
                        </View>
                    )}
                    <View style={{ backgroundColor: colors.trainerMuted, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.trainerPrimary }}>
                            {activeDayCount}
d
                        </Text>
                    </View>
                    <TouchableOpacity onPress={confirmDelete} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Scope info (active only) */}
            {isActive && activeScopeText && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 10,
                        backgroundColor: colors.trainerSurface,
                        borderRadius: radius.md,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: colors.trainerBorder,
                    }}
                >
                    <Ionicons name="time-outline" size={13} color={colors.trainerPrimary} />
                    <Text style={{ fontSize: fontSize.tag, color: colors.trainerPrimary, fontWeight: '600', flex: 1 }}>
                        {activeScopeText}
                    </Text>
                </View>
            )}

            {/* Day pills */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {DAYS_OF_WEEK.map((day, i) => {
                    const isDayActive = activeDayIndices.includes(i);
                    return (
                        <View
                            key={day}
                            style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: radius.full,
                                backgroundColor: isDayActive ? colors.trainerMuted : colors.surface,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: isDayActive ? colors.trainerPrimary : colors.textDisabled }}>
                                {day.slice(0, 3)}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Restore button */}
            <TouchableOpacity
                onPress={() => onApply(preset)}
                disabled={isApplying}
                activeOpacity={0.8}
                style={{
                    marginTop: 12,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: isApplying ? colors.trainerMuted : colors.trainerPrimary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                }}
            >
                {isApplying ? (
                    <ActivityIndicator size="small" color={colors.trainerPrimary} />
                ) : (
                    <>
                        <Ionicons name="refresh-outline" size={16} color={colors.white} />
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>
                            Restore
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}
