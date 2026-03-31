import { useCallback, useEffect, useRef } from 'react';

import { API_CONFIG } from '@/constants/config';
import { chatEvents } from '@/lib/chatEvents';

import { bookingChatService } from '../services/bookingChat.service';

// ─── helpers ────────────────────────────────────────────────────────────────

function buildBadgeWsUrl(token: string): string {
    const base = (API_CONFIG.WS_BASE_URL ?? API_CONFIG.BASE_URL) ?? '';
    let wsBase = base.replace(/\/$/, '');

    if (wsBase.startsWith('https://')) {
        wsBase = wsBase.replace('https://', 'wss://');
    } else if (wsBase.startsWith('http://')) {
        wsBase = wsBase.replace('http://', 'ws://');
    } else if (!wsBase.startsWith('ws')) {
        wsBase = `ws://${wsBase}`;
    }

    return `${wsBase}/ws/badge/?token=${encodeURIComponent(token)}`;
}

function toFiniteNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && Number.isFinite(Number(value))) return Number(value);
    return 0;
}

function toBookingIdString(value: unknown): string {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
}

// ─── hook ───────────────────────────────────────────────────────────────────

const RECONNECT_DELAY_MS = 5_000;

/**
 * Opens a persistent WebSocket to ws/badge/ and forwards every
 * `unread_update` event from the server into `chatEvents`.
 *
 * Expected server payload:
 * {
 *   "type": "unread_update",
 *   "total_unread": 5,
 *   "sessions": [
 *     { "booking_id": 3, "unread_count": 3 },
 *     { "booking_id": 7, "unread_count": 2 }
 *   ]
 * }
 *
 * Mount once in each role's _layout.tsx so the connection lives for as long
 * as the tab navigator is mounted, independent of which screen is focused.
 */
export function useBadgeWebSocket(): void {
    const wsRef = useRef<WebSocket | null>(null);
    const mountedRef = useRef(true);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retriedTokenRef = useRef(false);

    // Holds the latest `connect` reference so closures inside socket handlers
    // can call it without capturing a stale or pre-declaration reference.
    const connectRef = useRef<(() => Promise<void>) | null>(null);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current !== null) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const connect = useCallback(async () => {
        if (!mountedRef.current) return;
        clearReconnectTimer();

        // Close any existing socket before opening a new one
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const token = await bookingChatService.getAccessToken();
        if (!token || !mountedRef.current) return;

        const socket = new WebSocket(buildBadgeWsUrl(token));
        wsRef.current = socket;

        socket.onmessage = (event) => {
            if (!mountedRef.current) return;

            let payload: unknown;
            try {
                payload = JSON.parse(event.data as string);
            } catch {
                return;
            }

            const body = (payload ?? {}) as Record<string, unknown>;
            if (body.type !== 'unread_update') return;

            const sessions = Array.isArray(body.sessions) ? body.sessions : [];
            sessions.forEach((raw) => {
                const s = (raw ?? {}) as Record<string, unknown>;
                const bookingId = toBookingIdString(s.booking_id ?? s.bookingId);
                if (bookingId) {
                    const unreadCount = toFiniteNumber(s.unread_count ?? s.unreadCount);
                    chatEvents.emit('unread_update', { bookingId, unreadCount });
                }
            });
        };

        socket.onclose = async (event) => {
            if (!mountedRef.current) return;
            if (wsRef.current !== socket) return;
            wsRef.current = null;

            // Normal close — don't reconnect
            if (event.code === 1000) return;

            const isAuthFailure = event.code === 4001 || event.code === 4401;
            if (isAuthFailure && !retriedTokenRef.current) {
                retriedTokenRef.current = true;
                const refreshed = await bookingChatService.refreshAccessToken();
                if (refreshed && mountedRef.current) {
                    connectRef.current?.().catch(() => {});
                    return;
                }
                // Refresh failed — stop reconnecting
                return;
            }

            // Any other close: reconnect after a short delay
            reconnectTimerRef.current = setTimeout(() => {
                retriedTokenRef.current = false;
                connectRef.current?.().catch(() => {});
            }, RECONNECT_DELAY_MS);
        };

        socket.onerror = () => {
            // onclose fires after onerror and handles reconnect
        };
    }, [clearReconnectTimer]);

    // Keep connectRef in sync so socket.onclose can always call the latest version
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        mountedRef.current = true;
        retriedTokenRef.current = false;
        connect().catch(() => {});

        return () => {
            mountedRef.current = false;
            clearReconnectTimer();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect, clearReconnectTimer]);
}
