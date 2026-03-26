import { Text, TextInput, View } from 'react-native';

import { BOOKING_NOTES_MAX_LENGTH, BOOKING_NOTES_PLACEHOLDER } from '@/constants/clientBooking.constants';
import { colors, fontSize, radius } from '@/constants/theme';

export function NotesSection({
    notes,
    setNotes,
}: {
    notes: string;
    setNotes: (v: string) => void;
}) {
    return (
        <View style={{ gap: 8 }}>
            <Text
                style={{
                    fontSize: fontSize.body,
                    fontWeight: '700',
                    color: colors.textPrimary,
                }}
            >
                Notes (optional)
            </Text>
            <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={BOOKING_NOTES_PLACEHOLDER}
                placeholderTextColor={colors.textSubtle}
                maxLength={BOOKING_NOTES_MAX_LENGTH}
                multiline
                textAlignVertical="top"
                style={{
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                    borderRadius: radius.card,
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 14,
                    fontSize: fontSize.body,
                    color: colors.textPrimary,
                    height: 96,
                }}
            />
        </View>
    );
}
