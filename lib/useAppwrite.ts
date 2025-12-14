/**
 * useAppwrite Custom Hook
 *
 * A reusable React hook for fetching data from Appwrite backend.
 * Handles loading states, error handling, and data refetching automatically.
 *
 * This hook follows the common pattern of data-fetching hooks (like useSWR or React Query).
 *
 * Features:
 * - Automatic data fetching on component mount
 * - Loading state management
 * - Error handling with user alerts
 * - Manual refetch capability
 * - Skip initial fetch option
 * - Type-safe with generics
 *
 * Common use cases:
 * - Fetching menu items
 * - Getting user profile
 * - Loading order history
 * - Retrieving categories
 */

import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

/**
 * UseAppwriteOptions Interface
 *
 * Defines the configuration for the useAppwrite hook.
 * Uses TypeScript generics for type safety:
 * - T: The type of data being fetched (e.g., MenuItem[], User)
 * - P: The type of parameters passed to the fetch function (defaults to void if no params)
 */
interface UseAppwriteOptions<T, P = void> {
    fn: (params: P) => Promise<T>;  // The async function that fetches data
    params?: P;                      // Optional parameters to pass to the function
    skip?: boolean;                  // If true, don't fetch data automatically on mount
}

/**
 * useAppwrite Hook
 *
 * Generic hook for data fetching with state management.
 *
 * Type Parameters:
 * - T: Type of data returned by the fetch function
 * - P: Type of parameters the fetch function accepts (default: void)
 *
 * Example Usage:
 * ```typescript
 * // Fetch menu items
 * const { data, loading, error, refetch } = useAppwrite({
 *   fn: getMenu,
 *   params: { category: "pizza" }
 * });
 *
 * // Fetch without parameters
 * const { data, loading } = useAppwrite({
 *   fn: getCurrentUser
 * });
 * ```
 *
 * @param fn - Async function that returns data (e.g., getMenu, getCurrentUser)
 * @param params - Parameters to pass to the function
 * @param skip - If true, don't fetch on mount (useful for conditional fetching)
 * @returns Object with data, loading state, error, and refetch function
 */
const useAppwrite = <T, P = void>({
                                      fn,                    // The fetching function
                                      params,                // Parameters for the function
                                      skip = false,          // Default: fetch on mount
                                  }: UseAppwriteOptions<T, P>) => {
    // =====================================================
    // STATE MANAGEMENT
    // =====================================================

    // Store the fetched data (null initially, T after successful fetch)
    const [data, setData] = useState<T | null>(null);

    // Track loading state (true if currently fetching)
    // Initial value: true if not skipping, false if skipping
    const [loading, setLoading] = useState(!skip);

    // Store error message if fetch fails (null if no error)
    const [error, setError] = useState<string | null>(null);

    // =====================================================
    // FETCH DATA FUNCTION
    // =====================================================

    /**
     * fetchData Function
     *
     * The core function that performs data fetching.
     * Wrapped in useCallback for performance optimization.
     *
     * useCallback prevents unnecessary re-creation of this function,
     * which would trigger useEffect unnecessarily.
     *
     * @param overrideParams - Optional parameters to override the default params
     */
    const fetchData = useCallback(
        async (overrideParams?: P) => {
            // Step 1: Set loading state and clear any previous errors
            setLoading(true);
            setError(null);

            try {
                // Step 2: Call the fetch function with parameters
                // Use overrideParams if provided, otherwise use default params
                // The ! operator asserts params is not null/undefined
                const result = await fn(overrideParams ?? params!);

                // Step 3: Store the fetched data in state
                setData(result);

            } catch (err: unknown) {
                // Step 4: Handle errors

                // Extract error message safely
                // Check if error is an Error object, otherwise convert to string
                const message = err instanceof Error ? err.message : String(err);

                // Store error message in state
                setError(message);

                // =====================================================
                // SMART ERROR ALERTING
                // =====================================================
                // Only show alert for non-authentication errors
                // Authentication errors are expected during initial load
                // when user isn't logged in yet

                // Convert message to lowercase for case-insensitive checking
                const errorMsg = message.toLowerCase();

                // Check if error is authentication-related
                // If not, show an alert to the user
                if (
                    !errorMsg.includes('scope') &&          // Missing permissions
                    !errorMsg.includes('unauthorized') &&   // Not logged in
                    !errorMsg.includes('guest')             // Guest user (not authenticated)
                ) {
                    // Show error alert for genuine errors
                    Alert.alert("Error", message);
                }

                // Note: Authentication errors are silently handled
                // This prevents annoying alerts when user opens app before logging in

            } finally {
                // Step 5: Always set loading to false when done
                // finally block runs regardless of success or error
                setLoading(false);
            }
        },
        // Dependencies: Re-create this function if fn or params change
        [fn, params]
    );

    // =====================================================
    // AUTOMATIC FETCH ON MOUNT
    // =====================================================

    /**
     * useEffect Hook
     *
     * Automatically fetches data when component mounts (or when dependencies change).
     * Only runs if skip is false.
     *
     * This is what makes the hook "automatic" - you don't need to manually call fetchData.
     */
    useEffect(() => {
        // Only fetch if not skipping
        if (!skip) {
            // Call fetchData and handle any errors
            fetchData().catch((err) => {
                // Safely log error without causing crashes
                // Uses optional chaining and fallback to String()
                console.error("Fetch error:", err?.message || String(err));
            });
        }
    }, [fetchData, skip]); // Re-run if fetchData or skip changes

    // =====================================================
    // MANUAL REFETCH FUNCTION
    // =====================================================

    /**
     * refetch Function
     *
     * Allows manual refetching of data.
     * Useful for:
     * - Pull-to-refresh functionality
     * - Retry after error
     * - Refresh button
     * - After creating/updating/deleting data
     *
     * @param newParams - Optional new parameters for the fetch
     * @returns Promise that resolves when fetch completes
     *
     * Example:
     * ```typescript
     * <Button onPress={() => refetch()} title="Refresh" />
     * <Button onPress={() => refetch({ category: "desserts" })} title="Show Desserts" />
     * ```
     */
    const refetch = async (newParams?: P) => fetchData(newParams ?? params);

    // =====================================================
    // RETURN VALUES
    // =====================================================

    /**
     * Return Object
     *
     * The hook returns an object with:
     * - data: The fetched data (null if not loaded yet or error occurred)
     * - loading: Boolean indicating if currently fetching
     * - error: Error message string (null if no error)
     * - refetch: Function to manually trigger a new fetch
     *
     * Usage pattern in component:
     * ```typescript
     * const { data, loading, error, refetch } = useAppwrite({ fn: getMenu });
     *
     * if (loading) return <Loading />;
     * if (error) return <Error message={error} onRetry={refetch} />;
     * return <MenuList items={data} onRefresh={refetch} />;
     * ```
     */
    return { data, loading, error, refetch };
};

export default useAppwrite;