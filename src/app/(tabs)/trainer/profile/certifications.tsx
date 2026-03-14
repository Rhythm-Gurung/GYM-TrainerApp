import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { trainerService } from '@/api/services/trainer.service';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';
import type { CertificationListItem } from '@/types/trainerTypes';
  
function getVerificationBannerText(status: string): string {
    if (status === 'reverification_rejected') {
        return 'Verification rejected. Please review your documents or contact support.';
    }
    if (status === 're_verification_required') {
        return 'Updated files are under admin review. Profile completion returns to 100% once verified.';
    }
    return 'Your profile is awaiting initial verification by an admin.';
}

export default function Certifications() {
    const router = useRouter();
    const navigation = useNavigation();
    const { authState, getProfile } = useAuth();
    const verificationStatus = authState.user?.verification_status;
    const { width } = useWindowDimensions();

    const COLUMN_GAP = 12;
    const H_PADDING = 20;
    const cardWidth = (width - H_PADDING * 2 - COLUMN_GAP) / 2;
    const cardHeight = cardWidth * 1.41;

    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            parent?.setOptions({ tabBarStyle: { display: 'none' } });
            return () => parent?.setOptions({ tabBarStyle: undefined });
        }, [navigation]),
    );

    const [certifications, setCertifications] = useState<CertificationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [pendingImages, setPendingImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        trainerService.getCertifications()
            .then(setCertifications)
            .finally(() => setIsLoading(false));
    }, []);

    const toggleSelect = useCallback((id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleLongPress = useCallback((id: number) => {
        setPendingImages([]);
        setIsSelectMode(true);
        setSelectedIds(new Set([id]));
    }, []);

    const handleTap = useCallback((id: number) => {
        if (isSelectMode) toggleSelect(id);
    }, [isSelectMode, toggleSelect]);

    const cancelSelect = useCallback(() => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
    }, []);

    const canDelete = selectedIds.size > 0 && certifications.length - selectedIds.size >= 1;

    const handleDelete = useCallback(async () => {
        if (!canDelete) return;
        const shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
                'Delete Certifications',
                'Deleting certifications requires admin confirmation before your profile is updated.',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Confirm', onPress: () => resolve(true) },
                ],
                { cancelable: true, onDismiss: () => resolve(false) },
            );
        });
        if (!shouldContinue) return;
        setIsDeleting(true);
        try {
            await Promise.allSettled([...selectedIds].map((id) => trainerService.deleteCertification(id)));
            setCertifications((prev) => prev.filter((c) => !selectedIds.has(c.id)));
            showSuccessToast('Certifications deleted', 'Done');
            cancelSelect();
            getProfile().catch(() => { });
        } catch {
            showErrorToast('Delete failed', 'Error');
        } finally {
            setIsDeleting(false);
        }
    }, [canDelete, selectedIds, cancelSelect, getProfile]);

    const handlePickImages = useCallback(async () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets.length > 0) {
            setPendingImages(result.assets);
        }
    }, []);

    const handleCancelPending = useCallback(() => setPendingImages([]), []);

    const handleSubmitUpload = useCallback(async () => {
        const shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
                'Upload Certifications',
                'Uploading new certifications requires admin confirmation before your profile is updated.',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Confirm', onPress: () => resolve(true) },
                ],
                { cancelable: true, onDismiss: () => resolve(false) },
            );
        });
        if (!shouldContinue) return;
        setIsUploading(true);
        try {
            const files = pendingImages.map((a) => ({
                uri: a.uri,
                name: a.fileName ?? `cert_${Date.now()}.jpg`,
                type: a.mimeType ?? 'image/jpeg',
            }));
            await trainerService.uploadCertifications(files);
            const updated = await trainerService.getCertifications();
            setCertifications(updated);
            setPendingImages([]);
            showSuccessToast('Certifications uploaded', 'Success');
            getProfile().catch(() => { });
        } catch {
            showErrorToast('Upload failed', 'Error');
        } finally {
            setIsUploading(false);
        }
    }, [pendingImages, getProfile]);

    const scrollPaddingBottom = pendingImages.length > 0 ? 180 : 100;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>

            {/* ── Header ───────────────────────────────────────────── */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                    gap: 12,
                }}
            >
                {isSelectMode ? (
                    <>
                        <TouchableOpacity onPress={cancelSelect} activeOpacity={0.7}>
                            <Text style={{ fontSize: fontSize.body, color: colors.trainerPrimary, fontWeight: '600' }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>
                            {selectedIds.size}
                            {' '}
                            selected
                        </Text>
                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={!canDelete || isDeleting}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: canDelete ? colors.error : colors.surfaceSubtle,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: radius.full,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Ionicons name="trash-outline" size={16} color={canDelete ? colors.white : colors.textDisabled} />
                            )}
                            <Text
                                style={{
                                    fontSize: fontSize.tag,
                                    fontWeight: '600',
                                    color: canDelete ? colors.white : colors.textDisabled,
                                }}
                            >
                                Delete
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.textPrimary }}>
                                Certifications
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="hand-left-outline" size={12} color={colors.textMuted} />
                                <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                    Long press to select
                                </Text>
                            </View>
                        </View>
                        <View
                            style={{
                                backgroundColor: colors.trainerMuted,
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderRadius: radius.full,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.body, color: colors.trainerPrimary, fontWeight: '700' }}>
                                {certifications.length}
                            </Text>
                        </View>
                    </>
                )}
            </View>

            {/* ── Verification Banner ──────────────────────────────── */}
            {verificationStatus != null && verificationStatus !== 'verified' && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginHorizontal: 20,
                        marginTop: 12,
                        padding: 12,
                        borderRadius: radius.card,
                        backgroundColor: verificationStatus === 'reverification_rejected'
                            ? 'rgba(255,59,48,0.08)'
                            : '#FFFBEB',
                        borderWidth: 1,
                        borderColor: verificationStatus === 'reverification_rejected'
                            ? colors.error
                            : '#F59E0B',
                    }}
                >
                    <Ionicons
                        name={verificationStatus === 'reverification_rejected'
                            ? 'close-circle-outline'
                            : 'time-outline'}
                        size={16}
                        color={verificationStatus === 'reverification_rejected'
                            ? colors.error
                            : '#B45309'}
                    />
                    <Text
                        style={{
                            flex: 1,
                            fontSize: fontSize.caption,
                            color: verificationStatus === 'reverification_rejected'
                                ? colors.error
                                : '#92400E',
                            lineHeight: 18,
                        }}
                    >
                        {getVerificationBannerText(verificationStatus)}
                    </Text>
                </View>
            )}

            {/* ── Minimum 1 cert note ─────────────────────────────── */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginHorizontal: 20,
                    marginTop: 12,
                    padding: 12,
                    borderRadius: radius.card,
                    backgroundColor: colors.trainerMuted,
                }}
            >
                <Ionicons name="information-circle-outline" size={16} color={colors.trainerPrimary} />
                <Text style={{ flex: 1, fontSize: fontSize.caption, color: colors.trainerPrimary, lineHeight: 18 }}>
                    At least 1 certification is required. You cannot delete your last remaining certificate.
                </Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={{
                            padding: H_PADDING,
                            paddingBottom: scrollPaddingBottom,
                            flexGrow: 1,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {certifications.length > 0 ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: COLUMN_GAP }}>
                                {certifications.map((cert) => {
                                    const isSelected = selectedIds.has(cert.id);
                                    return (
                                        <TouchableOpacity
                                            key={cert.id}
                                            activeOpacity={0.85}
                                            onPress={() => handleTap(cert.id)}
                                            onLongPress={() => handleLongPress(cert.id)}
                                            style={[
                                                {
                                                    width: cardWidth,
                                                    height: cardHeight,
                                                    borderRadius: radius.card,
                                                    overflow: 'hidden',
                                                    backgroundColor: colors.surface,
                                                    borderWidth: isSelected ? 2 : 1,
                                                    borderColor: isSelected ? colors.trainerPrimary : colors.surfaceBorder,
                                                },
                                                shadow.cardSubtle,
                                            ]}
                                        >
                                            {cert.image_url ? (
                                                <ExpoImage
                                                    source={{
                                                        uri: trainerService.getCertificationImageUrl(cert.id),
                                                        headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                                    }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    contentFit="contain"
                                                />
                                            ) : (
                                                <View
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: colors.surfaceSubtle,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <Ionicons name="document-outline" size={36} color={colors.textDisabled} />
                                                    <Text style={{ fontSize: fontSize.tag, color: colors.textDisabled, fontWeight: '500' }}>
                                                        #
                                                        {cert.id}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Selection overlay */}
                                            {isSelectMode && (
                                                <View
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        backgroundColor: isSelected ? 'rgba(0,0,0,0.35)' : 'transparent',
                                                        alignItems: 'flex-end',
                                                        justifyContent: 'flex-start',
                                                        padding: 8,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: 22,
                                                            height: 22,
                                                            borderRadius: 11,
                                                            borderWidth: 2,
                                                            borderColor: colors.white,
                                                            backgroundColor: isSelected ? colors.trainerPrimary : 'transparent',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {isSelected && (
                                                            <Ionicons name="checkmark" size={13} color={colors.white} />
                                                        )}
                                                    </View>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    paddingTop: 60,
                                }}
                            >
                                <Ionicons name="ribbon-outline" size={48} color={colors.textDisabled} />
                                <Text style={{ fontSize: fontSize.body, color: colors.textDisabled, fontWeight: '500' }}>
                                    No certifications uploaded
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* ── Pending upload bar ───────────────────────────── */}
                    {pendingImages.length > 0 && (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: colors.white,
                                borderTopWidth: 1,
                                borderTopColor: colors.surfaceBorder,
                                paddingTop: 12,
                                paddingBottom: 16,
                                paddingHorizontal: H_PADDING,
                                gap: 10,
                            }}
                        >
                            {/* Thumbnails */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {pendingImages.map((img) => (
                                        <Image
                                            key={img.uri}
                                            source={{ uri: img.uri }}
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: radius.sm,
                                                backgroundColor: colors.surface,
                                            }}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Actions */}
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={handleCancelPending}
                                    activeOpacity={0.7}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        borderRadius: radius.card,
                                        borderWidth: 1,
                                        borderColor: colors.surfaceBorder,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.textMuted }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmitUpload}
                                    disabled={isUploading}
                                    activeOpacity={0.8}
                                    style={{
                                        flex: 2,
                                        paddingVertical: 12,
                                        borderRadius: radius.card,
                                        backgroundColor: colors.trainerPrimary,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        gap: 8,
                                    }}
                                >
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                    ) : (
                                        <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
                                    )}
                                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>
                                        {isUploading ? 'Uploading…' : `Upload ${pendingImages.length} ${pendingImages.length === 1 ? 'Image' : 'Images'}`}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ── FAB ─────────────────────────────────────────── */}
                    {!isSelectMode && pendingImages.length === 0 && (
                        <TouchableOpacity
                            onPress={handlePickImages}
                            activeOpacity={0.85}
                            style={[
                                {
                                    position: 'absolute',
                                    bottom: 40,
                                    right: 20,
                                    width: 68,
                                    height: 68,
                                    borderRadius: 34,
                                    backgroundColor: colors.trainerPrimary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                },
                                shadow.cardStrong,
                            ]}
                        >
                            <Ionicons name="add" size={34} color={colors.white} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
