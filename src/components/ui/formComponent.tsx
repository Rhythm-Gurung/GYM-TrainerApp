import React, { useState } from 'react';
import {
    type Control,
    type FieldPath,
    type FieldValues,
    useController,
} from 'react-hook-form';
import {
    ActivityIndicator,
    Text,
    TextInput,
    type TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// --- InputField ---

interface InputFieldProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<TextInputProps, 'onChangeText' | 'value' | 'onBlur'> {
    control: Control<TFieldValues>;
    name: TName;
    label: string;
    error?: string;
    leftIcon?: IoniconName;
    rightIcon?: IoniconName;
    onRightIconPress?: () => void;
}

export function InputField<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>({
    control,
    name,
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    className,
    placeholder,
    ...props
}: InputFieldProps<TFieldValues, TName>) {
    const { field } = useController({ control, name });
    const [isFocused, setIsFocused] = useState(false);
    const showFloatingLabel = isFocused || !!field.value;

    return (
        <View className="mb-6">
            <View
                className={`flex-row items-center border rounded-lg px-3 py-3 bg-white ${error ? 'border-red-400' : ''
                }`}
                style={!error ? { borderColor: '#F7F8F8' } : undefined}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={error ? '#F87171' : '#AAAAAA'}
                        className="mr-2"
                    />
                )}
                <TextInput
                    className={`flex-1 text-gray-900 ${className ?? ''}`}
                    placeholderTextColor="#AAAAAA"
                    {...props}
                    placeholder={showFloatingLabel ? undefined : placeholder}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                        setIsFocused(false);
                        field.onBlur();
                    }}
                    onFocus={() => setIsFocused(true)}
                />
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.6}>
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color="#AAAAAA"
                        />
                    </TouchableOpacity>
                )}
            </View>
            {showFloatingLabel && (
                <Text
                    className="absolute bg-white px-1 text-sm text-gray-light"
                    style={{ top: -7, left: 20 }}
                >
                    {label}
                </Text>
            )}
            {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
        </View>
    );
}

// --- Button ---

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    icon?: IoniconName;
    width?: number;
}

export function Button({
    title, onPress, loading, disabled, icon, width,
}: ButtonProps) {
    return (
        <TouchableOpacity
            className={`pt-3 rounded-lg items-center justify-center flex-row py-4 bg-primary-btn ${disabled ? 'opacity-50' : 'opacity-100'
            }`}
            style={width ? { width } : undefined}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator size="small" color="white" />
            ) : (
                <View className="flex-row items-center gap-2">
                    {icon && <Ionicons name={icon} size={20} color="white" />}
                    <Text className="text-white font-semibold text-xl">{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
