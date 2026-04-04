import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';

export type ChatRole = 'client' | 'trainer';

export interface BookingChatSession {
    bookingId: string;
    bookingStatus: string;
    otherUserId: string;
    otherUserName: string;
    otherUserRole: ChatRole;
    unreadCount: number;
    lastMessage: string;
    lastMessageAt: string;
    canChat: boolean;
}

export interface BookingChatMessage {
    id: string;
    bookingId: string;
    senderId: string;
    senderName: string;
    senderRole: ChatRole;
    content: string;
    timestamp: string;
    isRead: boolean;
}

interface PaginatedHistory {
    results?: unknown[];
    messages?: unknown[];
    data?: unknown[];
}

interface MarkReadResponse {
    marked_count?: unknown;
}

function asString(value: unknown, fallback = ''): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
    }
    return fallback;
}

function normalizeRole(value: unknown): ChatRole {
    return asString(value).toLowerCase() === 'trainer' ? 'trainer' : 'client';
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string {
    if (typeof value !== 'string') return '';
    const normalized = value.trim();
    return normalized;
}

function firstNonEmptyString(...values: unknown[]): string {
    return values
        .map((value) => asNonEmptyString(value))
        .find((value) => Boolean(value)) ?? '';
}

function joinFirstLastName(firstName: unknown, lastName: unknown): string {
    const first = asNonEmptyString(firstName);
    const last = asNonEmptyString(lastName);
    if (first && last) return `${first} ${last}`;
    return first || last;
}

function resolveSessionOtherUserName(item: Record<string, unknown>): string {
    const otherUser = asRecord(item.other_user);
    const partner = asRecord(item.partner);
    const counterpart = asRecord(item.counterpart);

    const preferredUsername = firstNonEmptyString(
        item.other_user_username,
        item.partner_username,
        item.counterpart_username,
        otherUser?.username,
        partner?.username,
        counterpart?.username,
    );
    if (preferredUsername) return preferredUsername;

    const firstLastName = firstNonEmptyString(
        joinFirstLastName(item.other_user_first_name, item.other_user_last_name),
        joinFirstLastName(item.partner_first_name, item.partner_last_name),
        joinFirstLastName(item.counterpart_first_name, item.counterpart_last_name),
        joinFirstLastName(otherUser?.first_name, otherUser?.last_name),
        joinFirstLastName(partner?.first_name, partner?.last_name),
        joinFirstLastName(counterpart?.first_name, counterpart?.last_name),
        item.other_user_full_name,
        item.partner_full_name,
        item.counterpart_full_name,
        otherUser?.full_name,
        partner?.full_name,
        counterpart?.full_name,
        item.other_user_name,
        item.partner_name,
        item.counterpart_name,
    );
    if (firstLastName) return firstLastName;

    return firstNonEmptyString(
        item.other_user_email,
        item.partner_email,
        item.counterpart_email,
        otherUser?.email,
        partner?.email,
        counterpart?.email,
        'User',
    );
}

function resolveSenderName(item: Record<string, unknown>): string {
    const sender = asRecord(item.sender);
    const user = asRecord(item.user);
    const author = asRecord(item.author);

    const preferredUsername = firstNonEmptyString(
        item.sender_username,
        item.user_username,
        item.author_username,
        sender?.username,
        user?.username,
        author?.username,
    );
    if (preferredUsername) return preferredUsername;

    const firstLastName = firstNonEmptyString(
        joinFirstLastName(item.sender_first_name, item.sender_last_name),
        joinFirstLastName(item.user_first_name, item.user_last_name),
        joinFirstLastName(item.author_first_name, item.author_last_name),
        joinFirstLastName(sender?.first_name, sender?.last_name),
        joinFirstLastName(user?.first_name, user?.last_name),
        joinFirstLastName(author?.first_name, author?.last_name),
        item.sender_full_name,
        item.user_full_name,
        item.author_full_name,
        sender?.full_name,
        user?.full_name,
        author?.full_name,
        item.sender_name,
        item.user_name,
        item.author_name,
        sender?.name,
        user?.name,
        author?.name,
    );
    if (firstLastName) return firstLastName;

    return firstNonEmptyString(
        item.sender_email,
        item.user_email,
        item.author_email,
        sender?.email,
        user?.email,
        author?.email,
        'User',
    );
}

function normalizeSession(raw: unknown): BookingChatSession {
    const item = (raw ?? {}) as Record<string, unknown>;
    const bookingId = asString(item.booking_id ?? item.bookingId ?? item.id);
    const bookingStatus = asString(item.booking_status ?? item.status, 'pending').toLowerCase();

    return {
        bookingId,
        bookingStatus,
        otherUserId: asString(item.other_user_id ?? item.partner_id ?? item.counterpart_id),
        otherUserName: resolveSessionOtherUserName(item),
        otherUserRole: normalizeRole(item.other_user_role ?? item.partner_role ?? item.counterpart_role),
        unreadCount: asNumber(item.unread_count, 0),
        lastMessage: asString(item.last_message ?? item.message_preview),
        lastMessageAt: asString(item.last_message_at ?? item.updated_at ?? item.timestamp),
        canChat: asBoolean(item.can_chat, bookingStatus === 'confirmed' || bookingStatus === 'in_progress'),
    };
}

function normalizeMessage(raw: unknown, bookingId: string): BookingChatMessage {
    const item = (raw ?? {}) as Record<string, unknown>;
    const sender = asRecord(item.sender);
    const senderObjectId = sender?.id;

    return {
        id: asString(item.id ?? item.message_id ?? `${Date.now()}-${Math.random()}`),
        bookingId: asString(item.booking_id ?? bookingId, bookingId),
        senderId: asString(item.sender_id ?? senderObjectId ?? item.user_id ?? item.author_id),
        senderName: resolveSenderName(item),
        senderRole: normalizeRole(item.sender_role ?? item.role),
        content: asString(item.content ?? item.message ?? item.text),
        timestamp: asString(item.timestamp ?? item.created_at ?? item.sent_at, new Date().toISOString()),
        isRead: asBoolean(item.is_read ?? item.read, false),
    };
}

function toArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    const objectPayload = (payload ?? {}) as PaginatedHistory;
    if (Array.isArray(objectPayload.results)) return objectPayload.results;
    if (Array.isArray(objectPayload.messages)) return objectPayload.messages;
    if (Array.isArray(objectPayload.data)) return objectPayload.data;
    return [];
}

function sortByTimestamp(messages: BookingChatMessage[]): BookingChatMessage[] {
    return [...messages].sort((a, b) => (
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ));
}

function ensureWsBaseUrl(): string {
    if (API_CONFIG.WS_BASE_URL) return API_CONFIG.WS_BASE_URL;

    const base = API_CONFIG.BASE_URL;
    if (!base) return 'ws://127.0.0.1:8000';

    if (base.startsWith('https://')) return base.replace(/^https:\/\//, 'wss://');
    if (base.startsWith('http://')) return base.replace(/^http:\/\//, 'ws://');
    return `ws://${base.replace(/^\/+/, '')}`;
}

export function buildBookingChatWebSocketUrl(bookingId: string, token: string): string {
    const wsBase = ensureWsBaseUrl().replace(/\/$/, '');
    return `${wsBase}/ws/chat/${encodeURIComponent(bookingId)}/?token=${encodeURIComponent(token)}`;
}

async function getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem('access_token');
}

async function getCurrentUserId(): Promise<string> {
    try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) return '';
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return asString(parsed?.id);
    } catch {
        return '';
    }
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
        const response = await axios.post(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOKEN.REFRESH}`,
            { refresh: refreshToken },
        );
        const nextAccess = asString((response.data as Record<string, unknown>)?.access);
        if (!nextAccess) return null;
        await AsyncStorage.setItem('access_token', nextAccess);
        return nextAccess;
    } catch {
        return null;
    }
}

export const bookingChatService = {
    async getSessions(): Promise<BookingChatSession[]> {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.CHAT.SESSIONS);
        return toArray(data).map(normalizeSession);
    },

    async getHistory(bookingId: string): Promise<BookingChatMessage[]> {
        const { data } = await apiClient.get(`${API_CONFIG.ENDPOINTS.CHAT.HISTORY}${bookingId}/`);
        const mapped = toArray(data).map((raw) => normalizeMessage(raw, bookingId));
        return sortByTimestamp(mapped);
    },

    async markAsRead(bookingId: string, messageIds?: number[]): Promise<number> {
        const body = messageIds && messageIds.length > 0 ? { message_ids: messageIds } : {};
        const { data } = await apiClient.post<MarkReadResponse>(
            `${API_CONFIG.ENDPOINTS.CHAT.READ}${bookingId}/`,
            body,
        );
        return asNumber(data?.marked_count, 0);
    },

    getAccessToken,
    refreshAccessToken,
    getCurrentUserId,
};
