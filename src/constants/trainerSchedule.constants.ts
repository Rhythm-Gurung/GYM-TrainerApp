export const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;

export type DayName = (typeof DAYS_OF_WEEK)[number];

// Default slot added when the user enables a day manually
export const DEFAULT_NEW_SLOT = { startTime: '09:00', endTime: '17:00' };

// Session mode display labels
export const SESSION_MODE_LABELS = {
    online: 'Online',
    offline: 'In-Person',
    both: 'Both',
} as const;

// Session mode colors (uses theme tokens conceptually; actual values resolved at render)
export const SESSION_MODE_ICONS = {
    online: 'videocam-outline',
    offline: 'location-outline',
    both: 'git-merge-outline',
} as const;

// Availability tab definitions
export const AVAILABILITY_TABS = [
    { key: 'daily' as const, label: 'Daily', icon: 'calendar-outline' },
    { key: 'saved' as const, label: 'Saved', icon: 'bookmark-outline' },
    { key: 'monthly' as const, label: 'Monthly', icon: 'grid-outline' },
];

// Short day labels for monthly calendar
export const SHORT_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
