import { API_CONFIG } from '@/constants/config';

export function resolveImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_CONFIG.BASE_URL}${url}`;
}
