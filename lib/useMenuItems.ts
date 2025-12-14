/**
 * useMenuItems Custom Hook
 *
 * A specialized hook for restaurant owners to manage their menu.
 * This hook handles fetching and managing menu items and categories
 * for the currently logged-in restaurant owner.
 *
 * Purpose:
 * - Load the restaurant owner's menu items
 * - Load their categories
 * - Track loading state
 * - Provide reload functionality
 *
 * Used in:
 * - Restaurant owner dashboard
 * - Menu management screens
 * - Category management screens
 *
 * Flow:
 * 1. Get current user (restaurant owner)
 * 2. Find their restaurant by owner ID
 * 3. Load categories and menu items for that restaurant
 */

// lib/useMenuItems.ts

import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { Query } from "react-native-appwrite";
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";
import { MenuItem, Category } from "@/lib/menuTypes";

/**
 * useMenuItems Hook
 *
 * Main hook for restaurant menu management.
 * Automatically loads all data when component mounts.
 *
 * @returns Object containing menu data, loading state, and utility functions
 */
export const useMenuItems = () => {
    // =====================================================
    // STATE MANAGEMENT
    // =====================================================

    // Store array of menu items for the restaurant
    // Empty array initially, populated after fetch
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    // Store array of categories for the restaurant
    // Empty array initially, populated after fetch
    const [categories, setCategories] = useState<Category[]>([]);

    // Track loading state (true = fetching data, false = done)
    const [loading, setLoading] = useState(true);

    // Store the restaurant ID for the current owner
    // Used for filtering menu items and categories
    const [currentRestaurantId, setCurrentRestaurantId] = useState("");

    // =====================================================
    // CONFIGURATION CONSTANTS
    // =====================================================
    // Store collection IDs in constants for easy access
    // Avoids repeatedly accessing appwriteConfig.X throughout the code

    const DB_ID = appwriteConfig.databaseId;
    const MENU_ID = appwriteConfig.menuCollectionId;
    const CATEGORIES_ID = appwriteConfig.categoriesCollectionId;
    const RESTAURANTS_ID = appwriteConfig.restaurantCollectionId;

    // =====================================================
    // DATA FETCHING FUNCTIONS
    // =====================================================

    /**
     * Fetch Restaurant by Owner ID
     *
     * Finds the restaurant document owned by a specific user.
     * A restaurant owner can only have ONE restaurant.
     *
     * @param accountId - The account ID of the restaurant owner
     * @returns Restaurant document or null if not found
     */
    const fetchRestaurant = async (accountId: string) => {
        // Query database for restaurant where ownerId matches the accountId
        const result = await databases.listDocuments(
            DB_ID,
            RESTAURANTS_ID,
            [
                // Filter: Find restaurant where ownerId field equals the accountId
                Query.equal("ownerId", accountId)
            ]
        );

        // Return first document (should be only one) or null if not found
        // The ?? operator returns null if result.documents[0] is undefined
        return result.documents[0] ?? null;
    };

    /**
     * Fetch Categories for a Restaurant
     *
     * Gets all food categories (Pizza, Burgers, Desserts, etc.)
     * that belong to a specific restaurant.
     *
     * @param restaurantId - The restaurant's document ID
     * @returns Array of category documents
     */
    const fetchCategories = async (restaurantId: string) => {
        // Query database for categories belonging to this restaurant
        const result = await databases.listDocuments(
            DB_ID,
            CATEGORIES_ID,
            [
                // Filter: Find categories where restaurantId matches
                Query.equal("restaurantId", restaurantId)
            ]
        );

        // Cast the result to Category[] type
        // "as unknown as Category[]" is TypeScript casting
        // Needed because Appwrite returns generic Document type
        return result.documents as unknown as Category[];
    };

    /**
     * Fetch Menu Items for a Restaurant
     *
     * Gets all menu items (individual food items) that belong
     * to a specific restaurant.
     *
     * @param restaurantId - The restaurant's document ID
     * @returns Array of menu item documents
     */
    const fetchMenuItems = async (restaurantId: string) => {
        // Query database for menu items belonging to this restaurant
        const result = await databases.listDocuments(
            DB_ID,
            MENU_ID,
            [
                // Filter: Find menu items where restaurantId matches
                Query.equal("restaurantId", restaurantId)
            ]
        );

        // Cast result to MenuItem[] type for type safety
        return result.documents as unknown as MenuItem[];
    };

    // =====================================================
    // MAIN DATA LOADING FUNCTION
    // =====================================================

    /**
     * Load All Data
     *
     * Orchestrates the complete data loading process:
     * 1. Get current user (restaurant owner)
     * 2. Find their restaurant
     * 3. Load categories and menu items in parallel
     * 4. Update state with loaded data
     *
     * This function is called:
     * - On component mount (automatically via useEffect)
     * - Manually when refreshing data (after create/update/delete)
     */
    const loadData = async () => {
        try {
            // Step 1: Set loading state to show spinner/skeleton
            setLoading(true);

            // Step 2: Get the currently logged-in user
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            // Step 3: Find the restaurant owned by this user
            // Restaurant owner's accountId is used to find their restaurant
            const restaurant = await fetchRestaurant(user.accountId);
            if (!restaurant) throw new Error("No restaurant found");

            // Step 4: Store restaurant ID in state
            // This ID will be used throughout the app
            setCurrentRestaurantId(restaurant.$id);

            // Step 5: Fetch categories AND menu items in parallel
            // Promise.all executes both fetches simultaneously (faster than sequential)
            // Returns an array: [categories, menuItems]
            const [cats, items] = await Promise.all([
                fetchCategories(restaurant.$id),
                fetchMenuItems(restaurant.$id),
            ]);

            // Step 6: Update state with fetched data
            setCategories(cats);   // Update categories state
            setMenuItems(items);   // Update menu items state

        } catch (err) {
            // Handle any errors that occurred during data loading
            console.error("Load error:", err);
            // Show error alert to user
            Alert.alert("Error", (err as Error).message);
        } finally {
            // Step 7: Always set loading to false when done
            // finally block runs whether try succeeds or catch handles error
            // This prevents stuck loading spinners
            setLoading(false);
        }
    };

    // =====================================================
    // AUTOMATIC LOAD ON MOUNT
    // =====================================================

    /**
     * useEffect Hook - Auto-load on Mount
     *
     * Automatically loads all data when component first renders.
     * Empty dependency array [] means "run once on mount only".
     *
     * This is what makes the hook "automatic" - you don't need
     * to manually call loadData() in your component.
     */
    useEffect(() => {
        console.log("🟢 useMenuItems mounted, loading data...");
        // Call loadData when component mounts
        loadData();

        // Empty dependency array = only run once on mount
        // If we added dependencies, it would re-run when those change
    }, []);

    // =====================================================
    // RETURN VALUES
    // =====================================================

    /**
     * Return Object
     *
     * The hook returns an object with:
     * - menuItems: Array of menu items for this restaurant
     * - categories: Array of categories for this restaurant
     * - loading: Boolean indicating if data is being loaded
     * - currentRestaurantId: ID of the current restaurant
     * - setLoading: Function to manually control loading state
     * - loadData: Function to manually reload all data
     *
     * Usage in Component:
     * ```typescript
     * const {
     *   menuItems,
     *   categories,
     *   loading,
     *   loadData
     * } = useMenuItems();
     *
     * // Show loading spinner while fetching
     * if (loading) return <Loading />;
     *
     * // Display menu items
     * return (
     *   <MenuList
     *     items={menuItems}
     *     categories={categories}
     *     onRefresh={loadData} // Reload data on pull-to-refresh
     *   />
     * );
     * ```
     *
     * Why expose setLoading and loadData?
     * - setLoading: Useful for showing loading state during create/update/delete
     * - loadData: Allows manual refresh after data changes
     *   Example: After creating a menu item, call loadData() to refresh the list
     */
    return {
        menuItems,            // Array of menu items
        categories,           // Array of categories
        loading,              // Loading state
        currentRestaurantId,  // Current restaurant ID
        setLoading,           // Function to set loading state
        loadData,             // Function to reload all data
    };
};