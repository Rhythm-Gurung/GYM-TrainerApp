import { Text, View } from 'react-native';

import { colors, fontSize } from '@/constants/theme';

export function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, flex: 1 }}>
                {label}
            </Text>
            <Text
                style={{
                    fontSize: fontSize.tag,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    flex: 2,
                    textAlign: 'right',
                }}
            >
                {value}
            </Text>
        </View>
    );
}
