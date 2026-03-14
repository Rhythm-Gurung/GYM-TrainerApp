import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
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
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { computeProfileCompletion } from '@/constants/trainerProfile.constants';
import { useAuth } from '@/contexts/auth';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { getInitials, resolveImageUrl, showErrorToast, showSuccessToast } from '@/lib';
import type { User } from '@/types/authTypes';
import type { GalleryItem } from '@/types/trainerTypes';

const SLIDE = 40;
const DUR = 350;

function getVerificationBannerTitle(status: string): string {
    if (status === 'reverification_rejected') return 'Verification Rejected';
    if (status === 're_verification_required') return 'Re-verification Required';
    return 'Awaiting Verification';
}

function getVerificationBannerBody(status: string): string {
    if (status === 'reverification_rejected') {
        return 'Your verification was rejected. Please review your documents or contact support.';
    }
    if (status === 're_verification_required') {
        return "You've updated verification-sensitive details. An admin will review them — profile completion returns to 100% once approved.";
    }
    return 'Your profile is pending initial review by an admin before you can go live.';
}

function withVersion(url: string | undefined, version: number): string | undefined {
    if (!url) return undefined;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
}

export default function TrainerProfile() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { getProfile, authState } = useAuth();

    const PREVIEW_GAP = 8;
    const PREVIEW_COLUMNS = 3;
    const previewContentWidth = Math.max(width - 80, 120);
    const previewTileSize = Math.floor(
        (previewContentWidth - PREVIEW_GAP * (PREVIEW_COLUMNS - 1)) / PREVIEW_COLUMNS,
    );

    const [user, setUser] = useState<User | null>(null);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [idProofVersion, setIdProofVersion] = useState(Date.now());
    const [galleryVersion, setGalleryVersion] = useState(Date.now());
    const [isUpdatingProfileImage, setIsUpdatingProfileImage] = useState(false);
    const [isUpdatingIdProof, setIsUpdatingIdProof] = useState(false);

    const cardY = useSharedValue(SLIDE);
    const menuY = useSharedValue(SLIDE);
    const anim = useRef({ cardY, menuY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };
            v.cardY.value = SLIDE;
            v.cardY.value = withTiming(0, ease);
            v.menuY.value = SLIDE;
            v.menuY.value = withDelay(120, withTiming(0, ease));

            setIsLoading(true);
            setIdProofVersion(Date.now());
            setGalleryVersion(Date.now());
            Promise.all([getProfile(), trainerService.getGallery()])
                .then(([profile, galleryItems]) => {
                    setUser(profile);
                    setGallery(galleryItems);
                })
                .catch((err) => console.warn('[Profile] whoami failed:', err?.response?.status, err?.response?.data))
                .finally(() => setIsLoading(false));
        }, [getProfile]),
    );

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));
    const menuStyle = useAnimatedStyle(() => ({ transform: [{ translateY: menuY.value }] }));

    const handleEditProfileImage = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.9,
        });

        if (result.canceled || result.assets.length === 0) return;

        const asset = result.assets[0];
        setIsUpdatingProfileImage(true);
        try {
            await trainerService.uploadProfileImage({
                uri: asset.uri,
                name: asset.fileName ?? `profile_${Date.now()}.jpg`,
                type: asset.mimeType ?? 'image/jpeg',
            });
            const refreshedProfile = await getProfile();
            setUser(refreshedProfile);
            showSuccessToast('Profile image updated', 'Success');
        } catch {
            showErrorToast('Failed to update profile image', 'Error');
        } finally {
            setIsUpdatingProfileImage(false);
        }
    }, [getProfile]);

    const handleEditIdProof = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.9,
        });

        if (result.canceled || result.assets.length === 0) return;

        const asset = result.assets[0];

        const shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
                'Change ID Proof',
                'Are you sure you want to replace your current ID proof?',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Confirm', onPress: () => resolve(true) },
                ],
                { cancelable: true, onDismiss: () => resolve(false) },
            );
        });

        if (!shouldContinue) return;

        setIsUpdatingIdProof(true);
        try {
            await trainerService.uploadIdProof({
                uri: asset.uri,
                name: asset.fileName ?? `id_proof_${Date.now()}.jpg`,
                type: asset.mimeType ?? 'image/jpeg',
            });
            const refreshedProfile = await getProfile();
            setUser(refreshedProfile);
            setIdProofVersion(Date.now());
            showSuccessToast('ID proof updated', 'Success');
        } catch {
            showErrorToast('Failed to update ID proof', 'Error');
        } finally {
            setIsUpdatingIdProof(false);
        }
    }, [getProfile]);

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
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 20 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ flex: 1, fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white }}>
                            My Profile
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/trainer/profile/profileMenu' as never)}
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
                                    onPress={handleEditProfileImage}
                                    disabled={isUpdatingProfileImage}
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
                                    {isUpdatingProfileImage ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                    ) : (
                                        <Ionicons name="camera" size={14} color={colors.white} />
                                    )}
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
                                        ? `Rs${user.pricing_per_session}`
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

                    {/* ── Verification Banner ───────────────────────────── */}
                    {user?.verification_status != null && user.verification_status !== 'verified' && (
                        <Animated.View
                            style={[
                                {
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    gap: 10,
                                    marginTop: 12,
                                    padding: 14,
                                    borderRadius: radius.card,
                                    backgroundColor: user.verification_status === 'reverification_rejected'
                                        ? 'rgba(255,59,48,0.08)'
                                        : '#FFFBEB',
                                    borderWidth: 1,
                                    borderColor: user.verification_status === 'reverification_rejected'
                                        ? colors.error
                                        : '#F59E0B',
                                },
                                cardStyle,
                            ]}
                        >
                            <Ionicons
                                name={user.verification_status === 'reverification_rejected'
                                    ? 'close-circle-outline'
                                    : 'time-outline'}
                                size={18}
                                color={user.verification_status === 'reverification_rejected'
                                    ? colors.error
                                    : '#B45309'}
                            />
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text
                                    style={{
                                        fontSize: fontSize.tag,
                                        fontWeight: '700',
                                        color: user.verification_status === 'reverification_rejected'
                                            ? colors.error
                                            : '#92400E',
                                    }}
                                >
                                    {getVerificationBannerTitle(user.verification_status)}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: fontSize.caption,
                                        color: user.verification_status === 'reverification_rejected'
                                            ? colors.error
                                            : '#92400E',
                                        lineHeight: 18,
                                        opacity: 0.85,
                                    }}
                                >
                                    {getVerificationBannerBody(user.verification_status)}
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* ── ID Proof ─────────────────────────────────────── */}
                    <Animated.View
                        className="mt-5 bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardSubtle, cardStyle]}
                    >
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center" style={{ gap: 8 }}>
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
                            <TouchableOpacity
                                onPress={handleEditIdProof}
                                disabled={isUpdatingIdProof}
                                activeOpacity={0.75}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    paddingHorizontal: 12,
                                    paddingVertical: 7,
                                    borderRadius: radius.full,
                                    backgroundColor: colors.trainerMuted,
                                    borderWidth: 1,
                                    borderColor: colors.trainerBorder,
                                }}
                            >
                                {isUpdatingIdProof ? (
                                    <ActivityIndicator size="small" color={colors.trainerPrimary} />
                                ) : (
                                    <Ionicons
                                        name={user?.id_proof_url ? 'create-outline' : 'cloud-upload-outline'}
                                        size={14}
                                        color={colors.trainerPrimary}
                                    />
                                )}
                                <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.trainerPrimary }}>
                                    {user?.id_proof_url ? 'Edit ID Proof' : 'Upload ID Proof'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {user?.id_proof_url ? (
                            <ExpoImage
                                source={{
                                    uri: `${trainerService.getIdProofUrl()}?v=${idProofVersion}`,
                                    headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                }}
                                style={{
                                    width: '100%',
                                    height: 210,
                                    borderRadius: radius.sm,
                                }}
                                contentFit="cover"
                                cachePolicy="none"
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

                    {/* ── Gallery ────────────────────────────────────── */}
                    <Animated.View
                        className="mt-5 bg-white rounded-2xl p-5 border border-surface"
                        style={[shadow.cardSubtle, menuStyle]}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center" style={{ gap: 8 }}>
                                <Ionicons name="images-outline" size={18} color={colors.trainerPrimary} />
                                <Text
                                    style={{
                                        fontSize: fontSize.body,
                                        fontWeight: '700',
                                        color: colors.textPrimary,
                                    }}
                                >
                                    Gallery
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/trainer/profile/gallery' as never)}
                                activeOpacity={0.75}
                                style={{
                                    width: 32,
                                    height: 32,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.trainerMuted,
                                    borderWidth: 1,
                                    borderColor: colors.trainerBorder,
                                }}
                            >
                                <Ionicons name="chevron-forward" size={16} color={colors.trainerPrimary} />
                            </TouchableOpacity>
                        </View>

                        {gallery.length > 0 ? (
                            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: PREVIEW_GAP }}>
                                {gallery.slice(0, 9).map((item) => {
                                    const imageUri = withVersion(resolveImageUrl(item.image_url), galleryVersion);
                                    if (!imageUri) return null;

                                    return (
                                        <TouchableOpacity
                                            key={`${item.id}-${galleryVersion}`}
                                            activeOpacity={0.82}
                                            onPress={() => router.push('/(tabs)/trainer/profile/gallery' as never)}
                                            style={{ width: previewTileSize }}
                                        >
                                            <ExpoImage
                                                source={{
                                                    uri: imageUri,
                                                    headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                                }}
                                                style={{
                                                    width: previewTileSize,
                                                    height: previewTileSize,
                                                    borderRadius: radius.sm,
                                                    backgroundColor: colors.surface,
                                                }}
                                                contentFit="cover"
                                                cachePolicy="none"
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted, marginTop: 8 }}>
                                No gallery images yet
                            </Text>
                        )}
                    </Animated.View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
