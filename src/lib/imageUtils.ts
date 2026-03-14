import { API_CONFIG } from '@/constants/config';

export function resolveImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;

    if (url.startsWith('http')) {
        try {
            const parsedUrl = new URL(url);
            const apiBase = API_CONFIG.BASE_URL;

            if (apiBase && (parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost')) {
                const parsedBase = new URL(apiBase);
                parsedUrl.protocol = parsedBase.protocol;
                parsedUrl.host = parsedBase.host;
            }

            return parsedUrl.toString();
        } catch {
            return url;
        }
    }

    return `${API_CONFIG.BASE_URL}${url}`;
}
