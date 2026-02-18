import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { Trainer } from '@/types/clientTypes';

interface TrainerProfileCardProps {
    trainer: Trainer;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

export default function TrainerProfileCard({ trainer }: TrainerProfileCardProps) {
    const initials = getInitials(trainer.name);

    return (
        <View
            style={[
                {
                    backgroundColor: colors.white,
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                },
                shadow.cardStrong,
            ]}
        >
            {/* Avatar + info row */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
                {/* Avatar */}
                <View
                    style={{
                        width: 76,
                        height: 76,
                        borderRadius: radius.card,
                        backgroundColor: colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 3,
                        borderColor: colors.white,
                        flexShrink: 0,
                        ...shadow.cardStrong,
                    }}
                >
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.primary }}>
                        {initials}
                    </Text>
                </View>

                {/* Name, rating, location */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                            style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 }}
                            numberOfLines={1}
                        >
                            {trainer.name}
                        </Text>
                        {trainer.isVerified && (
                            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                        <Ionicons name="star" size={12} color={colors.accent} />
                        <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textSecondary }}>
                            {trainer.rating.toFixed(1)}
                        </Text>
                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle }}>
                            (
{trainer.reviewCount}
{' '}
reviews)
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="location-outline" size={12} color={colors.textSubtle} />
                        <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                            {trainer.location}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Stats row */}
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 20,
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: colors.surfaceBorder,
                }}
            >
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary }}>
                        {`${trainer.experienceYears}+`}
                    </Text>
                    <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                        Yrs Exp
                    </Text>
                </View>

                <View style={{ width: 1, backgroundColor: colors.surfaceBorder }} />

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.primary }}>
                        {`₹${trainer.hourlyRate}`}
                    </Text>
                    <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                        Per Hour
                    </Text>
                </View>

                <View style={{ width: 1, backgroundColor: colors.surfaceBorder }} />

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize.section, fontWeight: '800', color: colors.textPrimary }}>
                        {`${trainer.profileCompleteness}%`}
                    </Text>
                    <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                        Profile
                    </Text>
                </View>
            </View>
        </View>
    );
}
