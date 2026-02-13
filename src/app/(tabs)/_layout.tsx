import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabBarIconProps {
    color: string;
    focused: boolean;
}

function HomeIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />;
}

function MenuIcon({ color, focused }: TabBarIconProps) {
    return <Ionicons name={focused ? 'menu' : 'menu-outline'} color={color} size={24} />;
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

function FavoriteIcon({ color, focused }: TabBarIconProps) {
    return (
        <Ionicons
            name={focused ? 'heart' : 'heart-outline'}
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

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#547792',
                tabBarInactiveTintColor: '#9CA3AF',
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
                    fontSize: 12,
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
                    tabBarLabel: 'Dashboard',
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    headerShown: false,
                    tabBarIcon: MenuIcon,
                    tabBarLabel: 'Menu',
                }}
            />
            <Tabs.Screen
                name="favorite"
                options={{
                    headerShown: false,
                    tabBarIcon: FavoriteIcon,
                    tabBarLabel: 'Favorite',
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
