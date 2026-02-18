import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface User {
    id: string;
    name: string;
}

interface Feature {
    id: string;
    name: string;
}

interface Permission {
    id: string;
    label: string;
}

interface FeaturePermissions {
    [featureId: string]: Permission[];
}

export default function RolesAccess() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState: { user } } = useAuth();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showFeatureDropdown, setShowFeatureDropdown] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

    // TODO: Replace with actual API call to get users list
    const users: User[] = [
        { id: '1', name: 'Suman Prajapati' },
        { id: '2', name: 'Yabesh Thapa' },
        { id: '3', name: 'Juna Tamrakar' },
        { id: '4', name: 'Maxtem Ghimire' },
        { id: '5', name: 'Mukesh Dholakiya' },
    ];

    // TODO: Replace with actual API call to get features list
    const features: Feature[] = [
        { id: '1', name: 'Order' },
        { id: '2', name: 'Party creation' },
        { id: '3', name: 'Product' },
        { id: '4', name: 'Schemes & offers' },
        { id: '5', name: 'Product quotation' },
        { id: '6', name: 'Reports' },
        { id: '7', name: 'General' },
    ];

    // TODO: Replace with actual API call to get feature permissions
    const featurePermissions: FeaturePermissions = {
        1: [ // Order
            { id: 'view-order', label: 'View order' },
            { id: 'create-order', label: 'Create order' },
            { id: 'respond-order', label: 'Respond order' },
            { id: 'delete-order', label: 'Delete order' },
        ],
        2: [ // Party creation
            { id: 'create-new-party', label: 'Create new party' },
            { id: 'update-party-details', label: 'Update party details' },
            { id: 'remove-party', label: 'Remove party' },
        ],
        3: [ // Product
            { id: 'create-new-product', label: 'Create new product' },
            { id: 'update-product-details', label: 'Update product details' },
            { id: 'remove-product', label: 'Remove product' },
        ],
        4: [ // Schemes & Offers
            { id: 'view-schemes-&-offers', label: 'View schemes & offers' },
            { id: 'create-schemes-&-offers', label: 'Create schemes & offers' },
            { id: 'update-schemes-&-offers', label: 'Update schemes & offers' },
            { id: 'apply-schemes-&-offers', label: 'Apply schemes & offers' },
            { id: 'delete-schemes-&-offers', label: 'Delete schemes & offers' },
        ],
        5: [ // Product quotation
            { id: 'create-quotation', label: 'Create quotation' },
            { id: 'respond-quotation', label: 'Respond quotation' },
            { id: 'update-quotation', label: 'Update quotation' },
            { id: 'delete-quotation', label: 'Delete quotation' },
        ],
        6: [ // Report
            { id: 'view-item-wise-report', label: 'View item-wise report' },
            { id: 'view-party-wise-report', label: 'View party-wise report' },
            { id: 'view-inventory-value-report', label: 'View inventory value report' },
        ],
        7: [ // General
            { id: 'view-profile-details', label: 'View profile details' },
            { id: 'add-new-users', label: 'Add new users' },
            { id: 'update-role-&-access', label: 'Update role & access' },
            { id: 'switch-users', label: 'Switch users' },
            { id: 'change-billing-plans', label: 'Change billing plans' },
        ],
    };

    const handleUserSelect = (userItem: User) => {
        setSelectedUser(userItem);
        setShowUserDropdown(false);
    };

    const handleFeatureSelect = (feature: Feature) => {
        setSelectedFeature(feature);
        setShowFeatureDropdown(false);
        // Reset permissions when feature changes
        setSelectedPermissions(new Set());
    };

    const handlePermissionToggle = (permissionId: string) => {
        setSelectedPermissions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(permissionId)) {
                newSet.delete(permissionId);
            } else {
                newSet.add(permissionId);
            }
            return newSet;
        });
    };

    const handleAssignAccess = async () => {
        if (!selectedUser || !selectedFeature) {
            showErrorToast('Please select both user and feature', 'Error');
            return;
        }

        if (selectedPermissions.size === 0) {
            showErrorToast('Please select at least one permission', 'Error');
            return;
        }

        try {
            // TODO: Implement API call to assign feature access to user
            // await assignFeatureAccess({
            //     userId: selectedUser.id,
            //     featureId: selectedFeature.id,
            //     permissions: Array.from(selectedPermissions),
            // });

            showSuccessToast(
                `${selectedFeature.name} access assigned to ${selectedUser.name}`,
                'Success',
            );

            // Reset selections
            setSelectedUser(null);
            setSelectedFeature(null);
            setSelectedPermissions(new Set());
        } catch {
            showErrorToast('Failed to assign access', 'Error');
        }
    };

    const handleCancel = () => {
        setSelectedUser(null);
        setSelectedFeature(null);
        setSelectedPermissions(new Set());
        setShowUserDropdown(false);
        setShowFeatureDropdown(false);
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 px-6 py-8">
                    {/* Header */}
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity onPress={handleBack} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text className="text-title font-bold text-foreground">
                            Roles & Access
                        </Text>
                    </View>

                    {/* Profile Section */}
                    <View className="items-center mb-8">
                        {/* Profile Image */}
                        <View className="mb-4">
                            {user?.profile_image ? (
                                <Image
                                    source={{ uri: user.profile_image }}
                                    className="w-32 h-32 rounded-full"
                                />
                            ) : (
                                <View className="w-32 h-32 rounded-full bg-surface-border items-center justify-center">
                                    <Ionicons name="person" size={64} color={colors.textSubtle} />
                                </View>
                            )}
                        </View>

                        {/* Business Name */}
                        <Text className="text-title font-bold text-foreground mb-6">
                            {user?.business_name || 'Vintuna Stores'}
                        </Text>
                    </View>

                    {/* Select User Dropdown */}
                    <View className="mb-6">
                        <TouchableOpacity
                            onPress={() => setShowUserDropdown(!showUserDropdown)}
                            className="bg-white border border-surface-border rounded-lg px-4 py-4 flex-row items-center justify-between"
                        >
                            <Text
                                className={`text-base ${selectedUser ? 'text-foreground' : 'text-foreground-5'
                                    }`}
                            >
                                {selectedUser?.name || 'Select User'}
                            </Text>
                            <Ionicons
                                name={showUserDropdown ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.textSubtle}
                            />
                        </TouchableOpacity>

                        {/* User Dropdown List */}
                        {showUserDropdown && (
                            <View className="bg-white border border-surface-border rounded-lg mt-2">
                                {users.map((userItem, index) => (
                                    <TouchableOpacity
                                        key={userItem.id}
                                        onPress={() => handleUserSelect(userItem)}
                                        className={`px-4 py-3 ${index !== users.length - 1
                                            ? 'border-b border-surface'
                                            : ''
                                            }`}
                                    >
                                        <Text className="text-base text-foreground">
                                            {userItem.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Select Feature Dropdown */}
                    <View className="mb-6">
                        <TouchableOpacity
                            onPress={() => setShowFeatureDropdown(!showFeatureDropdown)}
                            className="bg-white border border-surface-border rounded-lg px-4 py-4 flex-row items-center justify-between"
                        >
                            <Text
                                className={`text-base ${selectedFeature ? 'text-foreground' : 'text-foreground-5'
                                    }`}
                            >
                                {selectedFeature?.name || 'Select Feature'}
                            </Text>
                            <Ionicons
                                name={showFeatureDropdown ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.textSubtle}
                            />
                        </TouchableOpacity>

                        {/* Feature Dropdown List */}
                        {showFeatureDropdown && (
                            <View className="bg-white border border-surface-border rounded-lg mt-2">
                                {features.map((feature, index) => (
                                    <TouchableOpacity
                                        key={feature.id}
                                        onPress={() => handleFeatureSelect(feature)}
                                        className={`px-4 py-3 ${index !== features.length - 1
                                            ? 'border-b border-surface'
                                            : ''
                                            }`}
                                    >
                                        <Text className="text-base text-foreground">
                                            {feature.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Permissions Section */}
                    {selectedFeature && featurePermissions[selectedFeature.id] && (
                        <View className="mb-6">
                            <Text className="text-lead font-semibold text-foreground mb-3">
                                {selectedFeature.name}
                            </Text>
                            <View className="bg-white border border-surface-border rounded-lg">
                                {featurePermissions[selectedFeature.id].map((permission, index) => (
                                    <View
                                        key={permission.id}
                                        className={`flex-row items-center justify-between px-4 py-4 ${index !== featurePermissions[selectedFeature.id].length - 1
                                                ? 'border-b border-surface'
                                                : ''
                                            }`}
                                    >
                                        <Text className="text-base text-foreground flex-1">
                                            {permission.label}
                                        </Text>
                                        <Switch
                                            value={selectedPermissions.has(permission.id)}
                                            onValueChange={() => handlePermissionToggle(permission.id)}
                                            trackColor={{ false: colors.neutral, true: colors.actionTrack }}
                                            thumbColor={value ? colors.action : colors.surface}
                                            ios_backgroundColor={colors.neutral}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Action Buttons */}
                    {selectedFeature && (
                        <View className="mt-4">
                            <TouchableOpacity
                                onPress={handleAssignAccess}
                                className="bg-action py-4 rounded-lg items-center mb-4"
                            >
                                <Text className="text-white text-base font-semibold">
                                    Save
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCancel}
                                className="border-2 border-cancel py-4 rounded-lg items-center"
                            >
                                <Text className="text-cancel text-base font-semibold">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
