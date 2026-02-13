import Header from '@/components/ui/header';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';

interface OrderItem {
    id: string;
    status: string;
    storeName: string;
    time: string;
}

interface AnnouncementItem {
    id: string;
    title: string;
    description: string;
    expiresIn: string;
}

interface LegendItem {
    color: string;
    label: string;
    description: string;
}

interface StatCardProps {
    label: string;
    value: string;
    iconName: keyof typeof Ionicons.glyphMap;
    accentColor: string;
}

function StatCard({ label, value, iconName, accentColor }: StatCardProps) {
    return (
        <View
            className="flex-1 bg-white rounded-xl px-3 py-4 items-center"
            style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            }}
        >
            <View
                className="w-9 h-9 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${accentColor}20` }}
            >
                <Ionicons name={iconName} size={18} color={accentColor} />
            </View>
            <Text className="text-lg font-bold text-gray-900">{value}</Text>
            <Text className="text-xs text-gray-500 mt-0.5 text-center">{label}</Text>
        </View>
    );
}

function getOrderStatusStyle(status: string): { color: string; iconBg: string } {
    const s = status.toLowerCase();
    if (s.includes('new')) return { color: '#22C55E', iconBg: '#DCFCE7' };
    if (s.includes('updated')) return { color: '#F97316', iconBg: '#FFEDD5' };
    if (s.includes('cancel')) return { color: '#EF4444', iconBg: '#FEE2E2' };
    return { color: '#6B7280', iconBg: '#F3F4F6' };
}

const cardShadow = {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
} as const;

export default function Home() {
    const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('1week');
    const tabBarHeight = useTabBarHeight();
    const fabBottom = tabBarHeight + 16;
    const scrollPaddingBottom = tabBarHeight + 24;

    const barData = [
        {
            value: 90,
            label: 'Received',
            frontColor: '#547792',
            labelTextStyle: { fontSize: 12, fontWeight: '500' as const, color: '#6B7280' },
        },
        {
            value: 60,
            label: 'Made',
            frontColor: '#A8DF8E',
            labelTextStyle: { fontSize: 12, fontWeight: '500' as const, color: '#6B7280' },
        },
        {
            value: 11,
            label: 'Cancelled\n(Made)',
            frontColor: '#FE7F2D',
            labelTextStyle: { fontSize: 12, fontWeight: '500' as const, color: '#6B7280' },
        },
        {
            value: 18,
            label: 'Cancelled\n(Received)',
            frontColor: '#D02752',
            labelTextStyle: { fontSize: 12, fontWeight: '500' as const, color: '#6B7280' },
        },
    ];

    const legendItems: LegendItem[] = [
        { color: '#547792', label: 'Orders Received', description: 'Total orders received from retailers' },
        { color: '#A8DF8E', label: 'Orders Made', description: 'Orders successfully placed' },
        { color: '#FE7F2D', label: 'Cancellations Made', description: 'Orders you cancelled' },
        { color: '#D02752', label: 'Cancellations Received', description: 'Orders cancelled by retailers' },
    ];

    const orders: OrderItem[] = [
        {
            id: '1',
            status: 'New Order Received',
            storeName: 'Hanuman Store',
            time: '20 mins ago',
        },
        {
            id: '2',
            status: 'Order Updated',
            storeName: 'Kantipur Store',
            time: '20 mins ago',
        },
        {
            id: '3',
            status: 'New Order Received',
            storeName: 'KCS Bar',
            time: '20 mins ago',
        },
    ];

    const announcements: AnnouncementItem[] = [
        {
            id: '1',
            title: 'Buy Two Get One Free',
            description: 'For all distributors',
            expiresIn: 'Expires in 1 days',
        },
        {
            id: '2',
            title: 'Store will remain close for three days',
            description: 'Bhatbhateni',
            expiresIn: 'Expires in 2 days',
        },
    ];

    const renderOrderItem = (order: OrderItem) => {
        const statusStyle = getOrderStatusStyle(order.status);
        return (
            <TouchableOpacity
                key={order.id}
                className="flex-row items-center justify-between py-3 px-4 border-b border-gray-100"
            >
                <View className="flex-row items-center flex-1">
                    <View
                        className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: statusStyle.iconBg }}
                    >
                        <Ionicons name="receipt-outline" size={20} color={statusStyle.color} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-semibold mb-0.5" style={{ color: statusStyle.color }}>
                            {order.status}
                        </Text>
                        <Text className="text-xs text-gray-500">{order.storeName}</Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-gray-400 mb-1">{order.time}</Text>
                    <TouchableOpacity className="flex-row items-center">
                        <Text className="text-xs text-orange-500 font-medium">See details</Text>
                        <Ionicons name="chevron-forward" size={12} color="#F97316" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const getExpiryBadgeStyle = (expiresIn: string): { color: string; bg: string } => {
        const daysMatch = expiresIn.match(/(\d+)/);
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 99;
        if (days <= 1) return { color: '#EF4444', bg: '#FEE2E2' };
        if (days <= 3) return { color: '#F97316', bg: '#FFEDD5' };
        return { color: '#547792', bg: '#EFF6FF' };
    };

    const renderAnnouncementItem = (announcement: AnnouncementItem) => {
        const badge = getExpiryBadgeStyle(announcement.expiresIn);

        return (
            <View
                key={announcement.id}
                className="flex-row items-center py-3 px-4 border-b border-gray-100"
            >
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                    <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#666" />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 mb-0.5">
                        {announcement.title}
                    </Text>
                    <Text className="text-xs text-gray-500">{announcement.description}</Text>
                </View>
                <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: badge.bg }}
                >
                    <Text className="text-xs font-semibold" style={{ color: badge.color }}>
                        {announcement.expiresIn}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FBFBFB' }}>
            <Header title="Home" />

            {/* Quick Stats Row */}
            <View className="flex-row gap-3 px-4 py-3">
                <StatCard label="Total Orders" value="128" iconName="receipt-outline" accentColor="#547792" />
                <StatCard label="Pending" value="14" iconName="time-outline" accentColor="#F97316" />
                <StatCard label="Revenue" value="₹84K" iconName="trending-up-outline" accentColor="#22C55E" />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}>
                {/* Orders Section */}
                <View className="bg-white mt-4 mx-4 rounded-xl" style={cardShadow}>
                    <TouchableOpacity className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                        <Text className="text-base font-bold text-gray-900">Orders</Text>
                        <View className="flex-row items-center">
                            <Text className="text-sm text-primary-btn font-medium">See all</Text>
                            <Ionicons name="chevron-forward" size={16} color="#73C2FB" />
                        </View>
                    </TouchableOpacity>
                    {orders.map(renderOrderItem)}
                </View>

                {/* Schemes/Offers/Announcements Section */}
                <View className="bg-white mt-4 mx-4 rounded-xl" style={cardShadow}>
                    <TouchableOpacity className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                        <Text className="text-base font-bold text-gray-900">
                            Schemes / Offers / Announcements
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-sm text-primary-btn font-medium">See all</Text>
                            <Ionicons name="chevron-forward" size={16} color="#73C2FB" />
                        </View>
                    </TouchableOpacity>
                    {announcements.map(renderAnnouncementItem)}
                </View>

                {/* Orders Chart Section */}
                <View className="bg-white mt-4 mx-4 mb-4 rounded-xl" style={cardShadow}>
                    <View className="px-4 py-3 border-b border-gray-100">
                        <Text className="text-base font-bold text-gray-900">Order Statistics</Text>
                    </View>

                    {/* Time Filter Buttons */}
                    <View className="flex-row px-4 py-4 gap-2">
                        <TouchableOpacity
                            onPress={() => setSelectedTimeFilter('1week')}
                            className={`px-4 py-2 rounded-full ${selectedTimeFilter === '1week'
                                ? 'bg-primary-btn'
                                : 'bg-gray-100'
                                }`}
                        >
                            <Text
                                className={`text-sm font-medium ${selectedTimeFilter === '1week'
                                    ? 'text-white'
                                    : 'text-gray-600'
                                    }`}
                            >
                                1 week
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSelectedTimeFilter('30days')}
                            className={`px-4 py-2 rounded-full ${selectedTimeFilter === '30days'
                                ? 'bg-primary-btn'
                                : 'bg-gray-100'
                                }`}
                        >
                            <Text
                                className={`text-sm font-medium ${selectedTimeFilter === '30days'
                                    ? 'text-white'
                                    : 'text-gray-600'
                                    }`}
                            >
                                30 days
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSelectedTimeFilter('custom')}
                            className={`px-4 py-2 rounded-full border ${selectedTimeFilter === 'custom'
                                ? 'border-primary-btn bg-primary-btn/10'
                                : 'border-gray-300 bg-white'
                                }`}
                        >
                            <Text
                                className={`text-sm font-medium ${selectedTimeFilter === 'custom'
                                    ? 'text-primary-btn'
                                    : 'text-gray-600'
                                    }`}
                            >
                                Date from — Date upto
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bar Chart */}
                    <View className="px-4 pb-2">
                        <Text className="text-sm font-medium text-gray-600 text-center">
                            Orders Overview
                        </Text>
                    </View>
                    <View className="px-4 py-6">
                        <BarChart
                            data={barData}
                            barWidth={50}
                            hideRules
                            xAxisThickness={0}
                            yAxisThickness={0}
                            yAxisTextStyle={{ color: '#9CA3AF', fontSize: 11 }}
                            noOfSections={4}
                            height={220}
                            backgroundColor="#ffffff"
                            yAxisLabelTexts={['0', '25', '50', '75', '100']}
                            isAnimated
                            animationDuration={600}
                            spacing={25}
                            barBorderRadius={8}
                        />
                    </View>

                    {/* Legend Section */}
                    <View className="px-4 pb-4 pt-2 border-t border-gray-100">
                        <View className="flex-row flex-wrap gap-3">
                            {legendItems.map((item) => (
                                <View key={item.label} className="flex-row items-start" style={{ width: '47%' }}>
                                    <View
                                        className="w-4 h-4 rounded mr-2 mt-0.5"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-800">
                                            {item.label}
                                        </Text>
                                        <Text className="text-xs text-gray-500 mt-0.5">
                                            {item.description}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                className="absolute right-6 w-14 h-14 rounded-full items-center justify-center"
                style={{
                    bottom: fabBottom,
                    backgroundColor: '#73C2FB',
                    elevation: 6,
                    shadowColor: '#73C2FB',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
