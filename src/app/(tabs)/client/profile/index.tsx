import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import HeroGradient from '@/components/ui/HeroGradient';
import { useAuth } from '@/contexts/auth';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast } from '@/lib';
import type { User } from '@/types/authTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROFILE_FIELDS: (keyof User)[] = [
    'email',
    'username',
    'full_name',
    'profile_image',
    'role',
];

function computeProfileCompletion(user: User | null): number {
    if (!user) return 0;
    const filled = PROFILE_FIELDS.filter((field) => !!user[field]).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function getInitials(user: User | null): string {
    const name = user?.full_name ?? user?.username ?? user?.email ?? '';
    return name
        .split(' ')
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

const SLIDE = 40;
const DUR = 350;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientProfile() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const { authState, getProfile } = useAuth();
    const [userData, setUserData] = useState<User | null>(authState.user);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const cardY = useSharedValue(SLIDE);
    const anim = useRef({ cardY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            v.cardY.value = SLIDE;
            v.cardY.value = withTiming(0, { duration: DUR });
        }, []),
    );

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));

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

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchProfile();
        setIsRefreshing(false);
    }, [fetchProfile]);

    const profileCompletion = computeProfileCompletion(userData);
    const initials = getInitials(userData);
    const displayName = userData?.full_name ?? userData?.username ?? 'User';
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
            <HeroGradient gradient={gradientColors.primary} fixed />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                )}
            >
                {/* ── Hero header ───────────────────────────────── */}
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ flex: 1, fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white }}>
                            My Profile
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/client/profile/profileMenu' as never)}
                            activeOpacity={0.75}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: radius.icon,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.18)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.28)',
                            }}
                        >
                            <Ionicons name="menu" size={20} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Content ───────────────────────────────────── */}
                <View style={{ paddingHorizontal: 20, marginTop: -48 }}>

                    {/* Profile Card */}
                    <Animated.View
                        className="bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardStrong, cardStyle]}
                    >
                        {/* Avatar + Info */}
                        <View className="flex-row items-center">
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

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
