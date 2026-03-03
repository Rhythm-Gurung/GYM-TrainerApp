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

// Default time slots for Mon–Fri when a day is first enabled
export const DEFAULT_MORNING_SLOT = { startTime: '09:00', endTime: '12:00' };
export const DEFAULT_AFTERNOON_SLOT = { startTime: '14:00', endTime: '18:00' };

// Default slot added when the user enables a day manually
export const DEFAULT_NEW_SLOT = { startTime: '09:00', endTime: '17:00' };
