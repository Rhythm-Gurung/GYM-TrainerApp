export interface Certification {
    id: string;
    name: string;
    issuer: string;
    year: number;
    image_url?: string;
}

export interface Trainer {
    id: string;
    userId: string;
    name: string;
    avatar: string;
    bio: string;
    expertise: string[];
    certifications: Certification[];
    experienceYears: number;
    hourlyRate: number;
    rating: number;
    reviewCount: number;
    location: string;
    isVerified: boolean;
    profileCompleteness: number;
    availability: ApiScheduleDay[];
    portfolio: ApiGalleryItem[];
    isFavorited: boolean;
}

// ─── API response shapes ───────────────────────────────────────────────────────

export interface ApiCertification {
    id: number;
    name: string;
    issuer: string;
    year: number;
    image_url: string;
}

export interface ApiGalleryItem {
    id: number;
    image_url: string;
    caption?: string;
    collection_id?: string | null;
}

export type SessionMode = 'online' | 'offline' | 'both';
export type BookingSessionMode = 'online' | 'offline';

export interface ApiScheduleSlot {
    start_time: string;
    end_time: string;
}

export interface ApiScheduleDay {
    day_of_week: number;
    enabled: boolean;
    session_mode: SessionMode;
    slots: ApiScheduleSlot[];
}

// ─── Available slots shapes (from GET /api/trainers/{id}/available-slots/) ────

export interface ApiAvailableSlot {
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

export interface ApiAvailableSlotsResponse {
    date: string;
    is_available: boolean;
    session_mode: SessionMode;
    slots: ApiAvailableSlot[];
}

export interface ApiSchedule {
    effective_from: string;
    effective_until: string | null;
    days: ApiScheduleDay[];
}

export interface ApiTrainer {
    id: number;
    uuid: string;
    full_name: string;
    profile_image_url: string | null;
    bio: string;
    location: string;
    rating: number;
    review_count: number;
    is_favourited: boolean;
    expertise_categories: string[];
    years_of_experience: number;
    pricing_per_session: string;
    is_verified: boolean;
    profile_completeness: number;
    certifications?: ApiCertification[];
    gallery?: ApiGalleryItem[];
    schedule?: ApiSchedule;
}

export interface ApiReview {
    id: number;
    booking_id?: number | null;
    rating: number;
    comment: string;
    created_at: string;
    // Backend returns reviewer_name and reviewer_avatar
    reviewer_name?: string;
    reviewer_avatar?: string | null;
    // Legacy field names (kept for compatibility)
    client_name?: string;
    client_avatar_url?: string | null;
}

export interface ApiReviewsResponse {
    count: number;
    average_rating: number;
    data: ApiReview[];
}

// ─── Mapper: ApiTrainer → Trainer ─────────────────────────────────────────────

export function mapApiTrainer(t: ApiTrainer): Trainer {
    return {
        id: String(t.id),
        userId: t.uuid ?? '',
        name: t.full_name ?? '',
        avatar: t.profile_image_url ?? '',
        bio: t.bio ?? '',
        expertise: t.expertise_categories ?? [],
        certifications: (t.certifications ?? []).map((c) => ({
            id: String(c.id),
            name: c.name,
            issuer: c.issuer,
            year: c.year,
            image_url: c.image_url,
        })),
        experienceYears: t.years_of_experience ?? 0,
        hourlyRate: parseFloat(t.pricing_per_session) || 0,
        rating: t.rating ?? 0,
        reviewCount: t.review_count ?? 0,
        location: t.location ?? '',
        isVerified: t.is_verified ?? false,
        profileCompleteness: t.profile_completeness ?? 0,
        availability: t.schedule?.days ?? [],
        portfolio: t.gallery ?? [],
        isFavorited: t.is_favourited ?? false,
    };
}

export function mapApiReview(r: ApiReview, trainerId: string): Review {
    return {
        id: String(r.id),
        bookingId: r.booking_id ? String(r.booking_id) : '',
        clientId: '',
        // Backend sends reviewer_name, fallback to client_name for compatibility
        clientName: r.reviewer_name ?? r.client_name ?? 'Anonymous',
        // Backend sends reviewer_avatar, fallback to client_avatar_url for compatibility
        clientAvatar: r.reviewer_avatar ?? r.client_avatar_url ?? '',
        trainerId,
        rating: r.rating,
        comment: r.comment ?? '',
        createdAt: r.created_at,
    };
}

export type BookingStatus =
    | 'pending'
    | 'accepted'
    | 'confirmed'
    | 'in_progress'
    | 'cancelled'
    | 'refund_pending'
    | 'refunded'
    | 'completed'
    | 'disputed'
    | 'no_show_client'
    | 'session_was_taken_but_not_end_by_client'
    | 'missed';

export type SessionRequestType = 'start' | 'end';
export type SessionRequestAction = 'accept' | 'reject';
export type SessionRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface SessionRequest {
    id: string;
    bookingId: string;
    requestType: SessionRequestType;
    status: SessionRequestStatus;
    requestedByRole: 'trainer' | 'client' | 'system';
    actionByRole?: 'trainer' | 'client' | 'system';
    action?: SessionRequestAction;
    reason?: string;
    expiresAt?: string;
    createdAt: string;
    respondedAt?: string;
}

export interface Booking {
    id: string;
    clientId: string;
    trainerId: string;
    trainerName: string;
    trainerAvatar?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    totalAmount: number;
    createdAt: string;
}

// ─── Payment types ─────────────────────────────────────────────────────────────

export interface PaymentInitiateResponse {
    pidx: string;
    payment_url: string;
    payment_id: number;
}

export type PaymentStatusValue = 'initiated' | 'completed' | 'failed' | 'cancelled' | 'expired';

export interface PaymentStatusResponse {
    id: number;
    booking: number;
    pidx: string;
    transaction_id?: string;
    amount: number;
    status: PaymentStatusValue;
    created_at: string;
}

export interface BulkPaymentInitiateRequest {
    bookingIds: string[];
    idempotencyKey?: string;
}

export interface BulkPaymentInitiateResponse {
    payment_group_id: string;
    payment_url: string;
    pidx?: string;
    amount?: number;
    currency?: string;
    expires_at?: string;
}

export interface BulkPaymentBookingStatus {
    bookingId: string;
    status: BookingStatus | PaymentStatusValue | string;
}

export interface BulkPaymentStatusResponse {
    payment_group_id: string;
    status: PaymentStatusValue | string;
    bookings: BulkPaymentBookingStatus[];
}

export interface Review {
    id: string;
    bookingId: string;
    clientId: string;
    clientName: string;
    clientAvatar: string;
    trainerId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface AppNotification {
    id: string;
    type: 'booking' | 'payment' | 'review' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    /** Optional backend payload for deep-link routing (e.g., booking_id, status). */
    data?: Record<string, unknown>;
}

export interface EarningsSummary {
    totalEarnings: number;
    pendingPayouts: number;
    completedPayouts: number;
    commissionRate: number;
    commissionPaid: number;
}

export interface BookingRequest {
    trainerId: string;
    trainerName: string;
    /** One or more session dates (ISO YYYY-MM-DD). Multi-day sends one POST per date. */
    dates: string[];
    sessionCount: number;
    startTime: string;
    endTime: string;
    /** Resolved before submission — never "both". */
    sessionMode: BookingSessionMode;
    totalAmount: number;
    notes?: string;
}

// ─── API Booking shapes ────────────────────────────────────────────────────────

export interface ApiBooking {
    id: number;
    /** Some backends nest trainer info; others flatten it. Both shapes handled. */
    trainer?: {
        id: number;
        full_name: string;
        username?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        profile_image_url?: string | null;
        image_url?: string | null;
        avatar_url?: string | null;
    };
    trainer_id?: number;
    trainer_name?: string;
    trainer_username?: string | null;
    trainer_first_name?: string | null;
    trainer_last_name?: string | null;
    trainer_email?: string | null;
    trainer_profile_image_url?: string | null;
    trainer_avatar_url?: string | null;
    date: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    total_amount: string;
    notes?: string;
    created_at: string;
}

const VALID_BOOKING_STATUSES: BookingStatus[] = [
    'pending',
    'accepted',
    'confirmed',
    'in_progress',
    'cancelled',
    'refund_pending',
    'refunded',
    'completed',
    'disputed',
    'no_show_client',
    'session_was_taken_but_not_end_by_client',
    'missed',
];

export function mapApiBooking(b: ApiBooking): Booking {
    const pickNonEmpty = (...values: Array<string | null | undefined>) => (
        values
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .find(Boolean)
        || ''
    );
    const fullFromParts = (first?: string | null, last?: string | null) => {
        const firstPart = pickNonEmpty(first);
        const lastPart = pickNonEmpty(last);
        if (firstPart && lastPart) return `${firstPart} ${lastPart}`;
        return firstPart || lastPart;
    };

    const trainerId = b.trainer ? String(b.trainer.id) : String(b.trainer_id ?? '');
    const trainerName = pickNonEmpty(
        b.trainer?.username,
        b.trainer_username,
        fullFromParts(b.trainer?.first_name, b.trainer?.last_name),
        fullFromParts(b.trainer_first_name, b.trainer_last_name),
        b.trainer?.full_name,
        b.trainer_name,
        b.trainer?.email,
        b.trainer_email,
    );
    const trainerAvatar = (
        b.trainer?.profile_image_url
        ?? b.trainer?.avatar_url
        ?? b.trainer?.image_url
        ?? b.trainer_profile_image_url
        ?? b.trainer_avatar_url
        ?? ''
    );
    const status: BookingStatus = VALID_BOOKING_STATUSES.includes(b.status as BookingStatus)
        ? (b.status as BookingStatus)
        : 'pending';
    return {
        id: String(b.id),
        clientId: '',
        trainerId,
        trainerName,
        trainerAvatar: trainerAvatar || undefined,
        date: b.date,
        startTime: b.start_time,
        endTime: b.end_time,
        status,
        totalAmount: parseFloat(b.total_amount) || 0,
        createdAt: b.created_at,
    };
}
