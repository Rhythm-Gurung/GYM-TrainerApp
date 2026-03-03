import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius } from '@/constants/theme';

interface HeroGradientProps {
    /** Gradient color pair — pass gradientColors.primary or gradientColors.trainer */
    gradient: [string, string];
    children?: React.ReactNode;
    /** Absolutely positioned backdrop that does not scroll. No padding is applied. */
    fixed?: boolean;
    /**
     * fixed=true  → total height = insets.top + height (default 160)
     * fixed=false → overrides paddingBottom with a fixed container height
     */
    height?: number;
    /** Extra top padding added on top of insets.top (default 24) */
    paddingTopExtra?: number;
    /** Bottom padding when height is not set (default 36) */
    paddingBottom?: number;
}

export default function HeroGradient({
    gradient,
    children,
    fixed = false,
    height,
    paddingTopExtra = 24,
    paddingBottom = 36,
}: HeroGradientProps) {
    const insets = useSafeAreaInsets();

    if (fixed) {
        return (
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: insets.top + (height ?? 160),
                    borderBottomLeftRadius: radius.hero,
                    borderBottomRightRadius: radius.hero,
                }}
            />
        );
    }

    return (
        <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                paddingHorizontal: 20,
                paddingTop: insets.top + paddingTopExtra,
                ...(height !== undefined ? { height } : { paddingBottom }),
                borderBottomLeftRadius: radius.hero,
                borderBottomRightRadius: radius.hero,
                overflow: 'hidden',
            }}
        >
            {children}
        </LinearGradient>
    );
}
