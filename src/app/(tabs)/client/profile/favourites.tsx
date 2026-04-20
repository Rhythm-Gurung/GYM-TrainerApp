import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { clientService } from '@/api/services/client.service';
import TrainerCard from '@/components/client/TrainerCard';
import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { showErrorToast } from '@/lib';
import { mapApiTrainer, type ApiTrainer } from '@/types/clientTypes';

export default function Favourites() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();

    const [favourites, setFavourites] = useState<ApiTrainer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchFavourites = useCallback(async (opts?: { initial?: boolean }) => {
        if (opts?.initial) setIsLoading(true);
        try {
            const favs = await clientService.getFavourites();
            setFavourites(favs);
        } catch {
            showErrorToast('Failed to load favourites', 'Error');
        } finally {
            if (opts?.initial) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavourites({ initial: true });
    }, [fetchFavourites]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchFavourites({});
        setIsRefreshing(false);
    }, [fetchFavourites]);

    const trainers = favourites.map(mapApiTrainer);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <HeroGradient gradient={gradientColors.primary} fixed />

            {/* ── Header ───────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.75}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.28)',
                    }}
                >
                    <Ionicons name="arrow-back" size={18} color={colors.white} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white }}>
                        Favourites
                    </Text>
                    {!isLoading && (
                        <Text style={{ fontSize: fontSize.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                            {`${trainers.length} trainer${trainers.length !== 1 ? 's' : ''}`}
                        </Text>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 20,
                        paddingTop: 12,
                        paddingBottom: tabBarHeight + 16,
                        gap: 12,
                    }}
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
                    {trainers.length === 0 ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <View
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 32,
                                    backgroundColor: colors.primaryMuted,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ...shadow.cardSubtle,
                                }}
                            >
                                <Ionicons name="heart-outline" size={28} color={colors.primary} />
                            </View>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                                No favourites yet
                            </Text>
                            <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, textAlign: 'center' }}>
                                Heart a trainer from their profile to save them here.
                            </Text>
                        </View>
                    ) : (
                        trainers.map((t) => (
                            <TrainerCard
                                key={t.id}
                                trainer={t}
                                onPress={() => router.push({ pathname: '/(tabs)/client/trainerProfile', params: { id: t.id } } as never)}
                            />
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
