import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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

import { trainerService } from '@/api/services/trainer.service';
import HeroGradient from '@/components/ui/HeroGradient';
import { API_CONFIG } from '@/constants/config';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast, showSuccessToast } from '@/lib';
import type { User } from '@/types/authTypes';
import { getTrainerMenuItems } from '@/types/profile/trainerMenuItems';
import type { CertificationListItem } from '@/types/trainerTypes';

function resolveImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_CONFIG.BASE_URL}${url}`;
}

const TRAINER_PROFILE_FIELDS: (keyof User)[] = [
    'email', 'username', 'full_name', 'profile_image',
    'bio', 'contact_no', 'years_of_experience', 'expertise_categories',
    'pricing_per_session', 'session_type',
];

function computeProfileCompletion(user: User | null): number {
    if (!user) return 0;
    const filled = TRAINER_PROFILE_FIELDS.filter((f) => {
        const val = user[f];
        return val !== undefined && val !== null && val !== '';
    }).length;
    return Math.round((filled / TRAINER_PROFILE_FIELDS.length) * 100);
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

export default function TrainerProfile() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const { logout, getProfile, authState } = useAuth();

    const [user, setUser] = useState<User | null>(null);
    const [certifications, setCertifications] = useState<CertificationListItem[]>([]);
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

            setIsLoading(true);
            Promise.allSettled([
                getProfile(),
                trainerService.getCertifications(),
            ]).then(([userResult, certsResult]) => {
                if (userResult.status === 'fulfilled') {
                    setUser(userResult.value);
                } else {
                    console.warn('[Profile] whoami failed:', userResult.reason?.response?.status, userResult.reason?.response?.data);
                }

                if (certsResult.status === 'fulfilled') {
                    setCertifications(certsResult.value);
                } else {
                    console.warn('[Profile] Certifications failed:', certsResult.reason?.response?.status, certsResult.reason?.response?.data);
                }
            }).finally(() => setIsLoading(false));
        }, [getProfile]),
    );

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));
    const menuStyle = useAnimatedStyle(() => ({ transform: [{ translateY: menuY.value }] }));
    const signoutStyle = useAnimatedStyle(() => ({ transform: [{ translateY: signoutY.value }] }));

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

    const initials = getInitials(user);
    const displayName = user?.full_name ?? user?.username ?? 'Trainer';
    const displayEmail = user?.email ?? '';
    const profileCompletion = computeProfileCompletion(user);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <HeroGradient gradient={gradientColors.trainer} fixed />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white }}>
                        My Profile
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 20, marginTop: -48 }}>

                    {/* ── Profile Card ─────────────────────────────────── */}
                    <Animated.View
                        className="bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardStrong, cardStyle]}
                    >
                        {/* Avatar + Info */}
                        <View className="flex-row items-center">
                            <View style={{ position: 'relative' }}>
                                {user?.profile_image ? (
                                    <Image
                                        source={{ uri: resolveImageUrl(user.profile_image) }}
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: radius.card,
                                        }}
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
                                        <Text
                                            style={{
                                                fontSize: fontSize.hero,
                                                fontWeight: '700',
                                                color: colors.trainerPrimary,
                                            }}
                                        >
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
                                {user?.is_email_verified && (
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
                                        <Text
                                            style={{
                                                fontSize: fontSize.badge,
                                                color: colors.trainerPrimary,
                                                fontWeight: '600',
                                            }}
                                        >
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
                                    {user?.years_of_experience ?? 0}
                                    +
                                </Text>
                                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                                    Yrs Exp
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: colors.surfaceBorder }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.accent }}>
                                    {user?.session_type ?? '—'}
                                </Text>
                                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                                    Session
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: colors.surfaceBorder }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.textPrimary }}>
                                    {user?.pricing_per_session
                                        ? `$${user.pricing_per_session}`
                                        : '—'}
                                </Text>
                                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                                    /Session
                                </Text>
                            </View>
                        </View>

                        {/* Profile Completion */}
                        <View className="mt-5 pt-5 border-t border-surface">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-xs text-foreground-5 font-medium">Profile Completion</Text>
                                <Text
                                    style={{
                                        fontSize: fontSize.tag,
                                        fontWeight: '700',
                                        color: colors.trainerPrimary,
                                    }}
                                >
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

                    {/* ── ID Proof ─────────────────────────────────────── */}
                    <Animated.View
                        className="mt-5 bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardSubtle, cardStyle]}
                    >
                        <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                            <Ionicons name="card-outline" size={18} color={colors.trainerPrimary} />
                            <Text
                                style={{
                                    fontSize: fontSize.body,
                                    fontWeight: '700',
                                    color: colors.textPrimary,
                                }}
                            >
                                ID Proof
                            </Text>
                        </View>
                        {user?.id_proof_url ? (
                            <ExpoImage
                                source={{ uri: trainerService.getIdProofUrl(), headers: { Authorization: `Bearer ${authState.token ?? ''}` } }}
                                style={{
                                    width: '100%',
                                    height: 180,
                                    borderRadius: radius.sm,
                                }}
                                contentFit="cover"
                            />
                        ) : (
                            <View
                                style={{
                                    height: 100,
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.surfaceSubtle,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: colors.surfaceBorder,
                                    borderStyle: 'dashed',
                                }}
                            >
                                <Ionicons name="image-outline" size={28} color={colors.textDisabled} />
                                <Text
                                    style={{
                                        fontSize: fontSize.caption,
                                        color: colors.textDisabled,
                                        marginTop: 6,
                                    }}
                                >
                                    No ID proof uploaded
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* ── Certifications ───────────────────────────────── */}
                    <Animated.View
                        className="mt-5 bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardSubtle, cardStyle]}
                    >
                        <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                            <Ionicons name="ribbon-outline" size={18} color={colors.trainerPrimary} />
                            <Text
                                style={{
                                    fontSize: fontSize.body,
                                    fontWeight: '700',
                                    color: colors.textPrimary,
                                }}
                            >
                                Certifications
                            </Text>
                            <View
                                style={{
                                    marginLeft: 'auto',
                                    backgroundColor: colors.trainerMuted,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: radius.full,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.badge,
                                        color: colors.trainerPrimary,
                                        fontWeight: '600',
                                    }}
                                >
                                    {certifications.length}
                                </Text>
                            </View>
                        </View>

                        {certifications.length > 0 ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {certifications.map((cert) => (
                                    <View
                                        key={cert.id}
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: radius.sm,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {cert.image_url ? (
                                            <ExpoImage
                                                source={{ uri: trainerService.getCertificationImageUrl(cert.id), headers: { Authorization: `Bearer ${authState.token ?? ''}` } }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <View
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: colors.surfaceSubtle,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: 1,
                                                    borderColor: colors.surfaceBorder,
                                                }}
                                            >
                                                <Ionicons name="document-outline" size={24} color={colors.textDisabled} />
                                                <Text style={{ fontSize: 10, color: colors.textDisabled, marginTop: 4 }}>
                                                    #
                                                    {cert.id}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View
                                style={{
                                    height: 80,
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.surfaceSubtle,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: colors.surfaceBorder,
                                    borderStyle: 'dashed',
                                }}
                            >
                                <Ionicons name="ribbon-outline" size={24} color={colors.textDisabled} />
                                <Text
                                    style={{
                                        fontSize: fontSize.caption,
                                        color: colors.textDisabled,
                                        marginTop: 6,
                                    }}
                                >
                                    No certifications uploaded
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* ── Menu Items ───────────────────────────────────── */}
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

                    {/* ── Sign Out ─────────────────────────────────────── */}
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
