// Cart Button Component
// A reusable shopping cart button that displays the number of items in the cart
// Used in headers across the app to provide quick access to the cart screen

// Import React Native core components
import { View, Text, TouchableOpacity, Image } from 'react-native'

// Import React (though not strictly necessary with modern React)
import React from 'react'

// Import image assets from constants
import { images } from "@/constants";

// Import cart state management store (Zustand)
import { useCartStore } from "@/store/cart.store";

// Import router for navigation
import { router } from "expo-router";

// ===== CART BUTTON COMPONENT =====
// A functional component that renders a cart icon with an optional badge
const CartButton = () => {
    // ===== CART STATE ACCESS =====
    // Extract getTotalItems function from cart store
    // useCartStore is a Zustand store managing global shopping cart state
    const { getTotalItems } = useCartStore();

    // Get the current total number of items in the cart
    // This is a computed value (might be sum of quantities or unique items)
    const totalItems = getTotalItems();

    // ===== COMPONENT RENDER =====
    return (
        // ===== TOUCHABLE BUTTON =====
        // TouchableOpacity provides tap feedback (slight fade when pressed)
        <TouchableOpacity
            className="cart-btn"                  // Custom CSS class for styling
            onPress={() => router.push('/cart')}  // Navigate to cart screen when tapped
        >
            {/* ===== CART ICON IMAGE ===== */}
            {/* Display shopping bag icon from assets */}
            <Image
                source={images.bag}    // Image source (shopping bag icon)
                className="size-5"     // Tailwind class: width and height of 1.25rem (20px)
                resizeMode="contain"   // Scale image to fit without cropping
            />

            {/* ===== BADGE (ITEM COUNT) ===== */}
            {/* Conditionally render badge only when cart has items */}
            {/* Short-circuit evaluation: only renders if totalItems > 0 is true */}
            {totalItems > 0 && (
                <View className="cart-badge">
                    {/* Display number of items in cart */}
                    <Text className="small-bold text-white">{totalItems}</Text>
                </View>
            )}
        </TouchableOpacity>
    )
}

// Export as default for importing in other files
export default CartButton

// ===== HOW THIS COMPONENT WORKS =====
/**
 * COMPONENT BEHAVIOR:
 *
 * 1. EMPTY CART (totalItems = 0):
 *    - Shows only the bag icon
 *    - No badge appears
 *    - Still clickable to go to cart screen
 *
 * 2. CART WITH ITEMS (totalItems > 0):
 *    - Shows bag icon
 *    - Badge appears in corner with count
 *    - Number updates automatically when cart changes
 *
 * CONDITIONAL RENDERING:
 * {totalItems > 0 && <Badge />}
 * - If totalItems is 0 → false && <Badge /> → doesn't render
 * - If totalItems is 3 → true && <Badge /> → renders <Badge />
 *
 * STATE MANAGEMENT:
 * - useCartStore() connects to global cart state
 * - When cart updates anywhere in app, this component re-renders
 * - No need to pass props - directly reads from store
 *
 * NAVIGATION:
 * router.push('/cart')
 * - Navigates to the /cart screen
 * - Uses Expo Router file-based routing
 * - Equivalent to clicking a link
 *
 * STYLING APPROACH:
 * - "cart-btn": Custom class defined in globals.css
 * - "cart-badge": Custom class for badge positioning
 * - "size-5": Tailwind utility class (width + height)
 * - "small-bold": Custom typography class
 * - "text-white": Tailwind text color class
 */

// ===== TYPICAL USAGE IN OTHER COMPONENTS =====
/**
 * Example: In a header component
 *
 * import CartButton from "@/components/CartButton";
 *
 * function Header() {
 *   return (
 *     <View className="header">
 *       <Logo />
 *       <SearchBar />
 *       <CartButton />  // Just drop it in - no props needed!
 *     </View>
 *   )
 * }
 *
 * BENEFITS:
 * - Reusable across multiple screens
 * - Automatically updates when cart changes
 * - Consistent cart access throughout app
 * - No prop drilling required
 */

// ===== RELATED CONCEPTS =====
/**
 * ZUSTAND STORE (useCartStore):
 * - Global state management (like Redux but simpler)
 * - Stores cart items, quantities, totals
 * - Functions: addItem(), removeItem(), getTotalItems(), etc.
 * - Any component can access cart state
 *
 * CONDITIONAL RENDERING PATTERNS:
 * 1. && operator:     condition && <Component />
 * 2. Ternary:         condition ? <Yes /> : <No />
 * 3. If statement:    if (condition) return <Component />
 *
 * NAVIGATION METHODS:
 * - router.push()     - Navigate forward (adds to stack)
 * - router.replace()  - Replace current screen
 * - router.back()     - Go back one screen
 * - router.navigate() - Go to specific screen by name
 */