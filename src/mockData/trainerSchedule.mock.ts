import {
    DAYS_OF_WEEK,
    DEFAULT_AFTERNOON_SLOT,
    DEFAULT_MORNING_SLOT,
} from '@/constants/trainerSchedule.constants';
import type { DaySchedule } from '@/types/trainerTypes';

// Mon–Fri enabled with two slots each; weekends off by default
export function createDefaultSchedule(): DaySchedule[] {
    return DAYS_OF_WEEK.map((_, i) => {
        const isWeekday = i >= 1 && i <= 5;
        return {
            dayOfWeek: i,
            enabled: isWeekday,
            slots: isWeekday
                ? [
                      { id: `${i}-1`, ...DEFAULT_MORNING_SLOT },
                      { id: `${i}-2`, ...DEFAULT_AFTERNOON_SLOT },
                  ]
                : [],
        };
    });
}

export const fetchMockSchedule = (): Promise<DaySchedule[]> =>
    new Promise((resolve) => {
        setTimeout(() => resolve(createDefaultSchedule()), 400);
    });

export const saveMockSchedule = (schedule: DaySchedule[]): Promise<void> =>
    new Promise((resolve) => {
        const delayMs = schedule.length >= 0 ? 600 : 600;
        setTimeout(resolve, delayMs);
    });
