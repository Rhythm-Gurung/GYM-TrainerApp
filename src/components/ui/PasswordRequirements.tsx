import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const REQUIREMENTS = [
    { key: 'length', label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
    { key: 'uppercase', label: 'One uppercase letter (A-Z)', test: (pw: string) => /[A-Z]/.test(pw) },
    { key: 'lowercase', label: 'One lowercase letter (a-z)', test: (pw: string) => /[a-z]/.test(pw) },
    { key: 'number', label: 'One number (0-9)', test: (pw: string) => /[0-9]/.test(pw) },
    { key: 'special', label: 'One special character (!@#$%^&*)', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

interface PasswordRequirementsProps {
    password: string;
    showValidation?: boolean;
}

export function PasswordRequirements({ password = '', showValidation = true }: PasswordRequirementsProps) {
    if (!showValidation) return null;

    return (
        <View className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Text className="text-gray-700 font-semibold mb-3">Password must contain:</Text>
            <View>
                {REQUIREMENTS.map((req) => {
                    const isMet = req.test(password);
                    return (
                        <View key={req.key} className="flex-row items-center mb-2">
                            <Ionicons
                                name={isMet ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={isMet ? '#10B981' : '#D1D5DB'}
                            />
                            <Text className={`ml-2 text-sm ${isMet ? 'text-success' : 'text-gray-500'}`}>
                                {req.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
