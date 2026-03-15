import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
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

type GalleryGroup = {
    key: string;
    items: GalleryItem[];
    isCollection: boolean;
};

export default function GalleryScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { authState } = useAuth();
    const { width, height: screenHeight } = useWindowDimensions();

    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [version, setVersion] = useState(Date.now());
    const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [captionInput, setCaptionInput] = useState('');

    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const [innerIndex, setInnerIndex] = useState(0);
    // Measured height of the full-screen viewer — may differ from screenHeight
    // due to translucent status/nav bars. Used for pagingEnabled snap accuracy.
    const [viewerHeight, setViewerHeight] = useState(screenHeight);

    const [isUploadPreviewVisible, setIsUploadPreviewVisible] = useState(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);

    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const outerListRef = useRef<FlatList<GalleryGroup>>(null);
    const previewListRef = useRef<FlatList<ImagePicker.ImagePickerAsset>>(null);
    const [previewIndex, setPreviewIndex] = useState(0);

    const GRID_GAP = 8;
    const GRID_COLUMNS = 3;
    const containerWidth = Math.max(width - 40, 120);
    const tileSize = Math.floor((containerWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

    // ── Group flat gallery array by collection_id ──────────────────────────
    const galleryGroups = useMemo<GalleryGroup[]>(() => {
        const collectionMap = new Map<string, GalleryGroup>();

        const ordered = gallery.reduce<GalleryGroup[]>((acc, item) => {
            if (item.collection_id) {
                const existing = collectionMap.get(item.collection_id);
                if (existing) {
                    existing.items.push(item);
                } else {
                    const group: GalleryGroup = {
                        key: item.collection_id,
                        items: [item],
                        isCollection: false,
                    };
                    collectionMap.set(item.collection_id, group);
                    acc.push(group);
                }
            } else {
                acc.push({ key: `solo-${item.id}`, items: [item], isCollection: false });
            }
            return acc;
        }, []);

        // Mark groups that actually have > 1 image
        return ordered.map((g) => ({ ...g, isCollection: g.items.length > 1 }));
    }, [gallery]);

    // ── Data loading ───────────────────────────────────────────────────────
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

    // ── Upload flow ────────────────────────────────────────────────────────
    const closeUploadPreview = useCallback(() => {
        if (isUploading) return;
        setIsUploadPreviewVisible(false);
        setPendingAssets([]);
        setCaptionInput('');
        setPreviewIndex(0);
    }, [isUploading]);

    const handlePreviewScroll = useCallback(
        (event: { nativeEvent: { contentOffset: { x: number } } }) => {
            const previewCarouselWidth = containerWidth - 32;
            const index = Math.round(event.nativeEvent.contentOffset.x / previewCarouselWidth);
            setPreviewIndex(index);
        },
        [containerWidth],
    );

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

    // ── Image / carousel modal ─────────────────────────────────────────────
    const closeImageModal = useCallback(() => {
        if (isDeleting) return;
        setIsImageModalVisible(false);
        setInnerIndex(0);
    }, [isDeleting]);

    // Reset status bar style when the full-screen viewer closes
    useEffect(() => {
        StatusBar.setBarStyle(isImageModalVisible ? 'light-content' : 'dark-content', true);
    }, [isImageModalVisible]);

    // Vertical scroll → move between gallery groups
    const handleOuterScroll = useCallback(
        (event: { nativeEvent: { contentOffset: { y: number } } }) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / viewerHeight);
            setSelectedGroupIndex(index);
            setInnerIndex(0);
        },
        [viewerHeight],
    );

    // Horizontal scroll → move between images inside a collection
    const handleInnerScroll = useCallback(
        (event: { nativeEvent: { contentOffset: { x: number } } }) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setInnerIndex(index);
        },
        [width],
    );

    const handleDeleteCarouselItem = useCallback(() => {
        const group = galleryGroups[selectedGroupIndex];
        if (!group) return;
        const item = group.items[innerIndex];
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
                        closeImageModal();
                    } catch {
                        showErrorToast('Failed to delete image', 'Error');
                    } finally {
                        setIsDeleting(false);
                    }
                },
            },
        ]);
    }, [galleryGroups, selectedGroupIndex, innerIndex, loadGallery, closeImageModal]);

    // ── Select / bulk-delete ───────────────────────────────────────────────
    const cancelSelect = useCallback(() => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
    }, []);

    const handleTap = useCallback((group: GalleryGroup) => {
        if (isSelectMode) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                const allSelected = group.items.every((item) => next.has(item.id));
                if (allSelected) {
                    group.items.forEach((item) => next.delete(item.id));
                } else {
                    group.items.forEach((item) => next.add(item.id));
                }
                return next;
            });
        } else {
            const idx = galleryGroups.findIndex((g) => g.key === group.key);
            setSelectedGroupIndex(idx >= 0 ? idx : 0);
            setInnerIndex(0);
            setIsImageModalVisible(true);
        }
    }, [isSelectMode, galleryGroups]);

    const handleLongPress = useCallback((group: GalleryGroup) => {
        setIsSelectMode(true);
        setSelectedIds(new Set(group.items.map((item) => item.id)));
    }, []);

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

    // ── Memos ──────────────────────────────────────────────────────────────
    const previewCarouselWidth = containerWidth - 32; // card width minus scroll-view padding (16×2)

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>

            {/* ── Header ── */}
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

            {/* ── Grid ── */}
            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
                    {galleryGroups.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
                            {galleryGroups.map((group) => {
                                const coverItem = group.items[0];
                                const imageUri = withVersion(resolveImageUrl(coverItem.image_url), version);
                                if (!imageUri) return null;

                                const allSelected = group.items.every((item) => selectedIds.has(item.id));
                                const anySelected = group.items.some((item) => selectedIds.has(item.id));
                                const isSelected = isSelectMode && allSelected;
                                const isPartial = isSelectMode && anySelected && !allSelected;

                                let tileBorderColor = 'transparent';
                                if (isSelected) tileBorderColor = colors.trainerPrimary;
                                else if (isPartial) tileBorderColor = colors.trainerBorder;

                                return (
                                    <TouchableOpacity
                                        key={group.key}
                                        activeOpacity={0.82}
                                        onPress={() => handleTap(group)}
                                        onLongPress={() => handleLongPress(group)}
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
                                                borderWidth: isSelected || isPartial ? 2 : 0,
                                                borderColor: tileBorderColor,
                                            }}
                                            contentFit="cover"
                                            cachePolicy="none"
                                        />

                                        {/* Collection badge – top-left */}
                                        {group.isCollection && (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    top: 5,
                                                    left: 5,
                                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                                    borderRadius: 4,
                                                    paddingHorizontal: 5,
                                                    paddingVertical: 2,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 3,
                                                }}
                                            >
                                                <Ionicons name="copy-outline" size={10} color="#fff" />
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                                    {group.items.length}
                                                </Text>
                                            </View>
                                        )}

                                        {/* All-selected checkmark */}
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

                                        {/* Partial-selection ring */}
                                        {isPartial && (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 11,
                                                    borderWidth: 2,
                                                    borderColor: colors.trainerPrimary,
                                                    backgroundColor: 'rgba(255,255,255,0.6)',
                                                }}
                                            />
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

            {/* ── Upload preview modal ── */}
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
                            {/* Header: title + counter + close */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <Text style={{ flex: 1, fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                                    Preview Upload
                                </Text>
                                {pendingAssets.length > 1 && (
                                    <Text style={{ fontSize: fontSize.caption, color: colors.textMuted, fontWeight: '600' }}>
                                        {previewIndex + 1}
                                        {' / '}
                                        {pendingAssets.length}
                                    </Text>
                                )}
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

                            {/* Image carousel — swipe left/right to preview each selected image */}
                            <View style={{ borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surface }}>
                                <FlatList
                                    ref={previewListRef}
                                    data={pendingAssets}
                                    keyExtractor={(asset) => asset.uri}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onMomentumScrollEnd={handlePreviewScroll}
                                    getItemLayout={(_, index) => ({
                                        length: previewCarouselWidth,
                                        offset: previewCarouselWidth * index,
                                        index,
                                    })}
                                    style={{ width: previewCarouselWidth }}
                                    renderItem={({ item: asset }) => (
                                        <View style={{ width: previewCarouselWidth, height: Math.min(width * 0.9, 380) }}>
                                            <ExpoImage
                                                source={{ uri: asset.uri }}
                                                style={{ flex: 1 }}
                                                contentFit="contain"
                                                cachePolicy="none"
                                            />
                                        </View>
                                    )}
                                />
                            </View>

                            {/* Dot indicators */}
                            {pendingAssets.length > 1 && (
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                                    {pendingAssets.map((asset, i) => (
                                        <View
                                            key={asset.uri}
                                            style={{
                                                width: i === previewIndex ? 16 : 5,
                                                height: 5,
                                                borderRadius: 3,
                                                backgroundColor: i === previewIndex ? colors.trainerPrimary : colors.surfaceBorder,
                                            }}
                                        />
                                    ))}
                                </View>
                            )}

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

            {/* ── Full-screen image viewer modal ── */}
            <Modal
                transparent={false}
                animationType="fade"
                visible={isImageModalVisible}
                onRequestClose={closeImageModal}
                statusBarTranslucent
                navigationBarTranslucent
            >
                <View
                    style={{ flex: 1, backgroundColor: '#000' }}
                    onLayout={(e) => {
                        const h = e.nativeEvent.layout.height;
                        if (h > 0) setViewerHeight(h);
                    }}
                >
                    {/*
                      Outer FlatList — vertical paging, one page per gallery group.
                      Uses viewerHeight (measured) so snap points are always pixel-perfect.
                    */}
                    <FlatList
                        ref={outerListRef}
                        data={galleryGroups}
                        keyExtractor={(group) => group.key}
                        pagingEnabled
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={handleOuterScroll}
                        initialScrollIndex={selectedGroupIndex}
                        style={{ flex: 1 }}
                        getItemLayout={(_, index) => ({
                            length: viewerHeight,
                            offset: viewerHeight * index,
                            index,
                        })}
                        onScrollToIndexFailed={(info) => {
                            outerListRef.current?.scrollToOffset({
                                offset: info.index * viewerHeight,
                                animated: false,
                            });
                        }}
                        renderItem={({ item: group }) => {
                            if (group.isCollection) {
                                return (
                                    <View style={{ width, height: viewerHeight }}>
                                        <FlatList
                                            data={group.items}
                                            keyExtractor={(img) => String(img.id)}
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            onMomentumScrollEnd={handleInnerScroll}
                                            style={{ flex: 1 }}
                                            getItemLayout={(_, idx) => ({
                                                length: width,
                                                offset: width * idx,
                                                index: idx,
                                            })}
                                            renderItem={({ item }) => {
                                                const uri = withVersion(resolveImageUrl(item.image_url), version);
                                                return (
                                                    <View style={{ width, height: viewerHeight }}>
                                                        {uri ? (
                                                            <ExpoImage
                                                                source={{ uri, headers: { Authorization: `Bearer ${authState.token ?? ''}` } }}
                                                                style={{ flex: 1 }}
                                                                contentFit="contain"
                                                                cachePolicy="none"
                                                            />
                                                        ) : (
                                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: fontSize.caption }}>
                                                                    Image unavailable
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {!!item.caption?.trim() && (
                                                            <View style={{ position: 'absolute', bottom: 80, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8 }}>
                                                                <Text style={{ color: '#fff', fontSize: fontSize.body, lineHeight: 20 }}>{item.caption}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            }}
                                        />
                                    </View>
                                );
                            }

                            // Single image — fill the full page
                            const singleItem = group.items[0];
                            const uri = withVersion(resolveImageUrl(singleItem.image_url), version);
                            return (
                                <View style={{ width, height: viewerHeight }}>
                                    {uri ? (
                                        <ExpoImage
                                            source={{ uri, headers: { Authorization: `Bearer ${authState.token ?? ''}` } }}
                                            style={{ flex: 1 }}
                                            contentFit="contain"
                                            cachePolicy="none"
                                        />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: fontSize.caption }}>
                                                Image unavailable
                                            </Text>
                                        </View>
                                    )}
                                    {!!singleItem.caption?.trim() && (
                                        <View style={{ position: 'absolute', bottom: 80, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8 }}>
                                            <Text style={{ color: '#fff', fontSize: fontSize.body, lineHeight: 20 }}>{singleItem.caption}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        }}
                    />

                    {/* Top overlay: close + collection counter + delete */}
                    <SafeAreaView
                        edges={['top']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
                            <TouchableOpacity
                                onPress={closeImageModal}
                                disabled={isDeleting}
                                activeOpacity={0.75}
                                style={{ width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}
                            >
                                <Ionicons name="close" size={22} color="#fff" />
                            </TouchableOpacity>

                            <View style={{ flex: 1, alignItems: 'center' }}>
                                {(galleryGroups[selectedGroupIndex]?.items.length ?? 0) > 1 && (
                                    <Text style={{ color: '#fff', fontSize: fontSize.caption, fontWeight: '600' }}>
                                        {innerIndex + 1}
                                        {' / '}
                                        {galleryGroups[selectedGroupIndex]!.items.length}
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleDeleteCarouselItem}
                                disabled={isDeleting}
                                activeOpacity={0.75}
                                style={{ width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}
                            >
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    {/* Bottom-center dots — only shown for the currently visible collection */}
                    {(galleryGroups[selectedGroupIndex]?.items.length ?? 0) > 1 && (
                        <View style={{ position: 'absolute', bottom: 28, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                            {galleryGroups[selectedGroupIndex]!.items.map((item, i) => (
                                <View
                                    key={item.id}
                                    style={{
                                        width: i === innerIndex ? 18 : 5,
                                        height: 5,
                                        borderRadius: 3,
                                        backgroundColor: i === innerIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                                    }}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </Modal>

            {/* ── Full-screen deleting overlay ── */}
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
