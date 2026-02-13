import {
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Favorite() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View className="flex-1 items-center justify-center">
                <Text className="text-xl font-semibold text-gray-800">Favorite</Text>
            </View>
        </SafeAreaView>
    );
}
