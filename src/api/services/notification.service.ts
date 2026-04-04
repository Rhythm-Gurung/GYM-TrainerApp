import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';
import type { AppNotification } from '@/types/clientTypes';

export type NotificationType = AppNotification['type'];

interface ApiNotification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    isRead?: boolean;
    is_read?: boolean;
    createdAt?: string;
    created_at?: string;
    data?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
    count?: number;
    next?: string | null;
    previous?: string | null;
    results?: T[];
}

function normalizeApiDateTime(value: string): string {
    const v = value.trim();
    if (v.length === 0) return new Date().toISOString();

    // Date-only (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00Z`;

    // If it already has timezone info (Z or ±hh:mm/±hhmm), leave as-is.
    if (/(Z|[+-]\d{2}:?\d{2})$/i.test(v)) return v;

    // Common backend format: "YYYY-MM-DD HH:mm:ss" (assume UTC)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v)) {
        return `${v.replace(' ', 'T')}Z`;
    }

    // ISO-ish without timezone: append Z (assume UTC)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return `${v}Z`;

    return v;
}

function mapApiNotification(n: ApiNotification): AppNotification {
    const isRead = n.is_read ?? n.isRead ?? false;
    const createdAtRaw = n.created_at ?? n.createdAt ?? new Date().toISOString();
    const createdAt = normalizeApiDateTime(String(createdAtRaw));
    return {
        id: String(n.id),
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: Boolean(isRead),
        createdAt,
        data: n.data,
    };
}

export const notificationService = {
    /**
     * List notifications for the authenticated user.
     * GET /api/notifications/
     * Supports filters like: ?is_read=false, ?type=booking
     */
    getNotifications: async (params?: { is_read?: boolean; type?: NotificationType }): Promise<AppNotification[]> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST, { params });
        const raw = (data?.data ?? data) as PaginatedResponse<ApiNotification> | ApiNotification[];

        const results = Array.isArray(raw)
            ? raw
            : (raw.results ?? []);

        return results.map(mapApiNotification);
    },

    /**
     * Mark a notification as read.
     * PATCH /api/notifications/{id}/
     */
    markRead: async (id: string | number): Promise<void> => {
        const url = `${API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST}${id}/`;
        try {
            await apiClient.patch(url, { is_read: true });
        } catch {
            try {
                await apiClient.patch(url, { isRead: true });
            } catch (err) {
                console.warn('[notification] markRead failed:', err);
                throw err;
            }
        }
    },

    /**
     * Convenience no-body mark read.
     * POST /api/notifications/{id}/read/
     */
    markReadNoBody: async (id: string | number): Promise<void> => {
        await apiClient.post(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST}${id}/read/`);
    },

    /**
     * Mark all notifications as read for the authenticated user.
     * POST /api/notifications/mark-all-read/
     */
    markAllRead: async (): Promise<void> => {
        await apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },

    /**
     * Fetch notification stats (badge count).
     * GET /api/notifications/stats/ → { unread_count }
     */
    getStats: async (): Promise<{ unreadCount: number }> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.STATS);
        const raw = (data?.data ?? data) as Record<string, unknown>;
        const val = raw.unread_count ?? raw.unreadCount ?? 0;
        const unreadCount = typeof val === 'number' ? val : Number(val ?? 0);
        return { unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0 };
    },
};
