import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clientService } from '@/api/services/client.service';
import { InputField } from '@/components/ui/formComponent';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';
import type { ClientProfileEditForm } from '@/types/authTypes';

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
            <View style={{
                width: 32,
                height: 32,
                borderRadius: radius.sm,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
            }}
            >
                <Ionicons name={icon} size={16} color={colors.primary} />
            </View>
            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                {title}
            </Text>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientEditProfile() {
    const router = useRouter();
    const navigation = useNavigation();
    const { authState, getProfile } = useAuth();
    const { user } = authState;

    const { control, handleSubmit, formState: { errors } } = useForm<ClientProfileEditForm>({
        defaultValues: {
            first_name: user?.first_name ?? '',
            last_name: user?.last_name ?? '',
            dob: user?.dob ?? '',
            contact_no: user?.contact_no ?? '',
            is_receiving_promotional_email: user?.is_receiving_promotional_email ?? false,
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    // Local URI for immediate optimistic preview after picking
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);

    // Derived: whether the user currently has a server-side profile image
    const serverImageUrl = clientService.getClientProfileImageUrl();
    const hasServerImage = !!(user?.profile_image_url ?? user?.profile_image);

    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            parent?.setOptions({ tabBarStyle: { display: 'none' } });
            return () => parent?.setOptions({ tabBarStyle: undefined });
        }, [navigation]),
    );

    // ── Profile image actions ──────────────────────────────────────────────────

    const handlePickImage = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showErrorToast('Camera roll permission is required to change your photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop() ?? 'jpg';
        const file = {
            uri: asset.uri,
            name: `profile.${ext}`,
            type: asset.mimeType ?? `image/${ext}`,
        };

        setLocalImageUri(asset.uri);
        setIsUploadingImage(true);
        try {
            await clientService.uploadClientProfileImage(file);
            await getProfile();
            showSuccessToast('Profile photo updated');
        } catch {
            setLocalImageUri(null);
            showErrorToast('Failed to upload photo. Please try again.');
        } finally {
            setIsUploadingImage(false);
        }
    }, [getProfile]);

    const handleRemoveImage = useCallback(() => {
        Alert.alert(
            'Remove Profile Photo',
            'Are you sure you want to remove your profile photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setIsUploadingImage(true);
                        try {
                            await clientService.deleteClientProfileImage();
                            setLocalImageUri(null);
                            await getProfile();
                            showSuccessToast('Profile photo removed');
                        } catch {
                            showErrorToast('Failed to remove photo. Please try again.');
                        } finally {
                            setIsUploadingImage(false);
                        }
                    },
                },
            ],
        );
    }, [getProfile]);

    // ── Form submit ────────────────────────────────────────────────────────────

    const onSubmit = async (data: ClientProfileEditForm) => {
        setIsSubmitting(true);
        try {
            await clientService.patchClientProfile({
                first_name: data.first_name.trim() || undefined,
                last_name: data.last_name.trim() || undefined,
                dob: data.dob.trim() || undefined,
                contact_no: data.contact_no.trim() || undefined,
                is_receiving_promotional_email: data.is_receiving_promotional_email,
            });
            await getProfile();
            showSuccessToast('Profile updated successfully');
            router.back();
        } catch {
            showErrorToast('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Avatar display helpers ─────────────────────────────────────────────────

    const initials = [user?.first_name, user?.last_name]
        .filter(Boolean)
        .map((n) => n![0].toUpperCase())
        .join('') || (user?.username?.[0]?.toUpperCase() ?? 'U');

    const displayImageUri = localImageUri ?? (hasServerImage ? serverImageUrl : null);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>

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
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>
                    Edit Profile
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* ── Profile Photo ─────────────────────────────── */}
                    <View style={{ alignItems: 'center', marginBottom: 28 }}>
                        <View style={{ position: 'relative' }}>
                            {/* Avatar */}
                            <View
                                style={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: radius.card,
                                    backgroundColor: colors.primaryMuted,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    borderWidth: 2,
                                    borderColor: colors.primaryBorder,
                                }}
                            >
                                {displayImageUri ? (
                                    <ExpoImage
                                        source={{
                                            uri: displayImageUri,
                                            headers: !localImageUri
                                                ? { Authorization: `Bearer ${authState.token ?? ''}` }
                                                : undefined,
                                        }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        cachePolicy="none"
                                    />
                                ) : (
                                    <Text style={{ fontSize: 32, fontWeight: '700', color: colors.primary }}>
                                        {initials}
                                    </Text>
                                )}
                                {isUploadingImage && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.45)',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <ActivityIndicator color={colors.white} />
                                    </View>
                                )}
                            </View>

                            {/* Camera badge */}
                            <TouchableOpacity
                                onPress={handlePickImage}
                                disabled={isUploadingImage}
                                activeOpacity={0.8}
                                style={{
                                    position: 'absolute',
                                    bottom: -6,
                                    right: -6,
                                    width: 30,
                                    height: 30,
                                    borderRadius: radius.full,
                                    backgroundColor: colors.primary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ...shadow.primary,
                                }}
                            >
                                <Ionicons name="camera" size={15} color={colors.white} />
                            </TouchableOpacity>
                        </View>

                        {/* Remove photo link */}
                        {(hasServerImage || localImageUri) && !isUploadingImage && (
                            <TouchableOpacity
                                onPress={handleRemoveImage}
                                activeOpacity={0.7}
                                style={{ marginTop: 14 }}
                            >
                                <Text style={{ fontSize: fontSize.badge, color: colors.error, fontWeight: '600' }}>
                                    Remove photo
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── Personal Information ─────────────────────── */}
                    <SectionLabel icon="person-outline" title="Personal Information" />

                    <InputField
                        control={control}
                        name="first_name"
                        label="First Name"
                        leftIcon="person-outline"
                        placeholder="First Name"
                        error={errors.first_name?.message}
                        autoCapitalize="words"
                    />

                    <InputField
                        control={control}
                        name="last_name"
                        label="Last Name"
                        leftIcon="person-outline"
                        placeholder="Last Name"
                        error={errors.last_name?.message}
                        autoCapitalize="words"
                    />

                    <InputField
                        control={control}
                        name="dob"
                        label="Date of Birth"
                        leftIcon="calendar-outline"
                        placeholder="YYYY-MM-DD"
                        error={errors.dob?.message}
                    />

                    <InputField
                        control={control}
                        name="contact_no"
                        label="Contact Number"
                        leftIcon="call-outline"
                        placeholder="e.g. 9800000001"
                        keyboardType="phone-pad"
                        error={errors.contact_no?.message}
                    />

                    {/* ── Preferences ──────────────────────────────── */}
                    <SectionLabel icon="settings-outline" title="Preferences" />

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: colors.white,
                            borderRadius: radius.card,
                            borderWidth: 1,
                            borderColor: colors.surfaceBorder,
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                            marginBottom: 24,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
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
                                <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary }}>
                                    Promotional Emails
                                </Text>
                                <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, marginTop: 1 }}>
                                    Receive offers, tips, and updates
                                </Text>
                            </View>
                        </View>
                        <Controller
                            control={control}
                            name="is_receiving_promotional_email"
                            render={({ field: { value, onChange } }) => (
                                <Switch
                                    value={value}
                                    onValueChange={onChange}
                                    trackColor={{ false: colors.surfaceBorder, true: colors.primaryMuted }}
                                    thumbColor={value ? colors.primary : colors.textDisabled}
                                />
                            )}
                        />
                    </View>

                    {/* ── Save Button ──────────────────────────────── */}
                    <TouchableOpacity
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        activeOpacity={0.8}
                        style={[
                            {
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                paddingVertical: 15,
                                borderRadius: radius.card,
                                backgroundColor: isSubmitting ? colors.textDisabled : colors.primary,
                            },
                            shadow.primary,
                        ]}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                        )}
                        <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.white }}>
                            {isSubmitting ? 'Saving…' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
