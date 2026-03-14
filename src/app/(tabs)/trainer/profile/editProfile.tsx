import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trainerService } from '@/api/services/trainer.service';
import { InputField } from '@/components/ui/formComponent';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';
import { EXPERTISE_CATEGORIES, type EditProfileForm } from '@/types/trainerTypes';

function SectionLabel({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
            <View style={{
                width: 32,
                height: 32,
                borderRadius: radius.sm,
                backgroundColor: colors.trainerMuted,
                alignItems: 'center',
                justifyContent: 'center',
            }}
            >
                <Ionicons name={icon} size={16} color={colors.trainerPrimary} />
            </View>
            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                {title}
            </Text>
        </View>
    );
}

function parseExpertiseCategories(raw: string | string[] | undefined): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
}

export default function EditProfile() {
    const router = useRouter();
    const navigation = useNavigation();
    const { authState, getProfile } = useAuth();
    const { user } = authState;

    const { control, handleSubmit, formState: { errors } } = useForm<EditProfileForm>({
        defaultValues: {
            first_name: user?.first_name ?? '',
            last_name: user?.last_name ?? '',
            dob: user?.dob ?? '',
            contact_no: user?.contact_no ?? '',
            bio: user?.bio ?? '',
            years_of_experience: user?.years_of_experience?.toString() ?? '',
            pricing_per_session: user?.pricing_per_session ?? '',
        },
    });

    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        parseExpertiseCategories(user?.expertise_categories),
    );
    const [sessionType, setSessionType] = useState<'online' | 'offline' | 'both'>(
        user?.session_type ?? 'online',
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            parent?.setOptions({ tabBarStyle: { display: 'none' } });
            return () => parent?.setOptions({ tabBarStyle: undefined });
        }, [navigation]),
    );

    const toggleCategory = useCallback((cat: string) => {
        setSelectedCategories((prev) =>
            (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]),
        );
    }, []);

    const onSubmit = async (data: EditProfileForm) => {
        const originalCategories = parseExpertiseCategories(user?.expertise_categories);
        const sensitiveFieldChanged =
            data.years_of_experience !== (user?.years_of_experience?.toString() ?? '') ||
            data.pricing_per_session !== (user?.pricing_per_session ?? '') ||
            sessionType !== (user?.session_type ?? 'online') ||
            JSON.stringify([...selectedCategories].sort()) !== JSON.stringify([...originalCategories].sort());

        const confirmMessage = sensitiveFieldChanged
            ? 'You have changed one or more fields (Years of Experience, Pricing per Session, Session Type, or Expertise Areas) that require admin confirmation before taking effect.'
            : 'Are you sure you want to update your profile details?';

        const shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
                'Save Profile Changes',
                confirmMessage,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Confirm', onPress: () => resolve(true) },
                ],
                { cancelable: true, onDismiss: () => resolve(false) },
            );
        });

        if (!shouldContinue) return;

        setIsSubmitting(true);
        try {
            const firstName = data.first_name.trim();
            const lastName = data.last_name.trim();
            await trainerService.patchProfileDetails({
                first_name: firstName,
                last_name: lastName,
                dob: data.dob.trim() || undefined,
                full_name: [firstName, lastName].filter(Boolean).join(' '),
                contact_no: data.contact_no.trim(),
                bio: data.bio.trim(),
                expertise_categories: selectedCategories,
                years_of_experience: Number(data.years_of_experience) || 0,
                pricing_per_session: data.pricing_per_session.trim(),
                session_type: sessionType,
                is_receiving_promotional_email: user?.is_receiving_promotional_email ?? false,
            });
            await getProfile();
            showSuccessToast('Profile updated successfully', 'Success');
            router.back();
        } catch {
            showErrorToast('Failed to update profile', 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

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

                    {/* ── Personal Information ─────────────────────────── */}
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
                        placeholder="e.g. +977-9800000000"
                        keyboardType="phone-pad"
                        error={errors.contact_no?.message}
                    />

                    <InputField
                        control={control}
                        name="bio"
                        label="Bio"
                        leftIcon="document-text-outline"
                        placeholder="Tell clients about yourself..."
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{ minHeight: 88, paddingTop: 8 }}
                        error={errors.bio?.message}
                    />

                    {/* ── Professional Details ─────────────────────────── */}
                    <SectionLabel icon="briefcase-outline" title="Professional Details" />

                    <InputField
                        control={control}
                        name="years_of_experience"
                        label="Years of Experience"
                        leftIcon="time-outline"
                        placeholder="e.g. 5"
                        keyboardType="numeric"
                        error={errors.years_of_experience?.message}
                    />

                    <InputField
                        control={control}
                        name="pricing_per_session"
                        label="Pricing per Session"
                        leftIcon="cash-outline"
                        placeholder="e.g. 1500"
                        keyboardType="numeric"
                        error={errors.pricing_per_session?.message}
                    />

                    {/* ── Session Type ─────────────────────────────────── */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: fontSize.body, color: colors.textMuted, marginBottom: 10 }}>
                            Session Type
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {(['online', 'offline', 'both'] as const).map((type) => {
                                const active = sessionType === type;
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setSessionType(type)}
                                        activeOpacity={0.75}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 10,
                                            borderRadius: radius.md,
                                            alignItems: 'center',
                                            backgroundColor: active ? colors.trainerMuted : colors.surface,
                                            borderWidth: 1,
                                            borderColor: active ? colors.trainerBorder : colors.surfaceBorder,
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: fontSize.tag,
                                            fontWeight: active ? '700' : '500',
                                            color: active ? colors.trainerPrimary : colors.textMuted,
                                            textTransform: 'capitalize',
                                        }}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Expertise Areas ──────────────────────────────── */}
                    <View style={{ marginBottom: 28 }}>
                        <SectionLabel icon="fitness-outline" title="Expertise Areas" />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {EXPERTISE_CATEGORIES.map((cat) => {
                                const selected = selectedCategories.includes(cat);
                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => toggleCategory(cat)}
                                        activeOpacity={0.75}
                                        style={{
                                            paddingHorizontal: 14,
                                            paddingVertical: 8,
                                            borderRadius: radius.full,
                                            backgroundColor: selected ? colors.trainerMuted : colors.surface,
                                            borderWidth: 1,
                                            borderColor: selected ? colors.trainerBorder : colors.surfaceBorder,
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: fontSize.tag,
                                            fontWeight: selected ? '700' : '500',
                                            color: selected ? colors.trainerPrimary : colors.textMuted,
                                        }}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {selectedCategories.length === 0 && (
                            <Text style={{ fontSize: fontSize.caption, color: colors.error, marginTop: 8 }}>
                                Select at least one expertise area
                            </Text>
                        )}
                    </View>

                    {/* ── Save Button ──────────────────────────────────── */}
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
                                backgroundColor: isSubmitting ? colors.textDisabled : colors.trainerPrimary,
                            },
                            shadow.trainer,
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
