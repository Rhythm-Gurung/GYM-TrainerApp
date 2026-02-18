import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

export default function TrainerSchedule() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View className="flex-1 items-center justify-center">
                <Text className="text-sub-heading font-semibold text-foreground">Trainer Schedule</Text>
            </View>
        </SafeAreaView>
    );
}
