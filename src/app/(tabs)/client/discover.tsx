import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    LayoutAnimation,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import ClientChip, { ClientRatingChip } from '@/components/client/ClientChip';
import ClientDiscoverTopControls from '@/components/client/ClientDiscoverTopControls';
import ImmersiveTrainerCard from '@/components/client/ImmersiveTrainerCard';
import { colors, fontSize } from '@/constants/theme';
import { expertiseCategories, locations, mockTrainers } from '@/data/mockData';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { buildMosaicRows } from '@/lib/mosaic';
import type { Trainer } from '@/types/clientTypes';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = 'rating' | 'price_low' | 'price_high' | 'experience' | 'reviews';

interface TrainerFilters {
    expertise: string[];
    location?: string;
    minRating?: number;
    sortBy: SortOption;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'rating', label: 'Top Rated' },
    { key: 'price_low', label: 'Price: Low' },
    { key: 'price_high', label: 'Price: High' },
    { key: 'experience', label: 'Experience' },
    { key: 'reviews', label: 'Most Reviews' },
];

const RATING_OPTIONS: { value: number | undefined; label: string }[] = [
    { value: undefined, label: 'Any' },
    { value: 4, label: '4+' },
    { value: 4.5, label: '4.5+' },
    { value: 4.8, label: '4.8+' },
];

const DEFAULT_FILTERS: TrainerFilters = {
    expertise: [],
    sortBy: 'rating',
};

const DISCOVER_MOSAIC_PATTERNS = [
    [2, 2, 1],
    [1, 2, 2],
    [2, 1, 2],
] as const;

const SLIDE = 40;
const DUR = 300;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applySort(trainers: Trainer[], sort: SortOption): Trainer[] {
    const list = [...trainers];
    switch (sort) {
        case 'rating':
            return list.sort((a, b) => b.rating - a.rating);
        case 'price_low':
            return list.sort((a, b) => a.hourlyRate - b.hourlyRate);
        case 'price_high':
            return list.sort((a, b) => b.hourlyRate - a.hourlyRate);
        case 'experience':
            return list.sort((a, b) => b.experienceYears - a.experienceYears);
        case 'reviews':
            return list.sort((a, b) => b.reviewCount - a.reviewCount);
        default:
            return list;
    }
}

interface GridCardProps {
    trainer: Trainer;
    index: number;
    animKey: number;
    onPress: () => void;
    fullWidth?: boolean;
}

function GridCard({ trainer, index, animKey, onPress, fullWidth = false }: GridCardProps) {
    return (
        <View style={{ flex: fullWidth ? undefined : 1, width: fullWidth ? '100%' : undefined, marginBottom: 12 }}>
            <ImmersiveTrainerCard trainer={trainer} index={index} animKey={animKey} onPress={onPress} />
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientDiscover() {
    const router = useRouter();
    const params = useLocalSearchParams<{ expertise?: string | string[] }>();
    const tabBarHeight = useTabBarHeight();

    const initialExpertise = useMemo(() => {
        if (!params.expertise) return undefined;
        return Array.isArray(params.expertise) ? params.expertise[0] : params.expertise;
    }, [params.expertise]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<TrainerFilters>(() => ({
        ...DEFAULT_FILTERS,
        expertise: initialExpertise ? [initialExpertise] : [],
    }));
    const [showFilters, setShowFilters] = useState(false);
    const [animKey, setAnimKey] = useState(0);

    // Same pattern as home.tsx: animate content sections, not structural containers.
    // Structural containers (header shell, filter shell) stay fixed — only the
    // content rows inside them slide up with overflow: 'visible', preventing
    // any gap/black-border artifact between blocks.
    const sortY = useSharedValue(SLIDE);

    const anim = useRef({ sortY });

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;

            v.sortY.value = SLIDE;
            v.sortY.value = withTiming(0, { duration: DUR });

            setAnimKey((k) => k + 1);
        }, []),
    );

    const sortStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: sortY.value }],
    }));

    const activeFilterCount = [
        filters.expertise.length > 0,
        Boolean(filters.location),
        typeof filters.minRating === 'number',
    ].filter(Boolean).length;

    const toggleFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowFilters((prev) => !prev);
    };

    const clearFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFilters({ ...DEFAULT_FILTERS });
    };

    const toggleExpertise = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            expertise: prev.expertise.includes(value)
                ? prev.expertise.filter((item) => item !== value)
                : [...prev.expertise, value],
        }));
    };

    const filteredTrainers = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();

        const filtered = mockTrainers.filter((t) => {
            if (q) {
                const hit =
                    t.name.toLowerCase().includes(q) ||
                    t.expertise.some((e) => e.toLowerCase().includes(q)) ||
                    t.location.toLowerCase().includes(q);
                if (!hit) return false;
            }
            if (filters.expertise.length > 0 && !t.expertise.some((e) => filters.expertise.includes(e))) return false;
            if (filters.location && t.location !== filters.location) return false;
            if (typeof filters.minRating === 'number' && t.rating < filters.minRating) return false;
            return true;
        });

        return applySort(filtered, filters.sortBy);
    }, [searchQuery, filters]);

    const trainerRows = useMemo(
        () => buildMosaicRows(filteredTrainers, { patterns: [...DISCOVER_MOSAIC_PATTERNS] })
            .map((row) => row.map((tile) => ({ trainer: tile.item, index: tile.index }))),
        [filteredTrainers],
    );

    type TrainerTile = (typeof trainerRows)[number][number];

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>

            {/* ── Header shell — static, never moves (matches home.tsx pattern) ── */}
            <View
                style={{
                    backgroundColor: colors.background,
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 4,
                }}
            >
                <ClientDiscoverTopControls
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onBackPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        }
                    }}
                    onFiltersPress={toggleFilters}
                    showFilters={showFilters}
                />

                {/* Sort chips — content section that slides up inside the static shell */}
                <Animated.View style={[{ overflow: 'visible' }, sortStyle]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <ClientChip
                                key={opt.key}
                                label={opt.label}
                                active={filters.sortBy === opt.key}
                                onPress={() => setFilters((prev) => ({ ...prev, sortBy: opt.key }))}
                                variant="sort"
                            />
                        ))}
                    </ScrollView>
                </Animated.View>
            </View>

            {/* ── Collapsible filter panel — static shell, LayoutAnimation handles open/close ── */}
            {showFilters && (
                <View
                    style={{
                        backgroundColor: colors.surfaceSubtle,
                        paddingHorizontal: 20,
                        paddingTop: 16,
                        paddingBottom: 12,
                    }}
                >
                    {/* Expertise */}
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
                        Expertise
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6, paddingBottom: 14 }}
                    >
                        {expertiseCategories.map((cat) => (
                            <ClientChip
                                key={cat}
                                label={cat}
                                active={filters.expertise.includes(cat)}
                                onPress={() => toggleExpertise(cat)}
                                variant="filter"
                            />
                        ))}
                    </ScrollView>

                    {/* Location */}
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
                        Location
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6, paddingBottom: 14 }}
                    >
                        {locations.map((loc) => (
                            <ClientChip
                                key={loc}
                                label={loc}
                                active={filters.location === loc}
                                onPress={() => setFilters((f) => ({ ...f, location: f.location === loc ? undefined : loc }))}
                                variant="filter"
                            />
                        ))}
                    </ScrollView>

                    {/* Min Rating */}
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
                        Min Rating
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 14 }}>
                        {RATING_OPTIONS.map(({ value, label }) => {
                            const active = filters.minRating === value;
                            return (
                                <ClientRatingChip
                                    key={label}
                                    label={label}
                                    active={active}
                                    withStar={typeof value === 'number'}
                                    onPress={() => setFilters((f) => ({ ...f, minRating: value }))}
                                />
                            );
                        })}
                    </View>

                    {/* Clear all */}
                    {activeFilterCount > 0 && (
                        <TouchableOpacity onPress={clearFilters} activeOpacity={0.7} style={{ alignSelf: 'flex-start' }}>
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.error }}>
                                Clear all filters
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* ── Immersive grid results — card animations handled by animKey inside ImmersiveTrainerCard ── */}
            <View style={{ flex: 1 }}>
                <FlatList<TrainerTile[]>
                    data={trainerRows}
                    keyExtractor={(row) => row.map((tile) => tile.trainer.id).join('-')}
                    renderItem={({ item: row }) => {
                        if (row.length === 1) {
                            const tile = row[0];
                            return (
                                <GridCard
                                    trainer={tile.trainer}
                                    index={tile.index}
                                    animKey={animKey}
                                    fullWidth
                                    onPress={() => router.push(`/client/trainerProfile?id=${tile.trainer.id}`)}
                                />
                            );
                        }

                        return (
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {row.map((tile) => (
                                    <GridCard
                                        key={tile.trainer.id}
                                        trainer={tile.trainer}
                                        index={tile.index}
                                        animKey={animKey}
                                        onPress={() => router.push(`/client/trainerProfile?id=${tile.trainer.id}`)}
                                    />
                                ))}
                            </View>
                        );
                    }}
                    contentContainerStyle={{
                        paddingHorizontal: 12,
                        paddingTop: 10,
                        paddingBottom: tabBarHeight + 16,
                    }}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={(
                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginBottom: 12, paddingHorizontal: 4 }}>
                            {filteredTrainers.length === 0
                                ? 'No trainers found'
                                : `${filteredTrainers.length} trainer${filteredTrainers.length === 1 ? '' : 's'} found`}
                        </Text>
                    )}
                    ListEmptyComponent={(
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <Ionicons name="search-outline" size={48} color={colors.textDisabled} />
                            <Text
                                style={{
                                    fontSize: fontSize.body,
                                    color: colors.textSubtle,
                                    marginTop: 12,
                                    textAlign: 'center',
                                    lineHeight: 22,
                                }}
                            >
                                {'No trainers match your search.\nTry adjusting your filters.'}
                            </Text>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
