// ==================== IMPORTS ====================
import {FlatList, Text, View} from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import useAppwrite from "@/lib/useAppwrite";  // Custom hook for data fetching
import {getCategories, getMenu} from "@/lib/appwrite";  // API functions
import {useLocalSearchParams} from "expo-router";  // Get URL parameters
import {useEffect} from "react";
import CartButton from "@/components/CartButton";
import cn from "clsx";  // Utility for conditional classNames
import MenuCard from "@/components/MenuCard";
import {MenuItem, Category} from "@/type";
import Filter from "@/components/Filter";
import SearchBar from "@/components/SearchBar";

// ==================== SEARCH SCREEN COMPONENT ====================
const Search = () => {
    // ==================== URL PARAMETERS ====================
    // Extract search parameters from URL
    // Example: /search?category=pizza&query=margherita
    const { category, query } = useLocalSearchParams<{query: string; category: string}>()

    // ==================== DATA FETCHING ====================
    // Fetch menu items with optional filters (category, query)
    // limit: 6 controls how many items to fetch at once (pagination)
    const { data, refetch, loading } = useAppwrite({
        fn: getMenu,
        params: { category, query, limit: 6 }
    });

    // Fetch all categories for the filter component
    const { data: categories } = useAppwrite({ fn: getCategories });

    // ==================== REFETCH ON FILTER CHANGE ====================
    // When category or query changes, refetch menu items
    useEffect(() => {
        refetch({ category, query, limit: 6 });

        // Debug logs for troubleshooting
        console.log("Category:", category);
        console.log("Query:", query);
        console.log("Fetched menu:", data);

        // ⚠️ CRITICAL VALIDATION: Check if restaurantId exists
        // This is important because cart needs restaurantId to create orders
        if (data && data.length > 0) {
            console.log("🔍 First menu item structure:", {
                id: data[0].$id,
                name: data[0].name,
                restaurantId: data[0].restaurantId, // Must exist!
                price: data[0].price
            });

            // Show error if restaurantId is missing
            if (!data[0].restaurantId) {
                console.error("❌ CRITICAL: Menu items missing restaurantId field!");
                console.error("❌ Your menu_items collection needs a restaurantId attribute");
            }
        }
    }, [category, query]);  // Re-run when these change

    // ==================== RENDER UI ====================
    return (
        <SafeAreaView className="bg-white h-full">
            {/* FlatList: Efficient list rendering with 2-column grid */}
            <FlatList
                data={data}  // Menu items array

                // ==================== RENDER EACH MENU ITEM ====================
                renderItem={({ item, index }) => {
                    // Calculate if item is in left or right column
                    // Even indices (0, 2, 4...) → Left column (first in row)
                    // Odd indices (1, 3, 5...) → Right column (second in row)
                    const isFirstRightColItem = index % 2 === 0;

                    // Extract and validate restaurantId
                    const restaurantId = item.restaurantId;

                    // Log error if restaurantId is missing or invalid
                    if (!restaurantId || restaurantId === "unknown") {
                        console.error("❌ Menu item missing valid restaurantId:", {
                            itemId: item.$id,
                            itemName: item.name,
                            restaurantId: restaurantId
                        });
                    }

                    return (
                        // Container for each card
                        // max-w-[48%] ensures two columns with gap
                        // Conditional margin: right column items have no top margin
                        <View className={cn(
                            "flex-1 max-w-[48%]",
                            !isFirstRightColItem ? 'mt-10': 'mt-0'
                        )}>
                            <MenuCard
                                item={item as MenuItem}
                                restaurantId={restaurantId || "unknown"}  // Fallback to "unknown"
                            />
                        </View>
                    )
                }}

                keyExtractor={item => item.$id}  // Unique key for each item
                numColumns={2}  // 2-column grid layout
                columnWrapperClassName="gap-7"  // Horizontal gap between columns
                contentContainerClassName="gap-7 px-5 pb-32"  // Vertical gap, padding

                // ==================== LIST HEADER ====================
                // Content shown at top of list (above menu items)
                ListHeaderComponent={() => (
                    <View className="my-5 gap-5">
                        {/* Top bar: Title + Cart button */}
                        <View className="flex-between flex-row w-full">
                            <View className="flex-start">
                                <Text className="small-bold uppercase text-primary">Search</Text>
                                <View className="flex-start flex-row gap-x-1 mt-0.5">
                                    <Text className="paragraph-semibold text-dark-100">
                                        Find your favorite food
                                    </Text>
                                </View>
                            </View>

                            <CartButton />
                        </View>

                        {/* Search input */}
                        <SearchBar />

                        {/* Category filter chips */}
                        <Filter categories={(categories as Category[]) || []} />
                    </View>
                )}

                // ==================== EMPTY STATE ====================
                // Shown when no results found (only if not loading)
                ListEmptyComponent={() => !loading && <Text>No results</Text>}
            />
        </SafeAreaView>
    )
}

export default Search


// ==================== KEY CONCEPTS ====================
/*
1. URL PARAMETERS:
   useLocalSearchParams extracts query string from URL
   Example URL: /search?category=pizza&query=margherita
   Result: { category: "pizza", query: "margherita" }

2. REACTIVE FILTERING:
   useEffect watches [category, query]
   When user changes filter → URL updates → useEffect triggers → refetch()
   This creates real-time filtered results

3. TWO-COLUMN GRID MATH:
   numColumns={2} creates 2-column layout
   max-w-[48%] per item (48% × 2 + gap = ~100%)
   
   Index logic for staggered margins:
   index % 2 === 0 → Left column (no top margin)
   index % 2 === 1 → Right column (add top margin)
   
   Visual result:
   [Card 0]  [Card 1 (pushed down)]
   [Card 2]  [Card 3 (pushed down)]

4. CRITICAL DATA VALIDATION:
   restaurantId is REQUIRED for cart functionality
   Without it, orders cannot be created
   
   Validation flow:
   - Check if restaurantId exists
   - Log error if missing
   - Pass "unknown" as fallback (will show in logs)

5. FLATLIST PROPS:
   - data: Array to render
   - renderItem: How to render each item
   - keyExtractor: Unique identifier
   - numColumns: Grid columns
   - columnWrapperClassName: Styles for row wrapper
   - contentContainerClassName: Styles for scroll container
   - ListHeaderComponent: Content at top
   - ListEmptyComponent: Shown when data is empty

6. CONDITIONAL RENDERING:
   ListEmptyComponent={() => !loading && <Text>No results</Text>}
   
   Only show "No results" if:
   - NOT loading (avoid showing while fetching)
   - AND data is empty

7. DEPENDENCY ARRAY:
   useEffect(..., [category, query])
   
   Runs when:
   - Component mounts (first time)
   - category changes
   - query changes
   
   Does NOT run on other state changes

8. CN (CLSX) UTILITY:
   cn("base-class", condition ? "class-if-true" : "class-if-false")
   
   Example:
   cn("flex-1 max-w-[48%]", !isFirstRightColItem ? 'mt-10' : 'mt-0')
   
   Result for index 0: "flex-1 max-w-[48%] mt-0"
   Result for index 1: "flex-1 max-w-[48%] mt-10"

9. TYPE CASTING:
   item as MenuItem
   categories as Category[]
   
   Tells TypeScript to treat data as specific type
   Used when we know the type but TypeScript doesn't infer it

10. FALLBACK VALUES:
    restaurantId || "unknown"
    categories || []
    
    If left side is falsy (null, undefined, ""), use right side
    Prevents crashes from missing data
*/