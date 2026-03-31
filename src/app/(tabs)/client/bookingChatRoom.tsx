import { useLocalSearchParams } from 'expo-router';

import BookingChatRoomScreen from '@/components/chat/BookingChatRoomScreen';

export default function ClientBookingChatRoom() {
    const params = useLocalSearchParams<{ bookingId?: string; partnerName?: string }>();

    return (
        <BookingChatRoomScreen
            chatRole="client"
            bookingId={params.bookingId ?? ''}
            initialPartnerName={params.partnerName}
        />
    );
}
