import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get("window");

export const isTablet = width >= 768;
export const isLargeTablet = width >= 1024;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const screenWidth = width;
export const screenHeight = height;