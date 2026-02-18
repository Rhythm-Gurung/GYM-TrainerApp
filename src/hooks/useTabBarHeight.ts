import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Both client and trainer tab layouts use this height.
 * Defined here to avoid importing from a specific layout file.
 */
const TAB_BAR_BASE_HEIGHT = 56;

/**
 * Returns the total height of the bottom tab bar including the device's
 * bottom safe area inset (home indicator / navigation buttons).
 * Use this for ScrollView paddingBottom and FAB positioning.
 */
export function useTabBarHeight(): number {
    const insets = useSafeAreaInsets();
    return TAB_BAR_BASE_HEIGHT + insets.bottom;
}
