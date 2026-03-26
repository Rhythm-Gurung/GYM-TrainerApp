import { Text, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';
import type { ApiAvailableSlot, BookingSessionMode, Trainer } from '@/types/clientTypes';

import { SummaryRow } from './SummaryRow';

export function BookingSummarySection({
    isReady,
    trainer,
    selectedDates,
    isPerDateMode,
    slotPerDate,
    selectedSlot,
    effectiveMode,
    formatDateSummary,
}: {
    isReady: boolean;
    trainer: Trainer;
    selectedDates: Set<string>;
    isPerDateMode: boolean;
    slotPerDate: Map<string, ApiAvailableSlot>;
    selectedSlot: ApiAvailableSlot | null;
    effectiveMode: BookingSessionMode;
    formatDateSummary: (dateStr: string) => string;
}) {
    if (!isReady) return null;

    return (
        <View
            style={{
                backgroundColor: colors.primarySurface,
                borderRadius: radius.card,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.primaryBorder,
                gap: 10,
            }}
        >
            <Text
                style={{
                    fontSize: fontSize.body,
                    fontWeight: '700',
                    color: colors.textPrimary,
                }}
            >
                Booking Summary
            </Text>

            <SummaryRow label="Trainer" value={trainer.name} />
            {selectedDates.size === 1 ? (
                <SummaryRow
                    label="Date"
                    value={formatDateSummary(Array.from(selectedDates)[0]!)}
                />
            ) : (
                <SummaryRow
                    label="Dates"
                    value={Array.from(selectedDates)
                        .sort()
                        .map((d) => formatDateSummary(d))
                        .join('\n')}
                />
            )}
            {isPerDateMode ? (
                Array.from(selectedDates).sort().map((date) => {
                    const s = slotPerDate.get(date);
                    return (
                        <SummaryRow
                            key={date}
                            label={formatDateSummary(date)}
                            value={s ? `${s.start_time} – ${s.end_time}` : '—'}
                        />
                    );
                })
            ) : (
                <SummaryRow
                    label="Time"
                    value={`${selectedSlot!.start_time} – ${selectedSlot!.end_time}`}
                />
            )}
            <SummaryRow
                label="Mode"
                value={effectiveMode === 'online' ? 'Online' : 'In-person'}
            />
            {selectedDates.size > 1 && (
                <SummaryRow
                    label="Sessions"
                    value={String(selectedDates.size)}
                />
            )}

            <View style={{ height: 1, backgroundColor: colors.primaryBorderSm }} />

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        fontSize: fontSize.body,
                        fontWeight: '700',
                        color: colors.textPrimary,
                    }}
                >
                    Total
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text
                        style={{
                            fontSize: fontSize.hero,
                            fontWeight: '800',
                            color: colors.primary,
                        }}
                    >
                        {`₹${(trainer.hourlyRate * selectedDates.size).toLocaleString()}`}
                    </Text>
                    {selectedDates.size > 1 && (
                        <Text
                            style={{
                                fontSize: fontSize.badge,
                                color: colors.textSubtle,
                            }}
                        >
                            {`₹${trainer.hourlyRate.toLocaleString()} × ${selectedDates.size}`}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}
