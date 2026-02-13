export interface ApiState<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
}

export interface MutationOptions<TData, TVariables> {
    onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (
        data: TData | null,
        error: Error | null,
        variables: TVariables,
    ) => void;
    /** Show toast notification on error (default: true) */
    showErrorToast?: boolean;
    /** Custom error toast title */
    errorToastTitle?: string;
}

export interface QueryOptions<TData> {
    enabled?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    refetchOnMount?: boolean;
    staleTime?: number;
    /** Show toast notification on error (default: true) */
    showErrorToast?: boolean;
    /** Custom error toast title */
    errorToastTitle?: string;
}

export interface UseApiOptions {
    /** Show toast notification on error (default: true) */
    showErrorToast?: boolean;
    /** Custom error toast title */
    errorToastTitle?: string;
}
