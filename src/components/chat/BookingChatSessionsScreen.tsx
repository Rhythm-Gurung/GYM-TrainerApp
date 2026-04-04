import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBookingChatSessions } from '@/api/hooks/useBookingChat';
import type { BookingChatSession, ChatRole } from '@/api/services/bookingChat.service';
import { colors, fontSize, radius } from '@/constants/theme';

interface BookingChatSessionsScreenProps {
    chatRole: ChatRole;
}

function formatTime(value: string): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EmptyState() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            <View
                style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                    marginBottom: 14,
                }}
            >
                <Ionicons name="chatbubbles-outline" size={30} color={colors.textSubtle} />
            </View>
            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>
                No active booking chats
            </Text>
            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                Chat unlocks only when a booking is confirmed and closes when the booking is completed.
            </Text>
        </View>
    );
}

export default function BookingChatSessionsScreen({ chatRole }: BookingChatSessionsScreenProps) {
    const router = useRouter();
    const { data, isLoading, refetch, isFetching } = useBookingChatSessions();

    useFocusEffect(
        useCallback(() => {
            refetch().catch(() => { });
        }, [refetch]),
    );

    const sessions = useMemo(
        () => (data ?? [])
            .filter((session) => session.canChat && (session.bookingStatus === 'confirmed' || session.bookingStatus === 'in_progress'))
            .sort((a, b) => (
                new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
            )),
        [data],
    );

    const accent = chatRole === 'trainer' ? colors.trainerPrimary : colors.primary;
    const muted = chatRole === 'trainer' ? colors.trainerMuted : colors.primaryMuted;

    const openSession = useCallback((session: BookingChatSession) => {
        const pathname = chatRole === 'trainer'
            ? '/(tabs)/trainer/bookingChatRoom'
            : '/(tabs)/client/bookingChatRoom';

        router.push({
            pathname: pathname as never,
            params: {
                bookingId: session.bookingId,
                partnerName: session.otherUserName,
            },
        });
    }, [chatRole, router]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                    backgroundColor: colors.white,
                    gap: 12,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                        Booking Chats
                    </Text>
                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 4 }}>
                        Available for confirmed and in-progress bookings
                    </Text>
                </View>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={accent} />
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.bookingId}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 14,
                        paddingBottom: 20,
                        flexGrow: sessions.length === 0 ? 1 : 0,
                    }}
                    ListEmptyComponent={<EmptyState />}
                    refreshing={isFetching && !isLoading}
                    onRefresh={refetch}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => openSession(item)}
                            activeOpacity={0.78}
                            style={{
                                backgroundColor: colors.white,
                                borderRadius: radius.card,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                padding: 14,
                                marginBottom: 10,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 21,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: muted,
                                    }}
                                >
                                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={accent} />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                                            {item.otherUserName}
                                        </Text>
                                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle }}>
                                            {formatTime(item.lastMessageAt)}
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                        <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, flex: 1 }} numberOfLines={1}>
                                            {item.lastMessage || 'Open chat'}
                                        </Text>
                                        {item.unreadCount > 0 && (
                                            <View
                                                style={{
                                                    marginLeft: 8,
                                                    minWidth: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    backgroundColor: colors.error,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    paddingHorizontal: 5,
                                                }}
                                            >
                                                <Text style={{ color: colors.white, fontSize: fontSize.caption, fontWeight: '700' }}>
                                                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
