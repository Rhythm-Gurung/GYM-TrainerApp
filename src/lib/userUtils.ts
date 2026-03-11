import type { User } from '@/types/authTypes';

export function getInitials(user: User | null): string {
    const name = user?.full_name ?? user?.username ?? user?.email ?? '';
    return name
        .split(' ')
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}
