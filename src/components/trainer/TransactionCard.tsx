import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { Transaction } from '@/types/trainerTypes';

// ─── Maps ─────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<Transaction['type'], keyof typeof Ionicons.glyphMap> = {
    credit: 'arrow-down-outline', // incoming money
    debit: 'arrow-up-outline', // outgoing money
};

const TYPE_ICON_COLOR: Record<Transaction['type'], string> = {
    credit: colors.success,
    debit: colors.error,
};

const TYPE_ICON_BG: Record<Transaction['type'], string> = {
    credit: colors.statusNewBg, // green-100
    debit: colors.errorBg, // red tint
};

const TYPE_AMOUNT_COLOR: Record<Transaction['type'], string> = {
    credit: colors.success,
    debit: colors.error,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function formatAmount(transaction: Transaction): string {
    const abs = Math.abs(transaction.amount).toLocaleString('en-IN');
    return transaction.type === 'credit' ? `+₹${abs}` : `₹${abs}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TransactionCardProps {
    transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                backgroundColor: colors.white,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                marginBottom: 8,
                ...shadow.cardSubtle,
            }}
        >
            {/* Type icon */}
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.sm,
                    backgroundColor: TYPE_ICON_BG[transaction.type],
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Ionicons
                    name={TYPE_ICON[transaction.type]}
                    size={18}
                    color={TYPE_ICON_COLOR[transaction.type]}
                />
            </View>

            {/* Description + date */}
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary }}>
                    {transaction.description}
                </Text>
                <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle, marginTop: 2, fontWeight: '500' }}>
                    {formatDate(transaction.date)}
                </Text>
            </View>

            {/* Amount */}
            <Text
                style={{
                    fontSize: fontSize.body,
                    fontWeight: '700',
                    color: TYPE_AMOUNT_COLOR[transaction.type],
                    flexShrink: 0,
                }}
            >
                {formatAmount(transaction)}
            </Text>
        </View>
    );
}
