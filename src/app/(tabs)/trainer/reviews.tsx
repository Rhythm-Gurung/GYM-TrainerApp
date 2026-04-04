import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApiQuery } from '@/api/hooks/useApiQuery';
import { trainerService } from '@/api/services/trainer.service';
import ReviewCard from '@/components/client/ReviewCard';
import { colors, fontSize, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import type { ApiReviewsResponse } from '@/types/clientTypes';
import { mapApiReview } from '@/types/clientTypes';

export default function TrainerReviews() {
    const router = useRouter();
    const { authState } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const trainerId = authState.user?.id ? String(authState.user.id) : '';

    const { data: reviewsData, isLoading, refetch } = useApiQuery<ApiReviewsResponse>(
        `trainer-reviews-${trainerId}`,
        async () => {
            const data = await trainerService.getReviews();
            return data as ApiReviewsResponse;
        },
        { enabled: Boolean(trainerId) },
    );

    const reviews = (reviewsData?.data ?? []).map((r) => mapApiReview(r, trainerId));

    // Mark reviews as seen when page is focused
    useFocusEffect(
        useCallback(() => {
            const markAsSeen = async () => {
                const now = Date.now();
                await AsyncStorage.setItem('trainer_reviews_last_seen', String(now));
            };
            markAsSeen();
        }, []),
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    backgroundColor: colors.white,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.icon,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.header, fontWeight: '700', color: colors.textPrimary }}>
                        My Reviews
                    </Text>
                    {reviewsData && (
                        <Text style={{ fontSize: fontSize.caption, color: colors.textMuted, marginTop: 2 }}>
                            {reviewsData.count}
                            {' '}
                            review
                            {reviewsData.count !== 1 ? 's' : ''}
                            {reviewsData.average_rating > 0 && ` · ${reviewsData.average_rating.toFixed(1)} ★`}
                        </Text>
                    )}
                </View>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            ) : (
                <ScrollView
                    refreshControl={(
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.trainerPrimary]}
                            tintColor={colors.trainerPrimary}
                        />
                    )}
                    contentContainerStyle={
                        reviews.length === 0
                            ? { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }
                            : { padding: 20, paddingBottom: 40 }
                    }
                >
                    {reviews.length > 0 ? (
                        reviews.map((review) => <ReviewCard key={review.id} review={review} />)
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <View
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: colors.surface,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons name="star-outline" size={36} color={colors.textMuted} />
                            </View>
                            <Text
                                style={{
                                    fontSize: fontSize.hero,
                                    fontWeight: '700',
                                    color: colors.textPrimary,
                                    marginBottom: 8,
                                }}
                            >
                                No Reviews Yet
                            </Text>
                            <Text
                                style={{
                                    fontSize: fontSize.body,
                                    color: colors.textMuted,
                                    textAlign: 'center',
                                    maxWidth: 280,
                                }}
                            >
                                Complete sessions with clients to start receiving reviews!
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
