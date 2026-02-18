import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { useAuth } from '@/contexts/auth';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast, showSuccessToast } from '@/lib';
import type { User } from '@/types/authTypes';
import { getClientMenuItems } from '@/types/profile/clientMenuItems';

const PROFILE_FIELDS: (keyof User)[] = [
    'email',
    'username',
    'business_name',
    'profile_image',
    'role',
];

function computeProfileCompletion(user: User | null): number {
    if (!user) return 0;
    const filled = PROFILE_FIELDS.filter((field) => !!user[field]).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function getInitials(user: User | null): string {
    const name = user?.business_name ?? user?.username ?? user?.email ?? '';
    return name
        .split(' ')
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

const SLIDE = 40;
const DUR = 350;

export default function ClientProfile() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const { authState, logout, getProfile } = useAuth();
    const [userData, setUserData] = useState<User | null>(authState.user);
    const [isLoading, setIsLoading] = useState(false);
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

    const fetchProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            const profile = await getProfile();
            setUserData(profile);
        } catch {
            showErrorToast('Failed to load profile', 'Error');
        } finally {
            setIsLoading(false);
        }
    }, [getProfile]);

    useEffect(() => {
        if (!userData) {
            fetchProfile();
        }
    }, [userData, fetchProfile]);

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

    const menuItems = getClientMenuItems(router);
    const profileCompletion = computeProfileCompletion(userData);
    const initials = getInitials(userData);
    const displayName = userData?.business_name ?? userData?.username ?? 'User';
    const displayEmail = userData?.email ?? '';

    if (isLoading && !userData) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <LinearGradient
                    colors={gradientColors.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        paddingHorizontal: 20,
                        paddingTop: insets.top + 24,
                        paddingBottom: 120,
                        borderBottomLeftRadius: radius.hero,
                        borderBottomRightRadius: radius.hero,
                        overflow: 'hidden',
                    }}
                >
                    <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white }}>
                        My Profile
                    </Text>
                </LinearGradient>

                <View style={{ paddingHorizontal: 20, marginTop: -48 }}>
                    {/* Profile Card */}
                    <Animated.View
                        className="bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardStrong, cardStyle]}
                    >
                        <View className="flex-row items-center">
                            {/* Avatar */}
                            <View style={{ position: 'relative' }}>
                                {userData?.profile_image ? (
                                    <Image
                                        source={{ uri: userData.profile_image }}
                                        style={{ width: 72, height: 72, borderRadius: radius.card }}
                                    />
                                ) : (
                                    <View
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: radius.card,
                                            backgroundColor: colors.primaryMuted,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 2,
                                            borderColor: colors.primaryBorder,
                                        }}
                                    >
                                        <Text style={{ fontSize: fontSize.hero, fontWeight: '700', color: colors.primary }}>
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
                                        backgroundColor: colors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        ...shadow.primary,
                                    }}
                                >
                                    <Ionicons name="camera" size={14} color={colors.white} />
                                </TouchableOpacity>
                            </View>

                            {/* User Info */}
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text className="text-lead font-bold text-foreground">{displayName}</Text>
                                <Text className="text-xs text-foreground-5 mt-0.5">{displayEmail}</Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 6,
                                        backgroundColor: colors.primaryMuted,
                                        alignSelf: 'flex-start',
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: radius.full,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: colors.primary,
                                            marginRight: 4,
                                        }}
                                    />
                                    <Text style={{ fontSize: fontSize.badge, color: colors.primary, fontWeight: '600' }}>
                                        Client Account
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Profile Completion */}
                        <View className="mt-5 pt-5 border-t border-surface">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-xs text-foreground-5 font-medium">Profile Completion</Text>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.primary }}>
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
                                        backgroundColor: colors.primary,
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
