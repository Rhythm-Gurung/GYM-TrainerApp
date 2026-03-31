import { useLocalSearchParams } from 'expo-router';

import BookingChatRoomScreen from '@/components/chat/BookingChatRoomScreen';

export default function TrainerBookingChatRoom() {
    const params = useLocalSearchParams<{ bookingId?: string; partnerName?: string }>();

    return (
        <BookingChatRoomScreen
            chatRole="trainer"
            bookingId={params.bookingId ?? ''}
            initialPartnerName={params.partnerName}
        />
    );
}
