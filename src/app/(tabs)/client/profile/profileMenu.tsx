import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';
import { getClientMenuItems } from '@/types/profile/clientMenuItems';

const PANEL_WIDTH = Dimensions.get('window').width * 0.78;

export default function ClientProfileMenu() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const menuItems = getClientMenuItems(router);

    const handleMenuPress = useCallback((onPress: () => void) => {
        router.back();
        setTimeout(onPress, 150);
    }, [router]);

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

    return (
        <View style={{ flex: 1, flexDirection: 'row' }}>

            {/* ── Backdrop ─────────────────────────────────────── */}
            <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => router.back()}
            />

            {/* ── Panel ────────────────────────────────────────── */}
            <View
                style={[
                    {
                        width: PANEL_WIDTH,
                        backgroundColor: colors.background,
                        paddingTop: insets.top + 16,
                        paddingBottom: insets.bottom + 28,
                        paddingHorizontal: 16,
                        borderTopLeftRadius: radius.hero,
                        borderBottomLeftRadius: radius.hero,
                    },
                    shadow.cardStrong,
                ]}
            >
                {/* Panel header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Ionicons name="close" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                        Menu
                    </Text>
                </View>

                {/* ── Menu Items ───────────────────────────────── */}
                <View
                    style={[
                        {
                            backgroundColor: colors.white,
                            borderRadius: radius.card,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: colors.surfaceBorder,
                        },
                        shadow.cardSubtle,
                    ]}
                >
                    {menuItems.map(({ id, icon, label, onPress }, index) => (
                        <View key={id}>
                            <TouchableOpacity
                                onPress={() => handleMenuPress(onPress)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
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
                        </View>
                    ))}
                </View>

                {/* ── Sign Out ─────────────────────────────────── */}
                <TouchableOpacity
                    onPress={handleLogout}
                    disabled={isLoggingOut}
                    style={{
                        marginTop: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 14,
                        borderRadius: radius.card,
                        borderWidth: 1,
                        borderColor: colors.error,
                        gap: 8,
                    }}
                    activeOpacity={0.7}
                >
                    {isLoggingOut ? (
                        <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                        <Ionicons name="log-out-outline" size={16} color={colors.error} />
                    )}
                    <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.error }}>
                        Sign Out
                    </Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}
