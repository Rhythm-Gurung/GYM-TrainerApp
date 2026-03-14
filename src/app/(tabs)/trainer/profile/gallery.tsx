import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trainerService } from '@/api/services/trainer.service';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { resolveImageUrl, showErrorToast, showSuccessToast } from '@/lib';
import type { GalleryItem } from '@/types/trainerTypes';

function withVersion(url: string | undefined, version: number): string | undefined {
    if (!url) return undefined;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
}

export default function GalleryScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { authState } = useAuth();
    const { width } = useWindowDimensions();

    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [version, setVersion] = useState(Date.now());
    const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [captionInput, setCaptionInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

    const [isUploadPreviewVisible, setIsUploadPreviewVisible] = useState(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);

    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const GRID_GAP = 8;
    const GRID_COLUMNS = 3;
    const containerWidth = Math.max(width - 40, 120);
    const tileSize = Math.floor((containerWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

    const loadGallery = useCallback(async () => {
        try {
            const items = await trainerService.getGallery();
            setGallery(items);
            setVersion(Date.now());
        } catch {
            showErrorToast('Failed to load gallery', 'Error');
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            parent?.setOptions({ tabBarStyle: { display: 'none' } });

            setIsLoading(true);
            loadGallery().finally(() => setIsLoading(false));

            return () => parent?.setOptions({ tabBarStyle: undefined });
        }, [navigation, loadGallery]),
    );

    const closeUploadPreview = useCallback(() => {
        if (isUploading) return;
        setIsUploadPreviewVisible(false);
        setPendingAssets([]);
        setCaptionInput('');
    }, [isUploading]);

    const handlePickImages = useCallback(async () => {
        if (isUploading) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.85,
        });

        if (result.canceled || result.assets.length === 0) return;

        setPendingAssets(result.assets);
        setCaptionInput('');
        setIsUploadPreviewVisible(true);
    }, [isUploading]);

    const submitCreate = useCallback(async () => {
        if (pendingAssets.length === 0) return;

        setIsUploading(true);
        try {
            const files = pendingAssets.map((asset, index) => ({
                uri: asset.uri,
                name: asset.fileName ?? `gallery_${Date.now()}_${index}.jpg`,
                type: asset.mimeType ?? 'image/jpeg',
            }));

            await trainerService.uploadGalleryImages(files, captionInput.trim());
            await loadGallery();
            showSuccessToast('Images uploaded', 'Success');
            closeUploadPreview();
        } catch {
            showErrorToast('Failed to upload images', 'Error');
        } finally {
            setIsUploading(false);
        }
    }, [captionInput, closeUploadPreview, loadGallery, pendingAssets]);

    const closeImageModal = useCallback(() => {
        if (isDeleting) return;
        setIsImageModalVisible(false);
        setSelectedImage(null);
    }, [isDeleting]);

    const cancelSelect = useCallback(() => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
    }, []);

    const toggleSelect = useCallback((id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            return next;
        });
    }, []);

    const handleLongPress = useCallback((id: number) => {
        setIsSelectMode(true);
        setSelectedIds(new Set([id]));
    }, []);

    const handleTap = useCallback((item: GalleryItem) => {
        if (isSelectMode) {
            toggleSelect(item.id);
        } else {
            setSelectedImage(item);
            setIsImageModalVisible(true);
        }
    }, [isSelectMode, toggleSelect]);

    const handleDeleteSelected = useCallback(async () => {
        if (selectedIds.size === 0) return;
        const shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
                'Delete Images',
                `Delete ${selectedIds.size} selected image${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
                ],
                { cancelable: true, onDismiss: () => resolve(false) },
            );
        });
        if (!shouldContinue) return;
        setIsDeleting(true);
        try {
            await Promise.allSettled([...selectedIds].map((id) => trainerService.deleteGalleryImage(id)));
            await loadGallery();
            showSuccessToast('Images deleted', 'Success');
            cancelSelect();
        } catch {
            showErrorToast('Failed to delete images', 'Error');
        } finally {
            setIsDeleting(false);
        }
    }, [selectedIds, loadGallery, cancelSelect]);

    const handleDelete = useCallback((item: GalleryItem, onDeleted?: () => void) => {
        Alert.alert('Delete image', 'Are you sure you want to remove this image?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setIsDeleting(true);
                    try {
                        await trainerService.deleteGalleryImage(item.id);
                        await loadGallery();
                        showSuccessToast('Image deleted', 'Success');
                        onDeleted?.();
                    } catch {
                        showErrorToast('Failed to delete image', 'Error');
                    } finally {
                        setIsDeleting(false);
                    }
                },
            },
        ]);
    }, [loadGallery]);



    const selectedImageUri = useMemo(() => {
        if (!selectedImage) return undefined;
        return withVersion(resolveImageUrl(selectedImage.image_url), version);
    }, [selectedImage, version]);

    const pendingPreviewUri = useMemo(() => {
        const firstAsset = pendingAssets[0];
        if (!firstAsset?.uri) return undefined;
        return firstAsset.uri;
    }, [pendingAssets]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
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
                            onPress={handleDeleteSelected}
                            disabled={selectedIds.size === 0 || isDeleting}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: selectedIds.size > 0 ? colors.error : colors.surfaceSubtle,
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
                                <Ionicons name="trash-outline" size={16} color={selectedIds.size > 0 ? colors.white : colors.textDisabled} />
                            )}
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: selectedIds.size > 0 ? colors.white : colors.textDisabled }}>
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
                                Gallery
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="hand-left-outline" size={12} color={colors.textMuted} />
                                <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                    Long press to select
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={handlePickImages}
                            disabled={isLoading || isDeleting || isUploading}
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
                            <Ionicons name="add" size={14} color={colors.trainerPrimary} />
                            <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.trainerPrimary }}>
                                Add
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
                    {gallery.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
                            {gallery.map((item) => {
                                const imageUri = withVersion(resolveImageUrl(item.image_url), version);
                                if (!imageUri) return null;

                                const isSelected = selectedIds.has(item.id);
                                return (
                                    <TouchableOpacity
                                        key={`${item.id}-${version}`}
                                        activeOpacity={0.82}
                                        onPress={() => handleTap(item)}
                                        onLongPress={() => handleLongPress(item.id)}
                                        style={{ width: tileSize }}
                                    >
                                        <ExpoImage
                                            source={{
                                                uri: imageUri,
                                                headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                            }}
                                            style={{
                                                width: tileSize,
                                                height: tileSize,
                                                borderRadius: radius.sm,
                                                backgroundColor: colors.surface,
                                                borderWidth: isSelected ? 2 : 0,
                                                borderColor: isSelected ? colors.trainerPrimary : 'transparent',
                                            }}
                                            contentFit="cover"
                                            cachePolicy="none"
                                        />
                                        {isSelected && (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 11,
                                                    backgroundColor: colors.trainerPrimary,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Ionicons name="checkmark" size={13} color={colors.white} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View
                            style={{
                                borderRadius: radius.card,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                borderStyle: 'dashed',
                                backgroundColor: colors.surfaceSubtle,
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 40,
                                gap: 8,
                            }}
                        >
                            <Ionicons name="images-outline" size={30} color={colors.textDisabled} />
                            <Text style={{ fontSize: fontSize.caption, color: colors.textDisabled }}>
                                No gallery images yet
                            </Text>
                            <TouchableOpacity
                                onPress={handlePickImages}
                                activeOpacity={0.75}
                                style={{
                                    marginTop: 6,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: radius.full,
                                    backgroundColor: colors.trainerMuted,
                                    borderWidth: 1,
                                    borderColor: colors.trainerBorder,
                                }}
                            >
                                <Ionicons name="add" size={14} color={colors.trainerPrimary} />
                                <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.trainerPrimary }}>
                                    Add Images
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}

            <Modal
                transparent
                animationType="fade"
                visible={isUploadPreviewVisible}
                onRequestClose={closeUploadPreview}
                statusBarTranslucent
                navigationBarTranslucent
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}
                >
                    <View
                        style={[
                            {
                                borderRadius: radius.card,
                                backgroundColor: colors.white,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                overflow: 'hidden',
                            },
                            shadow.cardStrong,
                        ]}
                    >
                        <ScrollView
                            contentContainerStyle={{ padding: 16, gap: 14 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <Text style={{ flex: 1, fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                                    Preview Upload
                                </Text>
                                <TouchableOpacity
                                    onPress={closeUploadPreview}
                                    disabled={isUploading}
                                    activeOpacity={0.75}
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: radius.full,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: colors.surfaceBorder,
                                        backgroundColor: colors.surface,
                                    }}
                                >
                                    <Ionicons name="close" size={18} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            {pendingAssets.length > 1 && (
                                <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                    {`${pendingAssets.length} images selected. Previewing the first image.`}
                                </Text>
                            )}

                            <View
                                style={{
                                    borderRadius: radius.sm,
                                    overflow: 'hidden',
                                    backgroundColor: colors.surface,
                                    minHeight: 320,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                {pendingPreviewUri ? (
                                    <ExpoImage
                                        source={{ uri: pendingPreviewUri }}
                                        style={{ width: '100%', height: Math.min(width * 1.05, 460) }}
                                        contentFit="contain"
                                        cachePolicy="none"
                                    />
                                ) : (
                                    <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>Preview unavailable</Text>
                                )}
                            </View>

                            <TextInput
                                value={captionInput}
                                onChangeText={setCaptionInput}
                                placeholder="Write a caption"
                                placeholderTextColor={colors.textDisabled}
                                multiline
                                style={{
                                    minHeight: 108,
                                    borderWidth: 1,
                                    borderColor: colors.surfaceBorder,
                                    borderRadius: radius.sm,
                                    paddingHorizontal: 12,
                                    paddingVertical: 12,
                                    color: colors.textPrimary,
                                    fontSize: fontSize.body,
                                    backgroundColor: colors.background,
                                    textAlignVertical: 'top',
                                }}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={closeUploadPreview}
                                    disabled={isUploading}
                                    activeOpacity={0.75}
                                    style={{
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                        borderRadius: radius.sm,
                                        borderWidth: 1,
                                        borderColor: colors.surfaceBorder,
                                        backgroundColor: colors.surface,
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={submitCreate}
                                    disabled={isUploading || pendingAssets.length === 0}
                                    activeOpacity={0.75}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                        borderRadius: radius.sm,
                                        backgroundColor: colors.trainerPrimary,
                                    }}
                                >
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                    ) : (
                                        <Ionicons name="cloud-upload-outline" size={14} color={colors.white} />
                                    )}
                                    <Text style={{ fontSize: fontSize.caption, color: colors.white, fontWeight: '700' }}>
                                        Upload
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                transparent
                animationType="fade"
                visible={isImageModalVisible}
                onRequestClose={closeImageModal}
                statusBarTranslucent
                navigationBarTranslucent
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
                    <View
                        style={[
                            {
                                borderRadius: radius.card,
                                backgroundColor: colors.white,
                                padding: 14,
                                gap: 12,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                            },
                            shadow.cardStrong,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => selectedImage && handleDelete(selectedImage, closeImageModal)}
                                disabled={!selectedImage || isDeleting}
                                activeOpacity={0.75}
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: radius.full,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: colors.surfaceBorder,
                                    backgroundColor: colors.surface,
                                }}
                            >
                                <Ionicons name="trash-outline" size={18} color={colors.error} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={closeImageModal}
                                disabled={isDeleting}
                                activeOpacity={0.75}
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: radius.full,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: colors.surfaceBorder,
                                    backgroundColor: colors.surface,
                                }}
                            >
                                <Ionicons name="close" size={18} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View
                            style={{
                                borderRadius: radius.sm,
                                overflow: 'hidden',
                                backgroundColor: colors.surface,
                                minHeight: 220,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {selectedImage && selectedImageUri && (
                                <ExpoImage
                                    source={{
                                        uri: selectedImageUri,
                                        headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                                    }}
                                    style={{ width: '100%', height: Math.min(containerWidth, 360) }}
                                    contentFit="contain"
                                    cachePolicy="none"
                                />
                            )}

                            {(!selectedImage || !selectedImageUri) && (
                                <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>Image unavailable</Text>
                            )}
                        </View>

                        {!!selectedImage?.caption?.trim() && (
                            <Text style={{ fontSize: fontSize.body, color: colors.textPrimary, lineHeight: 22 }}>
                                {selectedImage.caption}
                            </Text>
                        )}
                    </View>
                </View>
            </Modal>

            {isDeleting && (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <View
                        style={{
                            paddingHorizontal: 18,
                            paddingVertical: 12,
                            borderRadius: radius.card,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <ActivityIndicator size="small" color={colors.white} />
                        <Text style={{ color: colors.white, fontSize: fontSize.caption }}>Deleting...</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
