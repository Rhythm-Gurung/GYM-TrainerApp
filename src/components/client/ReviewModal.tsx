import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, radius } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    trainerName: string;
    bookingDate: string;
    bookingTime: string;
}

// ─── Star Rating Input ────────────────────────────────────────────────────────

interface StarRatingProps {
    rating: number;
    onRatingChange: (rating: number) => void;
}

function StarRating({ rating, onRatingChange }: StarRatingProps) {
    return (
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => onRatingChange(star)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= rating ? colors.accent : colors.textMuted}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── Modal Component ──────────────────────────────────────────────────────────

export default function ReviewModal({
    visible,
    onClose,
    onSubmit,
    trainerName,
    bookingDate,
    bookingTime,
}: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        // Client-side validation (lightweight)
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        if (comment.trim().length === 0) {
            setError('Please write a comment');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit(rating, comment.trim());
            // Success - reset form and close
            setRating(0);
            setComment('');
            onClose();
        } catch (err: unknown) {
            // Display backend error message
            if (err && typeof err === 'object' && 'message' in err) {
                setError(String(err.message));
            } else if (err && typeof err === 'object' && 'response' in err) {
                const response = err.response as { data?: { message?: string; detail?: string } };
                setError(response.data?.message ?? response.data?.detail ?? 'Failed to submit review');
            } else {
                setError('Failed to submit review. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setRating(0);
            setComment('');
            setError('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                }}
            >
                <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.white }}>
                    <View
                        style={{
                            backgroundColor: colors.white,
                            borderTopLeftRadius: radius.card,
                            borderTopRightRadius: radius.card,
                            paddingHorizontal: 20,
                            paddingTop: 20,
                            maxHeight: '90%',
                        }}
                    >
                        {/* Header */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: fontSize.header,
                                    fontWeight: '700',
                                    color: colors.textPrimary,
                                }}
                            >
                                Leave a Review
                            </Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                disabled={isSubmitting}
                                style={{ padding: 4 }}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {/* Booking Info */}
                            <View
                                style={{
                                    backgroundColor: colors.surface,
                                    borderRadius: radius.md,
                                    padding: 16,
                                    marginBottom: 24,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.body,
                                        fontWeight: '600',
                                        color: colors.textPrimary,
                                        marginBottom: 4,
                                    }}
                                >
                                    {trainerName}
                                </Text>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                                    {bookingDate}
                                    {' '}
                                    ·
                                    {bookingTime}
                                </Text>
                            </View>

                            {/* Rating */}
                            <View style={{ marginBottom: 24 }}>
                                <Text
                                    style={{
                                        fontSize: fontSize.body,
                                        fontWeight: '600',
                                        color: colors.textPrimary,
                                        marginBottom: 12,
                                        textAlign: 'center',
                                    }}
                                >
                                    How was your session?
                                </Text>
                                <StarRating rating={rating} onRatingChange={setRating} />
                            </View>

                            {/* Comment */}
                            <View style={{ marginBottom: 20 }}>
                                <Text
                                    style={{
                                        fontSize: fontSize.body,
                                        fontWeight: '600',
                                        color: colors.textPrimary,
                                        marginBottom: 8,
                                    }}
                                >
                                    Your Review
                                </Text>
                                <TextInput
                                    value={comment}
                                    onChangeText={setComment}
                                    placeholder="Share your experience with this trainer..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    style={{
                                        backgroundColor: colors.white,
                                        borderWidth: 1,
                                        borderColor: colors.surfaceBorder,
                                        borderRadius: radius.md,
                                        padding: 12,
                                        fontSize: fontSize.body,
                                        color: colors.textPrimary,
                                        minHeight: 120,
                                    }}
                                    editable={!isSubmitting}
                                />
                            </View>

                            {/* Error Message */}
                            {error ? (
                                <View
                                    style={{
                                        backgroundColor: '#FEE',
                                        borderRadius: radius.sm,
                                        padding: 12,
                                        marginBottom: 16,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: fontSize.tag,
                                            color: '#C00',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {error}
                                    </Text>
                                </View>
                            ) : null}

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                style={{
                                    backgroundColor: isSubmitting ? colors.textMuted : colors.primary,
                                    borderRadius: radius.md,
                                    paddingVertical: 16,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <ActivityIndicator size="small" color={colors.white} />
                                        <Text
                                            style={{
                                                fontSize: fontSize.body,
                                                fontWeight: '600',
                                                color: colors.white,
                                            }}
                                        >
                                            Submitting...
                                        </Text>
                                    </>
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: fontSize.body,
                                            fontWeight: '600',
                                            color: colors.white,
                                        }}
                                    >
                                        Submit Review
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}
