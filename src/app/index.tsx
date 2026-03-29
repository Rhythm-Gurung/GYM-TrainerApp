import logoImage from '../../assets/images/SETuFull.png';

import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

const MIN_SPLASH_MS = 1800;

export default function Index() {
    'use no memo';

    const { isOnboardingCompleted, isLoading } = useOnboarding();
    const router = useRouter();

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.82);
    const screenOpacity = useSharedValue(1);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const screenStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
    }));

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
        scale.value = withTiming(1, { duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const navigate = () => {
            if (isOnboardingCompleted) {
                router.replace('/(auth)/login');
            } else {
                router.replace('/onboarding');
            }
        };

        screenOpacity.value = withDelay(MIN_SPLASH_MS, withTiming(0, { duration: 350 }));
        setTimeout(navigate, MIN_SPLASH_MS + 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, isOnboardingCompleted]);

    return (
        <Animated.View
            style={[
                { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
                screenStyle,
            ]}
        >
            <Animated.View style={[{ alignItems: 'center' }, logoStyle]}>
                <Image
                    source={logoImage}
                    style={{ width: 180, height: 180 }}
                    resizeMode="contain"
                />
            </Animated.View>
            <View
                style={{
                    position: 'absolute',
                    bottom: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                }}
            >
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#F97316' }} />
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#FBAD3A' }} />
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#F97316', opacity: 0.5 }} />
            </View>
        </Animated.View>
    );
}
