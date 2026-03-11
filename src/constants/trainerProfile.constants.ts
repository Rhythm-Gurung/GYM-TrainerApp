import type { User } from '@/types/authTypes';

export const TRAINER_PROFILE_FIELDS: (keyof User)[] = [
    'email', 'username', 'full_name', 'profile_image',
    'bio', 'contact_no', 'years_of_experience', 'expertise_categories',
    'pricing_per_session', 'session_type',
];

export function computeProfileCompletion(user: User | null): number {
    if (!user) return 0;
    // Prefer the backend-computed value (includes verification weight)
    if (user.profile_completion != null) return user.profile_completion;
    // Fallback: compute locally from field presence (offline / cached)
    const filled = TRAINER_PROFILE_FIELDS.filter((f) => {
        const val = user[f];
        return val !== undefined && val !== null && val !== '';
    }).length;
    return Math.round((filled / TRAINER_PROFILE_FIELDS.length) * 100);
}
