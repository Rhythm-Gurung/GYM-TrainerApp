import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';
import type { Review } from '@/types/clientTypes';

interface ReviewCardProps {
    review: Review;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

export default function ReviewCard({ review }: ReviewCardProps) {
    const initials = getInitials(review.clientName);
    const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    return (
        <View
            style={{
                backgroundColor: colors.white,
                borderRadius: radius.card,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                marginBottom: 10,
            }}
        >
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Avatar */}
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.sm,
                        backgroundColor: colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.primary }}>
                        {initials}
                    </Text>
                </View>

                {/* Name + date */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary }}>
                        {review.clientName}
                    </Text>
                    <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginTop: 1 }}>
                        {formattedDate}
                    </Text>
                </View>

                {/* Rating */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={13} color={colors.accent} />
                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textSecondary }}>
                        {review.rating}
                    </Text>
                </View>
            </View>

            {/* Comment */}
            <Text
                style={{
                    fontSize: fontSize.tag,
                    color: colors.textMuted,
                    marginTop: 10,
                    lineHeight: 19,
                }}
            >
                {review.comment}
            </Text>
        </View>
    );
}
