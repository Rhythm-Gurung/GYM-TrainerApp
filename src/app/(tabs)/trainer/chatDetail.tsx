import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ChatMessage } from '@/api/services/chat.service';
import { sendChatMessage } from '@/api/services/chat.service';
import { colors, fontSize, radius, shadow } from '@/constants/theme';

const AI_NAME = 'SETu AI';

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function TypingIndicator() {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: colors.surface,
                borderRadius: radius.card,
                borderTopLeftRadius: 4,
                alignSelf: 'flex-start',
                marginLeft: 12,
                marginBottom: 8,
            }}
        >
            {[0, 1, 2].map((i) => (
                <View
                    key={i}
                    style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.trainerPrimary, opacity: 0.6 }}
                />
            ))}
        </View>
    );
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    return (
        <View
            style={{
                alignItems: isUser ? 'flex-end' : 'flex-start',
                marginBottom: 6,
                paddingHorizontal: 12,
            }}
        >
            {!isUser && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3, marginLeft: 4 }}>
                    <Ionicons name="sparkles" size={11} color={colors.trainerPrimary} />
                    <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: colors.trainerPrimary }}>
                        {AI_NAME}
                    </Text>
                </View>
            )}
            <View
                style={{
                    maxWidth: '78%',
                    backgroundColor: isUser ? colors.trainerPrimary : colors.trainerSurface,
                    borderRadius: radius.card,
                    borderTopRightRadius: isUser ? 4 : radius.card,
                    borderTopLeftRadius: isUser ? radius.card : 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: isUser ? 0 : 1,
                    borderColor: isUser ? 'transparent' : colors.trainerBorder,
                    ...(isUser ? shadow.trainer : {}),
                }}
            >
                <Text style={{ fontSize: fontSize.body, color: isUser ? colors.white : colors.textPrimary, lineHeight: 20 }}>
                    {message.content}
                </Text>
            </View>
            <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginTop: 3, marginHorizontal: 4 }}>
                {formatTime(message.createdAt)}
            </Text>
        </View>
    );
}

export default function TrainerChatDetail() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const trimmedInput = inputText.trim();
    const canSend = trimmedInput.length > 0 && !isSending;
    const flatListRef = useRef<FlatList<ChatMessage>>(null);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
        }
    }, [messages.length]);

    const handleSend = useCallback(async () => {
        const text = trimmedInput;
        if (!text || isSending) return;

        setInputText('');
        setIsSending(true);

        const now = new Date().toISOString();
        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            createdAt: now,
        };
        setMessages((prev) => [...prev, userMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

        try {
            const response = await sendChatMessage('trainer', text, [...messages, userMsg]);
            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: response,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        } finally {
            setIsSending(false);
        }
    }, [isSending, messages, trimmedInput]);

    const emptyComponent = (
        <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 8 }}>
            <View
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.trainerMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.trainerBorder,
                }}
            >
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.trainerPrimary} />
            </View>
            <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                Start the conversation
            </Text>
            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
                Ask SETu AI for evidence-based advice on client goals, programming, and more.
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                    backgroundColor: colors.white,
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
                        backgroundColor: colors.trainerMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.trainerBorder,
                    }}
                >
                    <Ionicons name="sparkles" size={16} color={colors.trainerPrimary} />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.textPrimary }}>
                        {AI_NAME}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
                        <Ionicons name="sparkles" size={10} color={colors.trainerPrimary} />
                        <Text style={{ fontSize: fontSize.caption, color: colors.trainerPrimary, fontWeight: '600' }}>
                            Powered by Gemini
                        </Text>
                    </View>
                </View>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(m) => m.id}
                    renderItem={({ item }) => <MessageBubble message={item} />}
                    contentContainerStyle={{ paddingVertical: 16, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={emptyComponent}
                />

                {isSending && <TypingIndicator />}

                {/* Input bar */}
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
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Ask SETu AI..."
                            placeholderTextColor={colors.textSubtle}
                            multiline
                            editable={!isSending}
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
                            onSubmitEditing={() => { if (canSend) handleSend(); }}
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
                                backgroundColor: canSend ? colors.trainerPrimary : colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...(canSend ? shadow.trainer : {}),
                            }}
                        >
                            <Ionicons
                                name="send"
                                size={16}
                                color={canSend ? colors.white : colors.textSubtle}
                            />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
