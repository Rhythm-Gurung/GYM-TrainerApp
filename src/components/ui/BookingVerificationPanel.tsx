import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import {
    useBookingSessionRequests,
    useCreateTrainerSessionRequest,
    useRespondSessionRequest,
} from '@/api/hooks/useSessionRequests';
import { colors, fontSize, radius } from '@/constants/theme';
import type { BookingStatus, SessionRequest, SessionRequestAction, SessionRequestStatus, SessionRequestType } from '@/types/clientTypes';

interface BookingVerificationPanelProps {
    bookingId: string;
    bookingDate: string;
    bookingStatus: BookingStatus;
    viewerRole: 'trainer' | 'client';
    trainerTheme?: boolean;
    focusRequestId?: string;
}

const STATUS_LABEL: Record<SessionRequestStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
};

function getStatusColor(status: SessionRequestStatus): string {
    if (status === 'accepted') return colors.success;
    if (status === 'rejected') return colors.error;
    return colors.textMuted;
}

function getRequestTypeLabel(type: SessionRequestType): string {
    return type === 'start' ? 'Start session' : 'End session';
}

function formatDateTime(value?: string): string {
    if (!value) return 'Now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Now';
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getRetryCutoff(bookingDate: string): Date {
    const date = new Date(bookingDate);
    if (Number.isNaN(date.getTime())) return new Date(0);
    date.setDate(date.getDate() + 1);
    date.setHours(12, 0, 0, 0);
    return date;
}

function formatCountdown(expiresAt?: string, nowMs = Date.now()): string {
    if (!expiresAt) return '--:--';
    const end = new Date(expiresAt).getTime();
    if (!Number.isFinite(end)) return '--:--';
    const delta = Math.max(0, end - nowMs);
    const totalSec = Math.floor(delta / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

function requestSort(a: SessionRequest, b: SessionRequest): number {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export default function BookingVerificationPanel({
    bookingId,
    bookingDate,
    bookingStatus,
    viewerRole,
    trainerTheme = false,
    focusRequestId,
}: BookingVerificationPanelProps) {
    const accent = trainerTheme ? colors.trainerPrimary : colors.primary;
    const muted = trainerTheme ? colors.trainerMuted : colors.primaryMuted;

    const { data, refetch, isFetching } = useBookingSessionRequests(bookingId);
    const { mutateAsync: createRequest } = useCreateTrainerSessionRequest();
    const { mutateAsync: respondRequest } = useRespondSessionRequest();

    const [nowMs, setNowMs] = useState(0);
    const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, SessionRequestStatus>>({});
    const seenExpiredRef = useRef<Record<string, true>>({});

    useEffect(() => {
        const tick = () => setNowMs(Date.now());
        const starter = setTimeout(tick, 0);
        const timer = setInterval(tick, 1000);
        return () => {
            clearTimeout(starter);
            clearInterval(timer);
        };
    }, []);

    const requests = useMemo(() => {
        const rows = [...(data ?? [])].sort(requestSort);
        return rows.map((item) => {
            const optimistic = optimisticStatuses[item.id];
            return optimistic ? { ...item, status: optimistic } : item;
        });
    }, [data, optimisticStatuses]);

    const pendingRequest = useMemo(
        () => requests.find((item) => item.status === 'pending'),
        [requests],
    );

    useEffect(() => {
        if (!pendingRequest?.expiresAt) return;
        const expiresAtMs = new Date(pendingRequest.expiresAt).getTime();
        if (!Number.isFinite(expiresAtMs)) return;
        if (nowMs < expiresAtMs) return;
        if (seenExpiredRef.current[pendingRequest.id]) return;

        seenExpiredRef.current[pendingRequest.id] = true;
        refetch().catch(() => { });
    }, [nowMs, pendingRequest, refetch]);

    // Refetch session requests on mount (ensures fresh data when DetailSheet opens)
    useEffect(() => {
        refetch().catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refetch when focusRequestId changes (triggered by notification navigation)
    const prevFocusRequestIdRef = useRef(focusRequestId);
    useEffect(() => {
        if (focusRequestId && focusRequestId !== prevFocusRequestIdRef.current) {
            prevFocusRequestIdRef.current = focusRequestId;
            refetch().catch(() => { });
        }
    }, [focusRequestId, refetch]);

    const startAttempts = requests.filter((item) => item.requestType === 'start').length;
    const endAttempts = requests.filter((item) => item.requestType === 'end').length;

    // Attempt number per request id (1-based, chronological order per type)
    const attemptNumbers = useMemo(() => {
        const byType: Record<string, SessionRequest[]> = {};
        [...requests]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .forEach((req) => {
                if (!byType[req.requestType]) byType[req.requestType] = [];
                byType[req.requestType].push(req);
            });
        const numbers: Record<string, number> = {};
        Object.values(byType).forEach((list) => list.forEach((req, i) => { numbers[req.id] = i + 1; }));
        return numbers;
    }, [requests]);
    const hasPendingStart = requests.some((item) => item.requestType === 'start' && item.status === 'pending');
    const hasPendingEnd = requests.some((item) => item.requestType === 'end' && item.status === 'pending');

    const retryCutoff = getRetryCutoff(bookingDate);
    const canRetry = nowMs <= retryCutoff.getTime();

    const onSendRequest = async (requestType: SessionRequestType) => {
        await createRequest({ bookingId, requestType });
        await refetch();
    };

    const onClientRespond = async (requestId: string, action: SessionRequestAction) => {
        setOptimisticStatuses((prev) => ({
            ...prev,
            [requestId]: action === 'accept' ? 'accepted' : 'rejected',
        }));
        try {
            await respondRequest({ bookingId, requestId, action });
            await refetch();
        } catch {
            setOptimisticStatuses((prev) => {
                const next = { ...prev };
                delete next[requestId];
                return next;
            });
        }
    };

    const startDisabledReason = (() => {
        if (bookingStatus !== 'confirmed') return 'Start is available only when booking is confirmed.';
        if (hasPendingStart) return 'A start verification request is already pending.';
        if (startAttempts >= 2) return 'Retry limit reached for start verification.';
        if (!canRetry) return 'Retry window closed after next-day noon cutoff.';
        return '';
    })();

    const endDisabledReason = (() => {
        if (bookingStatus !== 'in_progress') return 'End is available only when session is in progress.';
        if (hasPendingEnd) return 'An end verification request is already pending.';
        if (endAttempts >= 2) return 'Retry limit reached for end verification.';
        if (!canRetry) return 'Retry window closed after next-day noon cutoff.';
        return '';
    })();

    const showActionButton = viewerRole === 'trainer' && (bookingStatus === 'confirmed' || bookingStatus === 'in_progress');
    const showPendingCard = viewerRole === 'client' && pendingRequest && pendingRequest.requestedByRole === 'trainer';

    return (
        <View style={{ marginTop: 12, gap: 8 }}>
            {showPendingCard && (
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: accent,
                        borderRadius: radius.md,
                        backgroundColor: muted,
                        padding: 10,
                        gap: 8,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: accent }}>
                            {getRequestTypeLabel(pendingRequest.requestType)}
                            {' verification'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="time-outline" size={12} color={accent} />
                            <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: accent }}>
                                {formatCountdown(pendingRequest.expiresAt, nowMs)}
                            </Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: fontSize.caption, color: colors.textSecondary }}>
                        Expires at
                        {' '}
                        {formatDateTime(pendingRequest.expiresAt)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => onClientRespond(pendingRequest.id, 'accept')}
                            activeOpacity={0.8}
                            style={{
                                flex: 1,
                                height: 34,
                                borderRadius: radius.md,
                                backgroundColor: colors.successDark,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onClientRespond(pendingRequest.id, 'reject')}
                            activeOpacity={0.8}
                            style={{
                                flex: 1,
                                height: 34,
                                borderRadius: radius.md,
                                backgroundColor: colors.white,
                                borderWidth: 1,
                                borderColor: colors.error,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.error }}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {bookingStatus === 'confirmed' && (
                <>
                    {viewerRole === 'trainer' && (
                        <View
                            style={{
                                backgroundColor: colors.surfaceSubtle,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                borderRadius: radius.md,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                gap: 4,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                Start attempts:
                                {' '}
                                {startAttempts}
                                /2
                                {' • End attempts: '}
                                {endAttempts}
                                /2
                            </Text>
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                Retry deadline:
                                {' '}
                                {formatDateTime(retryCutoff.toISOString())}
                            </Text>
                        </View>
                    )}

                    {showActionButton && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={Boolean(startDisabledReason) || isFetching}
                            onPress={() => onSendRequest('start').catch(() => { })}
                            style={{
                                height: 36,
                                borderRadius: radius.md,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: startDisabledReason
                                    ? colors.textDisabled
                                    : accent,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                Start Session
                            </Text>
                        </TouchableOpacity>
                    )}

                    {viewerRole === 'trainer' && bookingStatus === 'confirmed' && Boolean(startDisabledReason) && (
                        <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>{startDisabledReason}</Text>
                    )}

                    <View style={{ gap: 6, marginTop: 2 }}>
                        <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.textSecondary }}>
                            Verification timeline
                        </Text>

                        {requests.length === 0 ? (
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>No verification requests yet.</Text>
                        ) : (
                            requests.map((item) => (
                                <View
                                    key={item.id}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: focusRequestId === item.id ? accent : colors.surfaceBorder,
                                        borderRadius: radius.md,
                                        backgroundColor: colors.white,
                                        paddingHorizontal: 10,
                                        paddingVertical: 8,
                                        gap: 3,
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.textPrimary }}>
                                        {getRequestTypeLabel(item.requestType)}
                                        {attemptNumbers[item.id] > 1 ? ' (Resend)' : ''}
                                        {' • '}
                                        {STATUS_LABEL[item.status]}
                                    </Text>
                                    <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                        {item.requestedByRole}
                                        {' • '}
                                        {formatDateTime(item.respondedAt ?? item.createdAt)}
                                    </Text>
                                    {item.reason ? (
                                        <Text style={{ fontSize: fontSize.caption, color: colors.textSecondary }}>
                                            Reason:
                                            {' '}
                                            {item.reason}
                                        </Text>
                                    ) : null}
                                </View>
                            ))
                        )}
                    </View>
                </>
            )}

            {/* End Session UI for in_progress bookings (trainer view) */}
            {bookingStatus === 'in_progress' && (
                <>
                    {viewerRole === 'trainer' && (
                        <View
                            style={{
                                backgroundColor: colors.surfaceSubtle,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                borderRadius: radius.md,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                gap: 4,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                Session in progress
                                {' • End attempts: '}
                                {endAttempts}
                                /2
                            </Text>
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                Retry deadline:
                                {' '}
                                {formatDateTime(retryCutoff.toISOString())}
                            </Text>
                        </View>
                    )}

                    {showActionButton && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={Boolean(endDisabledReason) || isFetching}
                            onPress={() => onSendRequest('end').catch(() => { })}
                            style={{
                                height: 36,
                                borderRadius: radius.md,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: endDisabledReason
                                    ? colors.textDisabled
                                    : colors.error,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                                End Session
                            </Text>
                        </TouchableOpacity>
                    )}

                    {viewerRole === 'trainer' && bookingStatus === 'in_progress' && Boolean(endDisabledReason) && (
                        <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>{endDisabledReason}</Text>
                    )}

                    <View style={{ gap: 6, marginTop: 2 }}>
                        <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.textSecondary }}>
                            Verification timeline
                        </Text>

                        {requests.length === 0 ? (
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>No verification requests yet.</Text>
                        ) : (
                            requests.map((item) => (
                                <View
                                    key={item.id}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: focusRequestId === item.id ? accent : colors.surfaceBorder,
                                        borderRadius: radius.md,
                                        backgroundColor: colors.white,
                                        paddingHorizontal: 10,
                                        paddingVertical: 8,
                                        gap: 3,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.textSecondary }}>
                                            {getRequestTypeLabel(item.requestType)}
                                            {' #'}
                                            {attemptNumbers[item.id] ?? 1}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: fontSize.caption,
                                                fontWeight: '600',
                                                color: getStatusColor(item.status),
                                            }}
                                        >
                                            {STATUS_LABEL[item.status]}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                        Created:
                                        {' '}
                                        {formatDateTime(item.createdAt)}
                                    </Text>
                                    {item.expiresAt && item.status === 'pending' && (
                                        <Text style={{ fontSize: fontSize.caption, color: accent }}>
                                            Expires:
                                            {' '}
                                            {formatCountdown(item.expiresAt, nowMs)}
                                        </Text>
                                    )}
                                    {item.reason ? (
                                        <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                            Reason:
                                            {' '}
                                            {item.reason}
                                        </Text>
                                    ) : null}
                                </View>
                            ))
                        )}
                    </View>
                </>
            )}
        </View>
    );
}
