import {
    useCallback,
    useState,
} from 'react';

import type {
    ApiState,
    MutationOptions,
} from './types';

import {
    getErrorMessage,
    showErrorToast,
} from '@/lib';

interface UseMutationResult<TData, TVariables> extends ApiState<TData> {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    reset: () => void;
}

export function useApiMutation<TData, TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: MutationOptions<TData, TVariables>,
): UseMutationResult<TData, TVariables> {
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

    const mutateAsync = useCallback(
        async (variables: TVariables): Promise<TData> => {
            setState((prev) => ({
                ...prev,
                isLoading: true,
                isError: false,
                error: null,
            }));

            try {
                const data = await mutationFn(variables);

                setState({
                    data,
                    error: null,
                    isLoading: false,
                    isError: false,
                    isSuccess: true,
                });

                await options?.onSuccess?.(data, variables);
                options?.onSettled?.(data, null, variables);

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

                options?.onError?.(error, variables);
                options?.onSettled?.(null, error, variables);

                throw error;
            }
        },
        [mutationFn, options, shouldShowToast],
    );

    const mutate = useCallback(
        (variables: TVariables) => {
            mutateAsync(variables).catch(() => {
                // Error is already handled in state and toast
            });
        },
        [mutateAsync],
    );

    return {
        ...state,
        mutate,
        mutateAsync,
        reset,
    };
}
