export function parseLocalDateTime(date: string, time: string): Date | null {
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) return null;

    const timeParts = time.split(':').map((part) => Number(part));
    const [hours, minutes, seconds = 0] = timeParts;

    if (
        Number.isNaN(hours)
        || Number.isNaN(minutes)
        || Number.isNaN(seconds)
        || hours < 0
        || hours > 23
        || minutes < 0
        || minutes > 59
        || seconds < 0
        || seconds > 59
    ) {
        return null;
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);

    return new Date(year, month - 1, day, hours, minutes, seconds, 0);
}

export function hasSessionEnded(date: string, endTime: string, now: Date = new Date()): boolean {
    const end = parseLocalDateTime(date, endTime);
    if (!end) return false;
    return end.getTime() <= now.getTime();
}

export function isStalePreConfirmationBooking(
    status: string,
    date: string,
    endTime: string,
    now: Date = new Date(),
): boolean {
    if (status !== 'pending' && status !== 'accepted') return false;
    return hasSessionEnded(date, endTime, now);
}
