import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseAppwriteOptions<T, P = void> {
    fn: (params: P) => Promise<T>;
    params?: P;
    skip?: boolean;
}

const useAppwrite = <T, P = void>({
                                      fn,
                                      params,
                                      skip = false,
                                  }: UseAppwriteOptions<T, P>) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<string | null>(null);

    // Stable fetchData - does NOT depend on params
    const fetchData = useCallback(
        async (overrideParams?: P) => {
            setLoading(true);
            setError(null);

            try {
                const result = await fn(overrideParams ?? params!);
                setData(result);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);

                // ✅ Only show alert for non-auth errors
                // Don't show alert for "missing scopes" or "unauthorized" errors
                const errorMsg = message.toLowerCase();
                if (!errorMsg.includes('scope') && !errorMsg.includes('unauthorized') && !errorMsg.includes('guest')) {
                    Alert.alert("Error", message);
                }
            } finally {
                setLoading(false);
            }
        },
        [fn, params] // Keep params in deps to avoid stale closure
    );

    useEffect(() => {
        if (!skip) {
            fetchData().catch((err) => {
                // ✅ FIX: Safely log error without causing _toString
                console.error("Fetch error:", err?.message || String(err));
            });
        }
    }, [fetchData, skip]);

    const refetch = async (newParams?: P) => fetchData(newParams ?? params);

    return { data, loading, error, refetch };
};

export default useAppwrite;