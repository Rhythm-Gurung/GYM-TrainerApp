import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
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

import StatsCard from '@/components/client/StatsCard';
import TrainerCard from '@/components/client/TrainerCard';
import { colors, fontSize, gradientColors, radius } from '@/constants/theme';
import { expertiseCategories, mockTrainers, unreadNotificationCount } from '@/data/mockData';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

const topTrainers = mockTrainers.filter((t) => t.rating >= 4.8).slice(0, 3);
const recentlyViewed = mockTrainers.slice(0, 4);
const categories = expertiseCategories.slice(0, 8);

// Positive translateY = element starts BELOW its final position → slides UP
const SLIDE = 40;
const DUR = 300;

export default function ClientHome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();
    const greeting = getGreeting();

    const statsY = useSharedValue(SLIDE);
    const catsY = useSharedValue(SLIDE);
    const trainersY = useSharedValue(SLIDE);
    const recentY = useSharedValue(SLIDE);

    const anim = useRef({ statsY, catsY, trainersY, recentY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            const ease = { duration: DUR };

            v.statsY.value = SLIDE;
            v.statsY.value = withTiming(0, ease);

            v.catsY.value = SLIDE;
            v.catsY.value = withDelay(80, withTiming(0, ease));

            v.trainersY.value = SLIDE;
            v.trainersY.value = withDelay(160, withTiming(0, ease));

            v.recentY.value = SLIDE;
            v.recentY.value = withDelay(240, withTiming(0, ease));
        }, []),
    );

    const statsStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: statsY.value }],
    }));
    const catsStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: catsY.value }],
    }));
    const trainersStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: trainersY.value }],
    }));
    const recentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: recentY.value }],
    }));

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero / Header */}
                <LinearGradient
                    colors={gradientColors.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        paddingHorizontal: 20,
                        paddingTop: insets.top + 20,
                        paddingBottom: 36,
                        borderBottomLeftRadius: radius.hero,
                        borderBottomRightRadius: radius.hero,
                        overflow: 'hidden',
                    }}
                >
                    {/* Greeting row */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View>
                            <Text style={{ fontSize: fontSize.body, color: colors.white65, fontWeight: '500' }}>
                                {`${greeting} 👋`}
                            </Text>
                            <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.white, marginTop: 2 }}>
                                Find Your Trainer
                            </Text>
                        </View>

                        {/* Notification Bell */}
                        <TouchableOpacity
                            onPress={() => router.push('/client/notifications' as never)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: radius.icon,
                                backgroundColor: colors.white15,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="notifications-outline" size={20} color={colors.white} />
                            {unreadNotificationCount > 0 && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -4,
                                        right: -4,
                                        minWidth: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        backgroundColor: colors.accent,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingHorizontal: 4,
                                        borderWidth: 1.5,
                                        borderColor: colors.primary,
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                        {unreadNotificationCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <TouchableOpacity
                        onPress={() => router.push('/client/discover' as never)}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: colors.white18,
                            borderRadius: radius.card,
                            paddingHorizontal: 16,
                            paddingVertical: 13,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="search-outline" size={16} color={colors.white60} />
                        <Text style={{ flex: 1, fontSize: fontSize.body, color: colors.white55, marginLeft: 10 }}>
                            Search trainers, skills, locations...
                        </Text>
                        <Ionicons name="options-outline" size={16} color={colors.white60} />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Content */}
                <View style={{ paddingHorizontal: 20, marginTop: 20, overflow: 'visible' }}>

                    {/* Quick Stats */}
                    <Animated.View className="flex-row" style={[{ gap: 10, overflow: 'visible' }, statsStyle]}>
                        <StatsCard title="Trainers" value="500+" icon="trending-up-outline" />
                        <StatsCard title="Sessions" value="2.4K" icon="time-outline" />
                        <StatsCard title="Saved" value="12" icon="heart-outline" />
                    </Animated.View>

                    {/* Browse Categories */}
                    <Animated.View style={[{ marginTop: 28, overflow: 'visible' }, catsStyle]}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                                Browse Categories
                            </Text>
                            <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                        >
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => router.push(`/client/discover?expertise=${cat}` as never)}
                                    activeOpacity={0.7}
                                    style={{
                                        backgroundColor: colors.surface,
                                        borderRadius: radius.md,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderWidth: 1,
                                        borderColor: colors.surfaceBorder,
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textSecondary, fontWeight: '500' }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* Top Rated Trainers */}
                    <Animated.View style={[{ marginTop: 28, overflow: 'visible' }, trainersStyle]}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                                Top Rated Trainers
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/client/discover' as never)}>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.primary }}>
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ gap: 12 }}>
                            {topTrainers.map((trainer) => (
                                <TrainerCard
                                    key={trainer.id}
                                    trainer={trainer}
                                    onPress={() => router.push(`/client/trainerProfile?id=${trainer.id}` as never)}
                                />
                            ))}
                        </View>
                    </Animated.View>

                    {/* Recently Viewed */}
                    <Animated.View style={[{ marginTop: 28, marginBottom: 8, overflow: 'visible' }, recentStyle]}>
                        <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
                            Recently Viewed
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 16, paddingBottom: 4 }}
                        >
                            {recentlyViewed.map((t) => {
                                const initials = t.name.split(' ').map((n) => n[0]).join('');
                                const firstName = t.name.split(' ')[0];
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => router.push(`/client/trainerProfile?id=${t.id}` as never)}
                                        activeOpacity={0.75}
                                        style={{ width: 72, alignItems: 'center', gap: 8 }}
                                    >
                                        <View
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: radius.card,
                                                backgroundColor: colors.primaryMuted,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: 1.5,
                                                borderColor: colors.primaryBorderSm,
                                            }}
                                        >
                                            <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.primary }}>
                                                {initials}
                                            </Text>
                                        </View>
                                        <Text
                                            style={{ fontSize: fontSize.caption, color: colors.textMuted, fontWeight: '500', textAlign: 'center' }}
                                            numberOfLines={1}
                                        >
                                            {firstName}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
