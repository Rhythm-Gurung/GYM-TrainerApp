type ChatEventMap = {
    unread_update: { bookingId: string; unreadCount: number };
};

type Listener<K extends keyof ChatEventMap> = (data: ChatEventMap[K]) => void;

const listeners: Partial<{ [K in keyof ChatEventMap]: Set<Listener<K>> }> = {};

export const chatEvents = {
    on<K extends keyof ChatEventMap>(event: K, handler: Listener<K>): () => void {
        if (!listeners[event]) {
            (listeners as Record<K, Set<Listener<K>>>)[event] = new Set();
        }
        (listeners[event] as Set<Listener<K>>).add(handler);
        return () => (listeners[event] as Set<Listener<K>>).delete(handler);
    },

    emit<K extends keyof ChatEventMap>(event: K, data: ChatEventMap[K]): void {
        (listeners[event] as Set<Listener<K>> | undefined)?.forEach((fn) => fn(data));
    },
};
