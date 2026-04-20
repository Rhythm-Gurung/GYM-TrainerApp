import logoImage from '../../assets/images/SETuFull.png';

import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';

const MIN_SPLASH_MS = 1800;

export default function Index() {
    const { isOnboardingCompleted, isLoading } = useOnboarding();
    const router = useRouter();

    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.82)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
    }, [opacity, scale]);

    useEffect(() => {
        if (isLoading) return;

        const navigate = () => {
            if (isOnboardingCompleted) {
                router.replace('/(auth)/login');
            } else {
                router.replace('/onboarding');
            }
        };

        Animated.timing(screenOpacity, {
            toValue: 0,
            duration: 350,
            delay: MIN_SPLASH_MS,
            useNativeDriver: true,
        }).start();
        setTimeout(navigate, MIN_SPLASH_MS + 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, isOnboardingCompleted]);

    return (
        <Animated.View
            style={[
                { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
                { opacity: screenOpacity },
            ]}
        >
            <Animated.View style={[{ alignItems: 'center' }, { opacity, transform: [{ scale }] }]}>
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
