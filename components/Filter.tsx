/**
 * Filter Component
 *
 * A horizontal scrollable category filter for the menu screen.
 * Allows users to filter menu items by category (Pizza, Burgers, Desserts, etc.)
 *
 * Features:
 * - Horizontal scrollable list of categories
 * - "All" option to show all menu items
 * - Active state indication (highlighted category)
 * - URL parameter synchronization (category reflected in URL)
 * - Platform-specific shadows (Android elevation)
 *
 * User Flow:
 * 1. User sees category chips (All, Pizza, Burgers, etc.)
 * 2. User taps a category
 * 3. Active category is highlighted (orange background)
 * 4. URL updates with selected category (?category=pizza_id)
 * 5. Parent component detects URL change and filters menu
 */

import {View, Text, FlatList, TouchableOpacity, Platform} from 'react-native'
import {Category} from "@/type";
import {router, useLocalSearchParams} from "expo-router";
import {useState} from "react";
// Import clsx for conditional class name merging
import cn from "clsx";

/**
 * Filter Component
 *
 * Renders a horizontal list of category filters.
 * Syncs with URL parameters for deep linking and state persistence.
 *
 * Usage:
 * ```typescript
 * const { data: categories } = useAppwrite({ fn: getCategories });
 *
 * <Filter categories={categories || []} />
 * ```
 *
 * @param categories - Array of category objects from database
 */
const Filter = ({ categories }: { categories: Category[] }) => {
    // =====================================================
    // URL PARAMETER HANDLING
    // =====================================================

    /**
     * Get Current URL Search Parameters
     *
     * useLocalSearchParams reads query parameters from the URL.
     * Example URL: /menu?category=abc123&query=pizza
     *
     * Returns: { category: "abc123", query: "pizza" }
     *
     * Why use URL parameters?
     * - Deep linking: Can share URLs with filters applied
     * - State persistence: Refresh page maintains filters
     * - Back button works correctly
     * - Better UX than storing filter in local state only
     */
    const searchParams = useLocalSearchParams();

    // =====================================================
    // LOCAL STATE - ACTIVE CATEGORY
    // =====================================================

    /**
     * Track Active Category
     *
     * Stores the currently selected category ID.
     * Initialized from URL parameter (if exists) or empty string.
     *
     * Why use both state AND URL params?
     * - State: For immediate UI updates (fast, no flicker)
     * - URL: For persistence and sharing
     *
     * Flow:
     * 1. Component mounts → Read from URL → Set state
     * 2. User clicks filter → Update state → Update URL
     * 3. URL change → Parent re-fetches data
     */
    const [active, setActive] = useState(searchParams.category || '');

    // =====================================================
    // FILTER SELECTION HANDLER
    // =====================================================

    /**
     * Handle Category Selection
     *
     * Called when user taps on a category filter.
     * Updates both local state and URL parameters.
     *
     * Two cases:
     * 1. "All" selected: Remove category parameter (show all items)
     * 2. Specific category: Set category parameter (filter items)
     *
     * @param id - Category ID (or 'all' for no filter)
     */
    const handlePress = (id: string) => {
        // Step 1: Update local state immediately (instant UI feedback)
        setActive(id);

        // Step 2: Update URL parameters
        if(id === 'all') {
            // "All" selected: Remove category parameter from URL
            // router.setParams({ category: undefined }) removes the parameter
            // URL changes from: /menu?category=abc123 → /menu
            router.setParams({ category: undefined });
        } else {
            // Specific category selected: Set category parameter in URL
            // URL changes from: /menu → /menu?category=abc123
            router.setParams({ category: id });
        }

        // Note: When URL parameters change, the parent component's
        // useEffect (watching searchParams) will re-fetch filtered data
    };

    // =====================================================
    // PREPARE FILTER DATA
    // =====================================================

    /**
     * Build Filter List with "All" Option
     *
     * Adds an "All" category at the beginning of the categories list.
     * "All" shows all menu items without filtering.
     *
     * Ternary operator explained:
     * - If categories exist: Add "All" + spread categories
     * - If categories is null/undefined: Just show "All"
     *
     * Type annotation explained:
     * (Category | { $id: string; name: string })[]
     * - Array of items that can be either:
     *   - Full Category object (from database)
     *   - Simple object with $id and name (for "All")
     * - This is a union type (either/or)
     *
     * Spread operator (...categories):
     * - Takes array and spreads items into new array
     * - [{ $id: 'all', name: 'All' }, ...categories]
     * - Equivalent to: [{ $id: 'all', name: 'All' }, cat1, cat2, cat3]
     */
    const filterData: (Category | { $id: string; name: string })[] = categories
        ? [{ $id: 'all', name: 'All' }, ...categories]  // With categories
        : [{ $id: 'all', name: 'All' }];                // Without categories (fallback)

    // =====================================================
    // RENDER HORIZONTAL LIST
    // =====================================================

    return (
        /**
         * FlatList Component
         *
         * Efficient list renderer from React Native.
         * Better than map() for large lists (virtualization, recycling).
         *
         * Configuration:
         * - horizontal: Scroll left/right instead of up/down
         * - showsHorizontalScrollIndicator: Hide scrollbar (cleaner look)
         * - contentContainerClassName: Styling for list container
         * - keyExtractor: Unique key for each item (performance)
         * - renderItem: How to render each category chip
         */
        <FlatList
            // Array of items to render
            data={filterData}

            /**
             * keyExtractor Function
             * 
             * Provides unique key for each list item.
             * Required by FlatList for performance optimization.
             * 
             * Keys help React:
             * - Identify which items changed
             * - Reuse DOM/native elements
             * - Avoid unnecessary re-renders
             * 
             * Uses $id from each category (unique database ID)
             */
            keyExtractor={(item) => item.$id}

            /**
             * horizontal Property
             * 
             * Makes list scroll horizontally (left/right).
             * Default is vertical (up/down).
             * 
             * Perfect for category filters, image galleries, etc.
             */
            horizontal

            /**
             * showsHorizontalScrollIndicator
             * 
             * Hides the scroll indicator (scrollbar).
             * false = cleaner look, user still knows it's scrollable
             * 
             * Common pattern for horizontal category lists
             */
            showsHorizontalScrollIndicator={false}

            /**
             * contentContainerClassName
             * 
             * Tailwind classes for the list container (not individual items).
             * - gap-x-2: Horizontal spacing between items (8px)
             * - pb-3: Padding bottom (12px) - prevents shadow clipping
             */
            contentContainerClassName="gap-x-2 pb-3"

            /**
             * renderItem Function
             * 
             * How to render each category as a filter chip.
             * Receives { item, index } but we only need item.
             * 
             * Returns a TouchableOpacity (pressable chip) for each category.
             */
            renderItem={({ item }) => (
                // =====================================================
                // FILTER CHIP (Each Category Button)
                // =====================================================

                <TouchableOpacity
                    // Redundant key (FlatList uses keyExtractor, but doesn't hurt)
                    key={item.$id}

                    /**
                     * Dynamic Styling with cn()
                     * 
                     * Base class 'filter' + conditional background color:
                     * - Active category: 'bg-amber-500' (orange)
                     * - Inactive: 'bg-white' (white)
                     * 
                     * Ternary operator checks if this item is active:
                     * active === item.$id ? (true) : (false)
                     */
                    className={cn(
                        'filter',  // Base styling (padding, border radius, etc.)
                        active === item.$id ? 'bg-amber-500' : 'bg-white'
                    )}

                    /**
                     * Platform-Specific Shadow
                     * 
                     * Android and iOS handle shadows differently:
                     * 
                     * Android:
                     * - Uses 'elevation' property
                     * - elevation: 5 creates medium shadow
                     * - shadowColor: '#878787' (gray shadow)
                     * 
                     * iOS:
                     * - Uses shadowOffset, shadowOpacity, shadowRadius
                     * - These are typically set in CSS/Tailwind
                     * - So we pass empty object {} (use Tailwind shadow)
                     * 
                     * Why Platform.OS check?
                     * - Avoid unnecessary properties on wrong platform
                     * - Tailwind shadows work on iOS but not Android
                     * - Need native elevation on Android
                     */
                    style={Platform.OS === 'android'
                        ? { elevation: 5, shadowColor: '#878787'}
                        : {}
                    }

                    /**
                     * onPress Handler
                     * 
                     * Calls handlePress with this category's ID.
                     * Updates active state and URL parameters.
                     */
                    onPress={() => handlePress(item.$id)}
                >
                    {/* =====================================================
                        CATEGORY TEXT
                        ===================================================== */}

                    {/**
                     * Category Name Text
                     *
                     * Dynamic text color based on active state:
                     * - Active: 'text-white' (white text on orange background)
                     * - Inactive: 'text-gray-200' (gray text on white background)
                     *
                     * Ensures good contrast and readability in both states.
                     */}
                    <Text
                        className={cn(
                            'body-medium',  // Base text styling
                            active === item.$id ? 'text-white' : 'text-gray-200'
                        )}
                    >
                        {item.name}
                    </Text>
                </TouchableOpacity>
            )}
        />
    )
}

// Export component for use in menu/home screens
export default Filter