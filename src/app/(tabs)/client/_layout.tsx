import { useBadgeWebSocket } from '@/api/hooks/useBadgeWebSocket';
import { useBookingChatSessions } from '@/api/hooks/useBookingChat';
import { colors, fontSize } from '@/constants/theme';
import { chatEvents } from '@/lib/chatEvents';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useGlobalSearchParams, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabBarIconProps {
    color: string;
    focused: boolean;
}

interface BookingsTabIconProps extends TabBarIconProps {
    badgeCount: number;
    showBadge: boolean;
}

function HomeIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />;
}

function DiscoverIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'compass' : 'compass-outline'} color={color} size={24} />;
}

// function BookingsIcon({ color, focused }: TabBarIconProps) {
//     return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />;
// }

function BookingsTabIcon({ color, focused, badgeCount, showBadge }: BookingsTabIconProps) {
    return (
        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />
            {showBadge && badgeCount > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: -2,
                        right: -10,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        paddingHorizontal: 4,
                        backgroundColor: colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.white }}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                </View>
            )}
        </View>
    );
}

function ProfileIcon({ color, focused }: TabBarIconProps) {
    return (
        <Ionicons
            name={focused ? 'person' : 'person-outline'}
            color={color}
            size={24}
        />
    );
}

function TabBarBlurBackground() {
    const borderStyle = {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.06)',
    };

    if (Platform.OS === 'android') {
        return (
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(255,255,255,0.93)' },
                    borderStyle,
                ]}
            />
        );
    }

    return (
        <BlurView
            tint="light"
            intensity={55}
            style={[StyleSheet.absoluteFill, borderStyle]}
        />
    );
}

// Exported so screens can compute correct scroll/FAB offsets
export const TAB_BAR_BASE_HEIGHT = 56;

export default function ClientTabLayout() {
    const insets = useSafeAreaInsets();
    useBadgeWebSocket();
    const pathname = usePathname();
    const params = useGlobalSearchParams<{ tab?: string }>();
    const { data: bookingChatSessions } = useBookingChatSessions();
    const [unreadOverrides, setUnreadOverrides] = useState<Record<string, number>>({});

    useEffect(() => {
        const unsubscribe = chatEvents.on('unread_update', (update) => {
            setUnreadOverrides((prev) => ({
                ...prev,
                [update.bookingId]: update.unreadCount,
            }));
        });
        return unsubscribe;
    }, []);

    const bookingsUnreadCount = useMemo(() => (
        bookingChatSessions?.reduce((total, session) => {
            const unreadCount = unreadOverrides[session.bookingId] ?? session.unreadCount;
            return total + unreadCount;
        }, 0) ?? 0
    ), [bookingChatSessions, unreadOverrides]);

    const hideBookingsBadge = pathname.endsWith('/bookings') && params.tab === 'active';
    const showBookingsBadge = bookingsUnreadCount > 0 && !hideBookingsBadge;

    const renderBookingsIcon = useCallback(
        (props: TabBarIconProps) => (
            <BookingsTabIcon
                {...props}
                badgeCount={bookingsUnreadCount}
                showBadge={showBookingsBadge}
            />
        ),
        [bookingsUnreadCount, showBookingsBadge],
    );

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSubtle,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: TAB_BAR_BASE_HEIGHT + insets.bottom,
                    paddingBottom: insets.bottom + 4,
                    paddingTop: 8,
                },
                tabBarBackground: TabBarBlurBackground,
                tabBarLabelStyle: {
                    fontSize: fontSize.tag,
                    fontWeight: '500',
                    marginTop: 2,
                },
                tabBarItemStyle: {
                    paddingVertical: 2,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    headerShown: false,
                    tabBarIcon: HomeIcon,
                    tabBarLabel: 'Home',
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    headerShown: false,
                    tabBarIcon: DiscoverIcon,
                    tabBarLabel: 'Discover',
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    headerShown: false,
                    tabBarIcon: renderBookingsIcon,
                    tabBarLabel: 'Bookings',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    headerShown: false,
                    tabBarIcon: ProfileIcon,
                    tabBarLabel: 'Profile',
                }}
            />
            {/* Not a tab — accessed via router.push. Tab bar hidden on this screen. */}
            <Tabs.Screen
                name="notifications"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="trainerProfile"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            />
            {/* Booking flow — navigated to from trainerProfile. Tab bar hidden. */}
            <Tabs.Screen
                name="bookSession"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            />
            {/* Chat — opened via floating button. Tab bar hidden. */}
            <Tabs.Screen
                name="chat"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="chatDetail"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="bookingChat"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="bookingChatRoom"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            />
        </Tabs>
    );
}
