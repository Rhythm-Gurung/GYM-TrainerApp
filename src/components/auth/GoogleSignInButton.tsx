import React from 'react';
import {
    ActivityIndicator,
    Image,
    TouchableOpacity,
} from 'react-native';

interface GoogleSignInButtonProps {
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export default function GoogleSignInButton({
    onPress,
    loading = false,
    disabled = false,
}: GoogleSignInButtonProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className="w-16 h-16 items-center justify-center bg-white border border-gray-200 rounded-xl"
            style={{
                opacity: disabled || loading ? 0.6 : 1,
            }}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#4285F4" />
            ) : (
                <Image
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    source={require('../../../assets/images/google.png')}
                    style={{ width: 50, height: 50 }}
                    resizeMode="contain"
                />
            )}
        </TouchableOpacity>
    );
}
