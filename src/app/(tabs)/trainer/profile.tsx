import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast, showSuccessToast } from '@/lib';
import { fetchMockTrainerProfile } from '@/mockData/trainer.mock';
import type { TrainerProfile } from '@/types/trainerTypes';
import { getTrainerMenuItems } from '@/types/profile/trainerMenuItems';

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

const SLIDE = 40;
const DUR = 350;

export default function TrainerProfile() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const [profile, setProfile] = useState<TrainerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const cardY = useSharedValue(SLIDE);
    const menuY = useSharedValue(SLIDE);
    const signoutY = useSharedValue(SLIDE);

    const anim = useRef({ cardY, menuY, signoutY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };

            v.cardY.value = SLIDE;
            v.cardY.value = withTiming(0, ease);

            v.menuY.value = SLIDE;
            v.menuY.value = withDelay(120, withTiming(0, ease));

            v.signoutY.value = SLIDE;
            v.signoutY.value = withDelay(220, withTiming(0, ease));
        }, []),
    );

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));
    const menuStyle = useAnimatedStyle(() => ({ transform: [{ translateY: menuY.value }] }));
    const signoutStyle = useAnimatedStyle(() => ({ transform: [{ translateY: signoutY.value }] }));

    useEffect(() => {
        fetchMockTrainerProfile()
            .then(setProfile)
            .catch(() => showErrorToast('Failed to load profile', 'Error'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            showSuccessToast('Logged out successfully', 'Success');
            router.replace('/(auth)/login');
        } catch {
            showErrorToast('Failed to logout', 'Error');
        } finally {
            setIsLoggingOut(false);
        }
    }, [logout, router]);

    const menuItems = getTrainerMenuItems(router);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            </SafeAreaView>
        );
    }

    const initials = getInitials(profile?.fullName ?? '');
    const displayName = profile?.fullName ?? 'Trainer';
    const displayEmail = profile?.email ?? '';
    const profileCompletion = profile?.profileCompletion ?? 0;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            {/* Fixed gradient backdrop — does not scroll */}
            <HeroGradient gradient={gradientColors.trainer} fixed />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Title scrolls with the page */}
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white }}>
                        My Profile
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 20, marginTop: -48 }}>
                    {/* Profile Card */}
                    <Animated.View
                        className="bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardStrong, cardStyle]}
                    >
                        {/* Avatar + Info */}
                        <View className="flex-row items-center">
                            <View style={{ position: 'relative' }}>
                                {profile?.profileImage ? (
                                    <Image
                                        source={{ uri: profile.profileImage }}
                                        style={{ width: 72, height: 72, borderRadius: radius.card }}
                                    />
                                ) : (
                                    <View
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: radius.card,
                                            backgroundColor: colors.trainerMuted,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 2,
                                            borderColor: colors.trainerBorder,
                                        }}
                                    >
                                        <Text style={{ fontSize: fontSize.hero, fontWeight: '700', color: colors.trainerPrimary }}>
                                            {initials}
                                        </Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={{
                                        position: 'absolute',
                                        bottom: -4,
                                        right: -4,
                                        width: 28,
                                        height: 28,
                                        borderRadius: radius.icon,
                                        backgroundColor: colors.trainerPrimary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        ...shadow.trainer,
                                    }}
                                >
                                    <Ionicons name="camera" size={14} color={colors.white} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text className="text-lead font-bold text-foreground">{displayName}</Text>
                                <Text className="text-xs text-foreground-5 mt-0.5">{displayEmail}</Text>
                                {profile?.isVerified && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 6,
                                            backgroundColor: colors.trainerMuted,
                                            alignSelf: 'flex-start',
                                            paddingHorizontal: 8,
                                            paddingVertical: 2,
                                            borderRadius: radius.full,
                                            gap: 3,
                                        }}
                                    >
                                        <Ionicons name="checkmark-circle" size={10} color={colors.trainerPrimary} />
                                        <Text style={{ fontSize: fontSize.badge, color: colors.trainerPrimary, fontWeight: '600' }}>
                                            Verified Trainer
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Stats Row */}
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 20,
                                paddingTop: 20,
                                borderTopWidth: 1,
                                borderTopColor: colors.surfaceBorder,
                            }}
                        >
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.textPrimary }}>
                                    {profile?.rating.toFixed(1)}
                                </Text>
                                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                                    Rating
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: colors.surfaceBorder }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.accent }}>
                                    {profile?.reviews}
                                </Text>
                                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                                    Reviews
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: colors.surfaceBorder }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.textPrimary }}>
                                    {profile?.yearsOfExperience}
                                    +
                                </Text>
                                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                                    Yrs Exp
                                </Text>
                            </View>
                        </View>

                        {/* Profile Completion */}
                        <View className="mt-5 pt-5 border-t border-surface">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-xs text-foreground-5 font-medium">Profile Completion</Text>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.trainerPrimary }}>
                                    {`${profileCompletion}%`}
                                </Text>
                            </View>
                            <View
                                style={{
                                    height: 10,
                                    backgroundColor: colors.surface,
                                    borderRadius: radius.full,
                                    overflow: 'hidden',
                                }}
                            >
                                <View
                                    style={{
                                        height: '100%',
                                        width: `${profileCompletion}%`,
                                        backgroundColor: colors.trainerPrimary,
                                        borderRadius: radius.full,
                                    }}
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Menu Items */}
                    <Animated.View
                        className="mt-5 bg-white rounded-2xl overflow-hidden border border-surface"
                        style={[shadow.cardSubtle, menuStyle]}
                    >
                        {menuItems.map(({ id, icon, label, onPress }, index) => (
                            <View key={id}>
                                <TouchableOpacity
                                    onPress={onPress}
                                    className={`flex-row items-center px-5 py-4 ${index !== menuItems.length - 1 ? 'border-b border-surface-subtle' : ''}`}
                                    activeOpacity={0.6}
                                >
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: radius.sm,
                                            backgroundColor: colors.surface,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons name={icon} size={16} color={colors.textMuted} />
                                    </View>
                                    <Text className="flex-1 text-sm font-medium text-foreground ml-3">{label}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Sign Out */}
                    <Animated.View style={signoutStyle}>
                        <TouchableOpacity
                            onPress={handleLogout}
                            disabled={isLoggingOut}
                            className="mt-5 flex-row items-center justify-center py-3.5 rounded-2xl border border-error-border active:bg-error-bg"
                            style={{ gap: 8 }}
                            activeOpacity={0.7}
                        >
                            {isLoggingOut ? (
                                <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                                <Ionicons name="log-out-outline" size={16} color={colors.error} />
                            )}
                            <Text className="text-sm font-semibold text-error">Sign Out</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
