import Toast, { type ToastShowParams } from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

interface ShowToastOptions {
    title?: string;
    message: string;
    type?: ToastType;
    duration?: number;
    position?: 'top' | 'bottom';
    onPress?: () => void;
    onHide?: () => void;
}

const DEFAULT_DURATION = 4000;

/**
 * Show a toast notification
 */
export function showToast({
    title,
    message,
    type = 'info',
    duration = DEFAULT_DURATION,
    position = 'top',
    onPress,
    onHide,
}: ShowToastOptions): void {
    const params: ToastShowParams = {
        type,
        text1: title,
        text2: message,
        visibilityTime: duration,
        position,
        onPress,
        onHide,
    };

    // If no title provided, use message as title for better visibility
    if (!title) {
        params.text1 = message;
        params.text2 = undefined;
    }

    Toast.show(params);
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, title?: string): void {
    showToast({
        title,
        message,
        type: 'success',
    });
}

/**
 * Show an error toast
 */
export function showErrorToast(message: string, title = 'Error'): void {
    showToast({
        title,
        message,
        type: 'error',
        duration: 5000, // Errors stay longer
    });
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string, title?: string): void {
    showToast({
        title,
        message,
        type: 'info',
    });
}

/**
 * Hide all toasts
 */
export function hideToast(): void {
    Toast.hide();
}

/**
 * Show network error toast with appropriate message
 */
export function showNetworkErrorToast(error: unknown): void {
    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
        // Check for common network errors
        if (error.message.includes('Network Error')) {
            message = 'No internet connection. Please check your network.';
        } else if (error.message.includes('timeout')) {
            message = 'Request timed out. Please try again.';
        } else {
            message = error.message;
        }
    } else if (typeof error === 'string') {
        message = error;
    }

    showErrorToast(message, 'Network Error');
}
