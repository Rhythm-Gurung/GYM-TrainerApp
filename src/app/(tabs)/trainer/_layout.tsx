import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabBarIconProps {
    color: string;
    focused: boolean;
}

function DashboardIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'grid' : 'grid-outline'} color={color} size={24} />;
}

function BookingsIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />;
}

function EarningsIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'wallet' : 'wallet-outline'} color={color} size={24} />;
}

function ScheduleIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'time' : 'time-outline'} color={color} size={24} />;
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

export default function TrainerTabLayout() {
    const insets = useSafeAreaInsets();

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
                name="dashboard"
                options={{
                    headerShown: false,
                    tabBarIcon: DashboardIcon,
                    tabBarLabel: 'Dashboard',
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    headerShown: false,
                    tabBarIcon: BookingsIcon,
                    tabBarLabel: 'Bookings',
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    headerShown: false,
                    tabBarIcon: EarningsIcon,
                    tabBarLabel: 'Earnings',
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    headerShown: false,
                    tabBarIcon: ScheduleIcon,
                    tabBarLabel: 'Schedule',
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
        </Tabs>
    );
}
