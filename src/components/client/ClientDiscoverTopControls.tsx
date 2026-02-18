import { Ionicons } from '@expo/vector-icons';
import { Platform, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';

interface ClientDiscoverTopControlsProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onBackPress: () => void;
    onFiltersPress: () => void;
    showFilters: boolean;
}

export default function ClientDiscoverTopControls({
    searchQuery,
    onSearchChange,
    onBackPress,
    onFiltersPress,
    showFilters,
}: ClientDiscoverTopControlsProps) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <TouchableOpacity
                onPress={onBackPress}
                activeOpacity={0.7}
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: radius.md,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            <View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                }}
            >
                <Ionicons name="search-outline" size={18} color={colors.textSubtle} style={{ marginRight: 8 }} />
                <TextInput
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholder="Search trainers..."
                    placeholderTextColor={colors.textSubtle}
                    style={{ flex: 1, fontSize: fontSize.body, color: colors.textPrimary }}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
                {Platform.OS === 'android' && searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchChange('')} activeOpacity={0.6}>
                        <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                onPress={onFiltersPress}
                activeOpacity={0.7}
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: showFilters ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: showFilters ? colors.primary : colors.surfaceBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Ionicons name="options-outline" size={17} color={showFilters ? colors.white : colors.textPrimary} />
            </TouchableOpacity>
        </View>
    );
}
