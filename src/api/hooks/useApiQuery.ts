import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import type {
    ApiState,
    QueryOptions,
} from './types';

import {
    getErrorMessage,
    showErrorToast,
} from '@/lib';

interface UseQueryResult<TData> extends ApiState<TData> {
    refetch: () => Promise<void>;
    isFetching: boolean;
}

// Simple in-memory cache
const queryCache = new Map<string, { data: unknown; timestamp: number }>();

export function useApiQuery<TData>(
    queryKey: string,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>,
): UseQueryResult<TData> {
    const [state, setState] = useState<ApiState<TData>>({
        data: null,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
    });
    const [isFetching, setIsFetching] = useState(false);

    const mountedRef = useRef(true);

    const enabled = options?.enabled ?? true;
    const staleTime = options?.staleTime ?? 0;
    const shouldShowToast = options?.showErrorToast !== false;

    const fetchData = useCallback(
        async (skipCache = false) => {
            if (!enabled) return;

            // Check cache
            if (!skipCache && staleTime > 0) {
                const cached = queryCache.get(queryKey);
                const now = Date.now();

                if (cached && now - cached.timestamp < staleTime) {
                    setState({
                        data: cached.data as TData,
                        error: null,
                        isLoading: false,
                        isError: false,
                        isSuccess: true,
                    });
                    return;
                }
            }

            setIsFetching(true);

            try {
                const data = await queryFn();

                if (!mountedRef.current) return;

                // Update cache
                queryCache.set(queryKey, { data, timestamp: Date.now() });

                setState({
                    data,
                    error: null,
                    isLoading: false,
                    isError: false,
                    isSuccess: true,
                });

                options?.onSuccess?.(data);
            } catch (err) {
                if (!mountedRef.current) return;

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

                options?.onError?.(error);
            } finally {
                if (mountedRef.current) {
                    setIsFetching(false);
                }
            }
        },
        [queryKey, queryFn, enabled, staleTime, options, shouldShowToast],
    );

    useEffect(() => {
        mountedRef.current = true;

        if (enabled && (options?.refetchOnMount !== false || state.data === null)) {
            fetchData();
        }

        return () => {
            mountedRef.current = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, queryKey]);

    const refetch = useCallback(async () => {
        // Clear cache for this key to force refetch
        queryCache.delete(queryKey);
        await fetchData(true);
    }, [queryKey, fetchData]);

    return {
        ...state,
        refetch,
        isFetching,
    };
}

// Utility to invalidate cache
export function invalidateQuery(queryKey: string): void {
    queryCache.delete(queryKey);
}

export function invalidateAllQueries(): void {
    queryCache.clear();
}
