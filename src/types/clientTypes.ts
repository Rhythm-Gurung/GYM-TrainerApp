export interface Certification {
    id: string;
    name: string;
    issuer: string;
    year: number;
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
    availability: unknown[];
    portfolio: unknown[];
    isFavorited: boolean;
}

export interface Booking {
    id: string;
    clientId: string;
    trainerId: string;
    trainerName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'confirmed' | 'completed' | 'pending' | 'cancelled';
    totalAmount: number;
    createdAt: string;
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
}

export interface EarningsSummary {
    totalEarnings: number;
    pendingPayouts: number;
    completedPayouts: number;
    commissionRate: number;
    commissionPaid: number;
}
