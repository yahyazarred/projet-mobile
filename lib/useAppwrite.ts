import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseAppwriteOptions<T> {
    fn: () => Promise<T>;
    skip?: boolean;
}

const useAppwrite = <T>({ fn, skip = false }: UseAppwriteOptions<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fn();
            setData(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    }, [fn]);

    useEffect(() => {
        if (!skip) fetchData();
    }, [fetchData, skip]);

    const refetch = async () => fetchData();

    return { data, loading, error, refetch };
};

export default useAppwrite;
