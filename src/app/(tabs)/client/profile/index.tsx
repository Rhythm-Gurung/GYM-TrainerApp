import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
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

import { clientService } from '@/api/services/client.service';
import TrainerCard from '@/components/client/TrainerCard';
import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast, showSuccessToast } from '@/lib';
import type { User } from '@/types/authTypes';
import { mapApiTrainer, type ApiTrainer } from '@/types/clientTypes';
import { getClientMenuItems } from '@/types/profile/clientMenuItems';

// ─── Helpers ──────────────────────────────────────────────────────────────────


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
    const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const { authState, getProfile, logout } = useAuth();
    const [userData, setUserData] = useState<User | null>(authState.user);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [imageKey, setImageKey] = useState(0);

    const [favourites, setFavourites] = useState<ApiTrainer[]>([]);

    const scrollRef = useRef<ScrollView | null>(null);
    const favouritesYRef = useRef<number>(0);

    const cardY = useSharedValue(SLIDE);
    const menuY = useSharedValue(SLIDE);
    const anim = useRef({ cardY, menuY });

    const fetchFavourites = useCallback(async () => {
        try {
            const favs = await clientService.getFavourites();
            setFavourites(favs);
        } catch {
            // silently ignore — favourites are non-critical
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            v.cardY.value = SLIDE;
            v.cardY.value = withTiming(0, { duration: DUR });
            v.menuY.value = SLIDE;
            v.menuY.value = withDelay(120, withTiming(0, { duration: DUR }));
            // Always re-fetch favourites on focus so the list stays up-to-date
            fetchFavourites();
        }, [fetchFavourites]),
    );

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));
    const menuStyle = useAnimatedStyle(() => ({ transform: [{ translateY: menuY.value }] }));

    const fetchProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            const [profile, favs] = await Promise.all([
                getProfile(),
                clientService.getFavourites(),
            ]);
            setUserData(profile);
            setFavourites(favs);
            setImageKey((k) => k + 1);
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

    // Sync userData whenever authState.user is updated (e.g. after image removal in editProfile)
    useEffect(() => {
        if (authState.user) {
            setUserData(authState.user);
            setImageKey((k) => k + 1);
        }
    }, [authState.user]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchProfile();
        setIsRefreshing(false);
    }, [fetchProfile]);

    const handleLogout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            showSuccessToast('Logged out successfully', 'Success');
            router.replace('/(auth)/login' as never);
        } catch {
            showErrorToast('Failed to logout', 'Error');
        } finally {
            setIsLoggingOut(false);
        }
    }, [logout, router]);

    const menuItems = getClientMenuItems(router);

    useEffect(() => {
        if (scrollTo !== 'favourites') return undefined;
        // Defer slightly to allow layout measurement to settle.
        const t = setTimeout(() => {
            scrollRef.current?.scrollTo({ y: Math.max(0, favouritesYRef.current - 12), animated: true });
        }, 250);
        return () => clearTimeout(t);
    }, [scrollTo, favourites.length]);

    const initials = getInitials(userData);
    const displayName = userData?.full_name ?? userData?.username ?? 'User';
    const displayEmail = userData?.email ?? '';

    const favouriteTrainers = favourites.map(mapApiTrainer);
    const previewFavourites = favouriteTrainers.slice(0, 3);

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
                ref={(r) => { scrollRef.current = r; }}
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
                    <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white }}>
                        My Profile
                    </Text>
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
                                {(userData?.profile_image_url ?? userData?.profile_image) ? (
                                    <ExpoImage
                                        source={{
                                            uri: `${clientService.getClientProfileImageUrl()}?v=${imageKey}`,
                                            headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                        }}
                                        style={{ width: 72, height: 72, borderRadius: radius.card }}
                                        contentFit="cover"
                                        cachePolicy="none"
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
                                    onPress={() => router.push('/(tabs)/client/profile/editProfile' as never)}
                                    activeOpacity={0.8}
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
                                {!!userData?.username && (
                                    <Text className="text-xl font-bold text-black text-foreground-5 mt-0.5">
                                        {userData.username}
                                    </Text>
                                )}
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


                        {/* Favourites preview */}
                        {favouriteTrainers.length > 0 && (
                            <View
                                className="mt-5 pt-5 border-t border-surface"
                                onLayout={(e) => {
                                    favouritesYRef.current = e.nativeEvent.layout.y;
                                }}
                            >
                                <View className="flex-row items-center justify-between mb-3">
                                    <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary }}>
                                        Favourites
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push('/(tabs)/client/profile/favourites' as never)}
                                        activeOpacity={0.75}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    >
                                        <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.primary }}>
                                            {`See all (${favouriteTrainers.length})`}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ gap: 12 }}>
                                    {previewFavourites.map((t) => (
                                        <TrainerCard
                                            key={t.id}
                                            trainer={t}
                                            onPress={() => router.push({ pathname: '/(tabs)/client/trainerProfile', params: { id: t.id } } as never)}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </Animated.View>

                    {/* ── Account Settings ──────────────────────── */}
                    <Animated.View
                        className="mt-5 bg-white rounded-2xl border border-surface"
                        style={[shadow.cardSubtle, menuStyle]}
                    >
                        {/* Section header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }}>
                            <Ionicons name="settings-outline" size={16} color={colors.primary} />
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                                Account Settings
                            </Text>
                        </View>

                        {menuItems.map(({ id, icon, label, onPress }, index) => (
                            <TouchableOpacity
                                key={id}
                                onPress={onPress}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 20,
                                    paddingVertical: 14,
                                    borderBottomWidth: index !== menuItems.length - 1 ? 1 : 0,
                                    borderBottomColor: colors.surfaceBorder,
                                }}
                                activeOpacity={0.6}
                            >
                                <View
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: radius.sm,
                                        backgroundColor: colors.surface,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name={icon} size={15} color={colors.textMuted} />
                                </View>
                                <Text style={{ flex: 1, fontSize: fontSize.body, fontWeight: '500', color: colors.textSecondary, marginLeft: 12 }}>
                                    {label}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
                            </TouchableOpacity>
                        ))}

                        {/* Sign Out row inside the same card */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            disabled={isLoggingOut}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 20,
                                paddingVertical: 14,
                                gap: 12,
                            }}
                            activeOpacity={0.6}
                        >
                            <View
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: radius.sm,
                                    backgroundColor: 'rgba(255,59,48,0.08)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {isLoggingOut ? (
                                    <ActivityIndicator size="small" color={colors.error} />
                                ) : (
                                    <Ionicons name="log-out-outline" size={15} color={colors.error} />
                                )}
                            </View>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '500', color: colors.error }}>
                                Sign Out
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
