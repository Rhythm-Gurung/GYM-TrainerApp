import {
    useCallback,
    useState,
} from 'react';

import type {
    ApiState,
    UseApiOptions,
} from './types';

import {
    getErrorMessage,
    showErrorToast,
} from '@/lib';

interface UseApiResult<TData, TArgs extends unknown[]> extends ApiState<TData> {
    execute: (...args: TArgs) => Promise<TData>;
    reset: () => void;
}

/**
 * Simple hook for one-off API calls with loading/error states.
 * For more complex scenarios, use useApiQuery or useApiMutation.
 *
 * @example
 * const { data, isLoading, error, execute } = useApi(authService.getProfile);
 *
 * // Call the API
 * const profile = await execute();
 */
export function useApi<TData, TArgs extends unknown[] = []>(
    apiFn: (...args: TArgs) => Promise<TData>,
    options?: UseApiOptions,
): UseApiResult<TData, TArgs> {
    const [state, setState] = useState<ApiState<TData>>({
        data: null,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: false,
    });

    const shouldShowToast = options?.showErrorToast !== false;

    const reset = useCallback(() => {
        setState({
            data: null,
            error: null,
            isLoading: false,
            isError: false,
            isSuccess: false,
        });
    }, []);

    const execute = useCallback(
        async (...args: TArgs): Promise<TData> => {
            setState((prev) => ({
                ...prev,
                isLoading: true,
                isError: false,
                error: null,
            }));

            try {
                const data = await apiFn(...args);

                setState({
                    data,
                    error: null,
                    isLoading: false,
                    isError: false,
                    isSuccess: true,
                });

                return data;
            } catch (err) {
                const errorMessage = getErrorMessage(err);
                const error = err instanceof Error ? err : new Error(errorMessage);

                setState({
                    data: null,
                    error,
                    isLoading: false,
                    isError: true,
                    isSuccess: false,
                });

                // Show toast notification for errors
                if (shouldShowToast) {
                    showErrorToast(errorMessage, options?.errorToastTitle);
                }

                throw error;
            }
        },
        [apiFn, options?.errorToastTitle, shouldShowToast],
    );

    return {
        ...state,
        execute,
        reset,
    };
}
