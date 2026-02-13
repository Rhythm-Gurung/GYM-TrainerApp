import { type AxiosError } from 'axios';

interface ErrorResponse {
  detail?: string;
  [key: string]: unknown;
}

/**
 * Type guard to check if error is an AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
    return (
        typeof error === 'object'
    && error !== null
    && 'isAxiosError' in error
    && error.isAxiosError === true
    );
}

/**
 * Formats field name for display
 * Examples: 'email' -> 'Email', 'confirmPassword' -> 'Confirm Password'
 */
function formatFieldName(field: string): string {
    return field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

/**
 * Parses field-specific errors from error response
 */
function parseFieldErrors(data: Record<string, unknown>): string | null {
    const entries = Object.entries(data);

    if (entries.length === 0) {
        return null;
    }

    const errorMessages = entries
        .filter(([key]) => key !== 'detail')
        .map(([field, messages]) => {
            const fieldName = formatFieldName(field);

            if (Array.isArray(messages)) {
                return `${fieldName}: ${messages.join(', ')}`;
            }

            if (typeof messages === 'string') {
                return `${fieldName}: ${messages}`;
            }

            return null;
        })
        .filter((msg): msg is string => msg !== null);

    return errorMessages.length > 0 ? errorMessages.join('\n') : null;
}

/**
 * Extracts a user-friendly error message from an Axios error
 */
export function getErrorMessage(
    error: unknown,
    defaultMessage = 'An unexpected error occurred',
): string {
    if (!error) {
        return defaultMessage;
    }

    // Check if it's an AxiosError
    if (isAxiosError(error)) {
        const data = error.response?.data as ErrorResponse | undefined;

        // Priority 1: Check for detail field
        if (data?.detail) {
            return typeof data.detail === 'string' ? data.detail : defaultMessage;
        }

        // Priority 2: Parse error object for field-specific errors
        if (data && typeof data === 'object') {
            const fieldErrors = parseFieldErrors(data);
            if (fieldErrors) {
                return fieldErrors;
            }
        }

        // Priority 3: Use status text
        if (error.response?.statusText) {
            return error.response.statusText;
        }

        // Priority 4: Network or request errors
        if (error.message) {
            return error.message;
        }
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    return defaultMessage;
}

/**
 * Gets HTTP status code from error
 */
export function getErrorStatus(error: unknown): number | null {
    if (isAxiosError(error)) {
        return error.response?.status ?? null;
    }
    return null;
}

/**
 * Checks if error is a specific HTTP status code
 */
export function isErrorStatus(error: unknown, status: number): boolean {
    return getErrorStatus(error) === status;
}
