import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookingChatService, buildBookingChatWebSocketUrl, type BookingChatMessage, type ChatRole } from '@/api/services/bookingChat.service';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { showErrorToast, showInfoToast } from '@/lib';
import { chatEvents } from '@/lib/chatEvents';
import chatBgImage from '../../../assets/images/ChatBG3.jpg';

type ChatUiState = 'LOCKED' | 'CONNECTING' | 'ACTIVE' | 'DISABLED' | 'RECONNECTABLE';

interface UiMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
}

interface BookingChatRoomScreenProps {
    chatRole: ChatRole;
    bookingId: string;
    initialPartnerName?: string;
}

const CHAT_DISABLED_TEXT = 'Chat is disabled because this booking is no longer confirmed. Book a new session to continue chatting.';

function getMeaningfulName(value: unknown): string {
    if (typeof value !== 'string') return '';
    const normalized = value.trim();
    if (!normalized) return '';

    const blocked = ['user', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined'];
    if (blocked.includes(normalized.toLowerCase())) return '';

    return normalized;
}

function pickNonEmpty(...values: unknown[]): string {
    return values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .find((value) => Boolean(value)) ?? '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
}

function joinFirstLastName(firstName: unknown, lastName: unknown): string {
    const first = pickNonEmpty(firstName);
    const last = pickNonEmpty(lastName);
    if (first && last) return `${first} ${last}`;
    return first || last;
}

function formatTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizeIncomingMessage(raw: unknown, bookingId: string): BookingChatMessage {
    const value = (raw ?? {}) as Record<string, unknown>;
    const senderObject = asRecord(value.sender);
    const senderObjectId = senderObject?.id;

    let resolvedId = `${Date.now()}-${Math.random()}`;
    if (typeof value.id === 'string' || typeof value.id === 'number') {
        resolvedId = String(value.id);
    } else if (typeof value.message_id === 'string' || typeof value.message_id === 'number') {
        resolvedId = String(value.message_id);
    }

    let content = '';
    if (typeof value.content === 'string') {
        content = value.content;
    } else if (typeof value.message === 'string') {
        content = value.message;
    }

    let timestamp = new Date().toISOString();
    if (typeof value.timestamp === 'string') {
        timestamp = value.timestamp;
    } else if (typeof value.created_at === 'string') {
        timestamp = value.created_at;
    }

    const rawSenderId = value.sender_id ?? senderObjectId ?? value.user_id ?? value.author_id;
    let senderId = '';
    if (typeof rawSenderId === 'number') {
        senderId = String(rawSenderId);
    } else if (typeof rawSenderId === 'string') {
        senderId = rawSenderId;
    }

    return {
        id: resolvedId,
        bookingId,
        senderId,
        senderName: pickNonEmpty(
            value.sender_username,
            senderObject?.username,
            joinFirstLastName(value.sender_first_name, value.sender_last_name),
            joinFirstLastName(senderObject?.first_name, senderObject?.last_name),
            value.sender_full_name,
            senderObject?.full_name,
            value.sender_name,
            senderObject?.name,
            value.user_name,
            value.sender_email,
            senderObject?.email,
            'User',
        ),
        senderRole: value.sender_role === 'trainer' ? 'trainer' : 'client',
        content,
        timestamp,
        isRead: Boolean(value.is_read),
    };
}

function mapToUiMessage(message: BookingChatMessage): UiMessage {
    return {
        id: message.id,
        senderId: String(message.senderId),
        text: message.content,
        timestamp: message.timestamp,
    };
}

function isMineMessage(messageSenderId: string, currentUserId: string): boolean {
    const normalizedCurrentUserId = String(currentUserId).trim();
    if (!normalizedCurrentUserId) return false;
    return String(messageSenderId).trim() === normalizedCurrentUserId;
}

function mergeMessages(current: UiMessage[], incoming: UiMessage[]): UiMessage[] {
    const map = new Map<string, UiMessage>();
    current.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));

    return [...map.values()].sort((a, b) => (
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ));
}

function canReplaceOptimisticWithServer(optimistic: UiMessage, incoming: UiMessage): boolean {
    if (!optimistic.id.startsWith('optimistic-')) return false;
    if (optimistic.senderId !== incoming.senderId) return false;
    if (optimistic.text.trim() !== incoming.text.trim()) return false;

    const optimisticTime = new Date(optimistic.timestamp).getTime();
    const incomingTime = new Date(incoming.timestamp).getTime();
    if (Number.isNaN(optimisticTime) || Number.isNaN(incomingTime)) return false;

    // Echoed server message should arrive shortly after local optimistic send.
    return Math.abs(incomingTime - optimisticTime) <= 30000;
}

function reconcileOwnIncomingMessage(current: UiMessage[], incoming: UiMessage): UiMessage[] {
    const withoutMatchedOptimistic = current.filter((item) => !canReplaceOptimisticWithServer(item, incoming));
    return mergeMessages(withoutMatchedOptimistic, [incoming]);
}

function MessageBubble({ item, currentUserId }: { item: UiMessage; currentUserId: string }) {
    const isSelf = isMineMessage(item.senderId, currentUserId);
    return (
        <View style={{ width: '100%', marginBottom: 12, paddingHorizontal: 12, flexDirection: 'row', justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
            <View style={{ maxWidth: '75%', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                <View
                    style={{
                        backgroundColor: isSelf ? colors.primary : colors.surface,
                        borderRadius: radius.card,
                        borderTopRightRadius: isSelf ? 4 : radius.card,
                        borderTopLeftRadius: isSelf ? radius.card : 4,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderWidth: isSelf ? 0 : 1,
                        borderColor: colors.surfaceBorder,
                        ...(isSelf ? shadow.primary : {}),
                    }}
                >
                    <Text style={{ color: isSelf ? colors.white : colors.textPrimary, fontSize: fontSize.body, lineHeight: 20 }}>
                        {item.text}
                    </Text>
                </View>
                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginTop: 3, marginHorizontal: 4 }}>
                    {formatTime(item.timestamp)}
                </Text>
            </View>
        </View>
    );
}

export default function BookingChatRoomScreen({ chatRole, bookingId, initialPartnerName }: BookingChatRoomScreenProps) {
    const router = useRouter();
    const normalizedInitialPartnerName = useMemo(() => getMeaningfulName(initialPartnerName), [initialPartnerName]);
    const [uiState, setUiState] = useState<ChatUiState>('CONNECTING');
    const [disabledMessage, setDisabledMessage] = useState('');
    const [messages, setMessages] = useState<UiMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [partnerName, setPartnerName] = useState(normalizedInitialPartnerName || 'Chat');
    const [bootLoading, setBootLoading] = useState(true);

    const wsRef = useRef<WebSocket | null>(null);
    const retriedTokenRef = useRef(false);
    const mountedRef = useRef(true);
    const uiStateRef = useRef<ChatUiState>('CONNECTING');
    const currentUserIdRef = useRef('');
    const flatListRef = useRef<FlatList<UiMessage>>(null);
    // Tracks whether this screen is currently visible. In Expo Router tab
    // navigation, tab screens stay MOUNTED in the background after navigating
    // away, so the chat WebSocket keeps receiving messages. We must NOT call
    // markRead() for background messages — that would wipe the unread badge
    // on the bookings screen even though the user never saw those messages.
    const isFocusedRef = useRef(false);

    const setUiStateSafe = useCallback((next: ChatUiState | ((prev: ChatUiState) => ChatUiState)) => {
        setUiState((prev) => {
            const value = typeof next === 'function' ? next(prev) : next;
            uiStateRef.current = value;
            return value;
        });
    }, []);

    const canSend = uiState === 'ACTIVE' && draft.trim().length > 0;
    const accentColor = chatRole === 'trainer' ? colors.trainerPrimary : colors.primary;
    const mutedColor = chatRole === 'trainer' ? colors.trainerMuted : colors.primaryMuted;
    const accentBorderColor = chatRole === 'trainer' ? colors.trainerBorder : colors.primaryBorder;
    const bookingsRoute = chatRole === 'trainer' ? '/(tabs)/trainer/bookings' : '/(tabs)/client/bookings';
    const sendButtonColor = canSend ? accentColor : colors.surface;

    const applyPartnerName = useCallback((nextValue: unknown) => {
        const nextName = getMeaningfulName(nextValue);
        if (!nextName) return;
        setPartnerName((current) => (current === nextName ? current : nextName));
    }, []);

    const applyPartnerNameFromChatMessages = useCallback((chatMessages: BookingChatMessage[]) => {
        const namedOther = chatMessages.find((item) => (
            !isMineMessage(item.senderId, currentUserIdRef.current)
            && getMeaningfulName(item.senderName)
        ));
        if (namedOther) {
            applyPartnerName(namedOther.senderName);
        }
    }, [applyPartnerName]);

    const appendIncomingMessage = useCallback((incomingMessage: UiMessage, isMine: boolean) => {
        setMessages((current) => (
            isMine
                ? reconcileOwnIncomingMessage(current, incomingMessage)
                : mergeMessages(current, [incomingMessage])
        ));
    }, []);

    useEffect(() => {
        applyPartnerName(normalizedInitialPartnerName);
    }, [applyPartnerName, normalizedInitialPartnerName]);

    const closeSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const markRead = useCallback(async () => {
        if (!bookingId) return;

        try {
            await bookingChatService.markAsRead(bookingId);
            // Do NOT emit chatEvents here — the backend pushes the correct
            // unread_count via the badge WebSocket after markAsRead succeeds.
            // Emitting 0 here would race against badge WS events and wipe a
            // badge that arrived between the HTTP call starting and completing.
        } catch {
            // Avoid interrupting chat flow if read receipt fails.
        }
    }, [bookingId]);

    const handleChatDisabled = useCallback((message?: string) => {
        setUiStateSafe('DISABLED');
        setDisabledMessage(message || CHAT_DISABLED_TEXT);
        closeSocket();
    }, [closeSocket, setUiStateSafe]);

    const connectSocket = useCallback(async () => {
        if (!bookingId) return;

        setUiStateSafe('CONNECTING');

        const token = await bookingChatService.getAccessToken();
        if (!token) {
            setUiStateSafe('LOCKED');
            setDisabledMessage('Chat unavailable for this booking.');
            return;
        }

        const socket = new WebSocket(buildBookingChatWebSocketUrl(bookingId, token));
        wsRef.current = socket;

        socket.onopen = () => {
            if (!mountedRef.current) return;
            setUiStateSafe('ACTIVE');
            retriedTokenRef.current = false;
        };

        socket.onmessage = async (event) => {
            if (!mountedRef.current) return;

            let payload: unknown;
            try {
                payload = JSON.parse(event.data as string);
            } catch {
                return;
            }

            const body = (payload ?? {}) as Record<string, unknown>;
            const type = typeof body.type === 'string' ? body.type : '';

            if (type === 'chat_disabled') {
                handleChatDisabled(typeof body.message === 'string' ? body.message : undefined);
                return;
            }

            if (type === 'history') {
                const normalizedHistory = Array.isArray(body.messages)
                    ? body.messages.map((item) => normalizeIncomingMessage(item, bookingId))
                    : [];
                const incoming = normalizedHistory.map((item) => mapToUiMessage(item));
                setMessages((current) => mergeMessages(current, incoming));
                applyPartnerNameFromChatMessages(normalizedHistory);

                flatListRef.current?.scrollToEnd({ animated: false });
                return;
            }

            if (type === 'message') {
                const normalizedIncoming = normalizeIncomingMessage(body, bookingId);
                const incomingMessage = mapToUiMessage(normalizedIncoming);
                const isMine = isMineMessage(incomingMessage.senderId, currentUserIdRef.current);
                appendIncomingMessage(incomingMessage, isMine);
                if (!isMine) {
                    applyPartnerName(normalizedIncoming.senderName);
                    // Only mark as read when the screen is actually focused.
                    // The chat WebSocket stays alive in the background (Expo Router
                    // keeps tab screens mounted), so messages can arrive here even
                    // while the user is on the bookings screen. Calling markRead()
                    // in that case would clear the unread badge the user hasn't seen.
                    if (isFocusedRef.current) {
                        await markRead();
                    }
                }
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 30);
                return;
            }

            if (type === 'unread_update') {
                const rawBookingId = body.booking_id ?? body.bookingId;
                let resolvedBookingId = bookingId;
                if (typeof rawBookingId === 'string') resolvedBookingId = rawBookingId;
                else if (typeof rawBookingId === 'number') resolvedBookingId = String(rawBookingId);

                const rawCount = body.unread_count ?? body.unreadCount;
                let resolvedCount = 0;
                if (typeof rawCount === 'number' && Number.isFinite(rawCount)) {
                    resolvedCount = rawCount;
                } else if (typeof rawCount === 'string' && Number.isFinite(Number(rawCount))) {
                    resolvedCount = Number(rawCount);
                }

                chatEvents.emit('unread_update', { bookingId: resolvedBookingId, unreadCount: resolvedCount });
                return;
            }

            if (type === 'error' || type === 'validation_error') {
                const message = typeof body.message === 'string' ? body.message : 'Unable to process this message.';
                showErrorToast(message);
            }
        };

        socket.onerror = () => {
            if (!mountedRef.current) return;
            if (wsRef.current !== socket) return;
            setUiStateSafe((prev) => (prev === 'DISABLED' ? prev : 'RECONNECTABLE'));
        };

        socket.onclose = async (event) => {
            if (!mountedRef.current) return;
            if (wsRef.current !== socket) return;
            wsRef.current = null;

            if (uiStateRef.current === 'DISABLED') return;

            const authFailure = event.code === 4001 || event.code === 4401;
            const forbidden = event.code === 4003 || event.code === 4403;

            if (forbidden) {
                setUiStateSafe('DISABLED');
                setDisabledMessage('Chat unavailable for this booking.');
                return;
            }

            if (authFailure && !retriedTokenRef.current) {
                retriedTokenRef.current = true;
                const refreshed = await bookingChatService.refreshAccessToken();
                if (refreshed) {
                    await connectSocket();
                    return;
                }
                setUiStateSafe('DISABLED');
                setDisabledMessage('Session expired. Please login again.');
                return;
            }

            if (event.code !== 1000) {
                setUiStateSafe('RECONNECTABLE');
            }
        };
    }, [appendIncomingMessage, applyPartnerName, applyPartnerNameFromChatMessages, bookingId, handleChatDisabled, markRead, setUiStateSafe]);

    const initialize = useCallback(async () => {
        if (!bookingId) {
            setUiStateSafe('LOCKED');
            setDisabledMessage('Chat unavailable for this booking.');
            setBootLoading(false);
            return;
        }

        setBootLoading(true);

        try {
            const resolvedUserId = await bookingChatService.getCurrentUserId();
            if (resolvedUserId) currentUserIdRef.current = resolvedUserId;

            const sessions = await bookingChatService.getSessions();
            const activeSession = sessions.find((session) => session.bookingId === bookingId);

            if (!activeSession || !activeSession.canChat || (activeSession.bookingStatus !== 'confirmed' && activeSession.bookingStatus !== 'in_progress')) {
                setUiStateSafe('LOCKED');
                setDisabledMessage('Chat is unavailable for this booking status.');
                setBootLoading(false);
                return;
            }

            const sessionPartnerName = getMeaningfulName(activeSession.otherUserName);
            if (sessionPartnerName) {
                applyPartnerName(sessionPartnerName);
            }

            const history = await bookingChatService.getHistory(bookingId);
            const mapped = history.map((msg) => mapToUiMessage(msg));
            setMessages(mapped);
            applyPartnerNameFromChatMessages(history);

            await markRead();

            await connectSocket();
        } catch {
            setUiStateSafe('RECONNECTABLE');
            showErrorToast('Unable to open chat right now.');
        } finally {
            if (mountedRef.current) {
                setBootLoading(false);
            }
        }
    }, [applyPartnerName, applyPartnerNameFromChatMessages, bookingId, connectSocket, markRead, setUiStateSafe]);

    useEffect(() => {
        mountedRef.current = true;
        initialize().catch(() => { });

        return () => {
            mountedRef.current = false;
            closeSocket();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    useFocusEffect(
        useCallback(() => {
            isFocusedRef.current = true;
            markRead().catch(() => { });
            return () => {
                isFocusedRef.current = false;
            };
        }, [markRead]),
    );

    const handleSend = useCallback(() => {
        const payload = draft.trim();
        if (!payload || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || uiState !== 'ACTIVE') {
            return;
        }

        const optimisticMsg: UiMessage = {
            id: `optimistic-${Date.now()}`,
            senderId: String(currentUserIdRef.current),
            text: payload,
            timestamp: new Date().toISOString(),
        };

        setDraft('');
        setMessages((prev) => [...prev, optimisticMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 30);

        try {
            wsRef.current.send(JSON.stringify({ type: 'message', content: payload }));
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            showErrorToast('Message failed to send.');
        }
    }, [draft, uiState]);

    const statusText = useMemo(() => {
        if (uiState === 'CONNECTING') return 'Connecting...';
        if (uiState === 'ACTIVE') return 'Online';
        if (uiState === 'DISABLED') return 'Chat disabled';
        if (uiState === 'RECONNECTABLE') return 'Connection lost';
        return 'Unavailable';
    }, [uiState]);

    const showDisabledCta = uiState === 'DISABLED' || uiState === 'LOCKED';

    return (
        <SafeAreaView className="flex-1 bg-transparent" edges={['top', 'left', 'right']}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                    backgroundColor: 'transparent',
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.sm,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
                </TouchableOpacity>

                <View
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: mutedColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: accentBorderColor,
                    }}
                >
                    <Ionicons name="person" size={16} color={accentColor} />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                        {partnerName}
                    </Text>
                    <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginTop: 1 }}>
                        {statusText}
                    </Text>
                </View>

                {uiState === 'RECONNECTABLE' && (
                    <TouchableOpacity
                        onPress={() => {
                            connectSocket().catch(() => { });
                            showInfoToast('Trying to reconnect...');
                        }}
                        activeOpacity={0.8}
                        style={{
                            paddingHorizontal: 10,
                            height: 30,
                            borderRadius: radius.full,
                            borderWidth: 1,
                            borderColor: colors.surfaceBorder,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: '600' }}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {bootLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color={accentColor} />
                    </View>
                ) : (
                    <>
                        <ImageBackground
                            source={chatBgImage}
                            style={{ flex: 1 }}
                            resizeMode="cover"
                        >
                            <BlurView intensity={0} style={{ flex: 1 }}>
                                <FlatList
                                    ref={flatListRef}
                                    data={messages}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => <MessageBubble item={item} currentUserId={currentUserIdRef.current} />}
                                    contentContainerStyle={{
                                        paddingVertical: 14,
                                        paddingBottom: 10,
                                        flexGrow: messages.length === 0 ? 1 : 0,
                                    }}
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={(
                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                                            <Ionicons name="chatbubbles-outline" size={32} color={colors.textSubtle} />
                                            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 10, textAlign: 'center' }}>
                                                This booking chat is now open.
                                            </Text>
                                        </View>
                                    )}
                                />
                            </BlurView>
                        </ImageBackground>

                        {showDisabledCta && (
                            <View
                                style={{
                                    marginHorizontal: 14,
                                    marginBottom: 10,
                                    padding: 12,
                                    borderRadius: radius.md,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1,
                                    borderColor: colors.surfaceBorder,
                                }}
                            >
                                <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, lineHeight: 18 }}>
                                    {disabledMessage || CHAT_DISABLED_TEXT}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.replace(bookingsRoute as never)}
                                    activeOpacity={0.8}
                                    style={{
                                        alignSelf: 'flex-start',
                                        marginTop: 10,
                                        paddingHorizontal: 12,
                                        height: 34,
                                        borderRadius: radius.full,
                                        backgroundColor: accentColor,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ color: colors.white, fontSize: fontSize.badge, fontWeight: '700' }}>
                                        Book new session
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.white }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'flex-end',
                                    gap: 10,
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderTopWidth: 1,
                                    borderTopColor: colors.surfaceBorder,
                                }}
                            >
                                <TextInput
                                    value={draft}
                                    onChangeText={setDraft}
                                    placeholder={showDisabledCta ? 'Chat unavailable' : 'Type a message'}
                                    placeholderTextColor={colors.textSubtle}
                                    multiline
                                    editable={!showDisabledCta && uiState !== 'CONNECTING'}
                                    style={{
                                        flex: 1,
                                        minHeight: 40,
                                        maxHeight: 120,
                                        backgroundColor: colors.surface,
                                        borderRadius: radius.icon,
                                        paddingHorizontal: 14,
                                        paddingTop: Platform.OS === 'ios' ? 10 : 8,
                                        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                                        fontSize: fontSize.body,
                                        color: colors.textPrimary,
                                        borderWidth: 1,
                                        borderColor: colors.surfaceBorder,
                                    }}
                                    onSubmitEditing={() => {
                                        if (canSend) handleSend();
                                    }}
                                    returnKeyType="send"
                                    blurOnSubmit={false}
                                />
                                <TouchableOpacity
                                    onPress={handleSend}
                                    disabled={!canSend}
                                    activeOpacity={0.8}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: sendButtonColor,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name="send" size={16} color={canSend ? colors.white : colors.textSubtle} />
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
