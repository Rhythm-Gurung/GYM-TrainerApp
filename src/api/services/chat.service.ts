import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';

export type ChatRole = 'client' | 'trainer';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

const CONTEXT_LIMIT = 5;

export async function sendChatMessage(
    userRole: ChatRole,
    message: string,
    history: ChatMessage[],
): Promise<string> {
    const { CHAT } = API_CONFIG.ENDPOINTS;
    const trimmed = message.trim();
    if (!trimmed) throw new Error('Message cannot be empty.');

    const historyPayload = history
        .slice(-CONTEXT_LIMIT)
        .map(({ role, content }) => ({ role, content }));

    const isTrainer = userRole === 'trainer';

    if (historyPayload.length > 0) {
        const endpoint = isTrainer ? CHAT.TRAINER_HISTORY : CHAT.CLIENT_HISTORY;
        const { data } = await apiClient.post(endpoint, {
            message: trimmed,
            conversation_history: historyPayload,
        });
        if (!data?.status) throw new Error(data?.error ?? 'AI response unavailable');
        return (data.response ?? data.message ?? '').trim() || 'Let me know how else I can help!';
    }

    const endpoint = isTrainer ? CHAT.TRAINER_SIMPLE : CHAT.CLIENT_SIMPLE;
    const { data } = await apiClient.post(endpoint, { message: trimmed });
    if (!data?.status) throw new Error(data?.error ?? 'AI response unavailable');
    return (data.response ?? '').trim() || 'Let me know how else I can help!';
}
