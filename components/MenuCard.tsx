/**
 * MenuCard Component
 *
 * A card component displaying a single menu item.
 * Shows item image, name, price, and "Add to Cart" button.
 *
 * Features:
 * - Food image displayed at top (overflows slightly for visual effect)
 * - Item name with text truncation (prevents layout breaking)
 * - Price display with "From $" prefix
 * - Quick "Add to Cart" button (adds with empty customizations)
 * - Platform-specific shadow (Android elevation)
 *
 * Used in:
 * - Menu screen (grid/list of menu items)
 * - Search results
 * - Category-filtered views
 *
 * Design Pattern:
 * - Card layout (common in food delivery apps)
 * - Image floats above card (visual interest)
 * - One-tap add to cart (UX best practice)
 */

import {Text, TouchableOpacity, Image, Platform} from 'react-native'
import {MenuItem} from "@/type";
import {appwriteConfig} from "@/lib/appwrite";
import {useCartStore} from "@/store/cart.store";

/**
 * MenuCard Component
 *
 * Displays a single menu item as a card with image, details, and add-to-cart action.
 *
 * Props Destructuring Explained:
 * - item: { $id, image_url, name, price } - Extracts specific fields from MenuItem
 * - restaurantId - Needed to link cart item to its restaurant
 *
 * Why destructure?
 * - Cleaner code: Use `name` instead of `item.name`
 * - Clear dependencies: Shows exactly which fields are used
 * - Auto-completion: Better IDE support
 *
 * Usage:
 * ```typescript
 * <MenuCard
 *   item={menuItem}
 *   restaurantId={currentRestaurant.$id}
 * />
 * ```
 *
 * @param item - Menu item object from database
 * @param restaurantId - ID of the restaurant this item belongs to
 */
const MenuCard = ({
                      item: { $id, image_url, name, price },  // Destructure specific fields from item
                      restaurantId                             // Restaurant ID (needed for cart)
                  }: {
    item: MenuItem;        // Full menu item object
    restaurantId: string;  // Restaurant identifier
}) => {
    // =====================================================
    // IMAGE URL CONSTRUCTION
    // =====================================================

    /**
     * Construct Full Image URL with Project ID
     *
     * Appwrite images need project ID in URL for authentication/access.
     *
     * Why add project ID?
     * - Appwrite requires it to verify the request
     * - Without it: 401 Unauthorized or broken image
     * - Format: {base_url}?project={project_id}
     *
     * Example:
     * Base: https://cloud.appwrite.io/v1/storage/buckets/.../files/.../view
     * Full: https://cloud.appwrite.io/v1/storage/buckets/.../files/.../view?project=abc123
     *
     * Template literal syntax:
     * `${variable}` - Embeds variable value in string
     */
    const imageUrl = `${image_url}?project=${appwriteConfig.projectId}`;

    // =====================================================
    // CART STORE ACCESS
    // =====================================================

    /**
     * Get addItem Function from Cart Store
     *
     * Zustand store hook - extracts only the addItem function.
     * This function adds items to the global shopping cart.
     *
     * Why destructure?
     * - Only subscribes to addItem (not entire store)
     * - Prevents unnecessary re-renders
     * - Cleaner code
     */
    const { addItem } = useCartStore();

    return (
        // =====================================================
        // CARD CONTAINER
        // =====================================================

        /**
         * Main Card TouchableOpacity
         *
         * Outer container for the entire card.
         * TouchableOpacity makes whole card pressable (common pattern).
         *
         * Platform-Specific Shadow:
         * - Android: Uses elevation (native shadow system)
         *   - elevation: 10 = high shadow (prominent card)
         *   - shadowColor: '#878787' = medium gray shadow
         * - iOS: Uses Tailwind shadow classes (defined in 'menu-card')
         *   - No need for style prop on iOS
         *
         * Why Platform.OS check?
         * - Android and iOS handle shadows differently
         * - Avoid applying incompatible styles
         * - Ensures consistent appearance across platforms
         */
        <TouchableOpacity
            className="menu-card"
            style={Platform.OS === 'android'
                ? { elevation: 10, shadowColor: '#878787'}
                : {}
            }
        >
            {/* =====================================================
                FOOD IMAGE
                ===================================================== */}

            {/**
             * Menu Item Image
             *
             * Displays food photo at the top of card.
             *
             * Key styling choices:
             * - size-32: 128px × 128px (square image)
             * - absolute: Positioned absolutely (overlaps card edge)
             * - -top-10: Negative margin (-40px) pulls image UP
             *   - Creates "floating" effect above card
             *   - Common in modern card designs
             * - resizeMode="contain": Fits entire image without cropping
             *   - Alternative: "cover" (fills space, may crop)
             *
             * Why absolute positioning?
             * - Allows image to overflow card boundaries
             * - Creates depth and visual interest
             * - Draws attention to the food image
             *
             * Source URI:
             * - {{ uri: imageUrl }} syntax required for network images
             * - Local images use require('./image.png')
             */}
            <Image
                source={{ uri: imageUrl }}
                className="size-32 absolute -top-10"
                resizeMode="contain"
            />

            {/* =====================================================
                ITEM NAME
                ===================================================== */}

            {/**
             * Item Name Text
             *
             * Displays the menu item name (e.g., "Margherita Pizza").
             *
             * Key properties:
             * - text-center: Center-aligned text
             * - base-bold: Bold font weight (custom Tailwind class)
             * - text-dark-100: Dark text color
             * - mb-2: Margin bottom (8px spacing)
             * - numberOfLines={1}: Truncates to 1 line with ellipsis
             *   - Prevents long names from breaking layout
             *   - Example: "Super Delicious Amazing..." instead of wrapping
             *
             * Why numberOfLines?
             * - Consistent card heights in grid layouts
             * - Prevents text overflow breaking design
             * - Common pattern in card-based UIs
             */}
            <Text
                className="text-center base-bold text-dark-100 mb-2"
                numberOfLines={1}
            >
                {name}
            </Text>

            {/* =====================================================
                PRICE TEXT
                ===================================================== */}

            {/**
             * Price Display
             *
             * Shows item price with "From $" prefix.
             *
             * "From $" prefix explained:
             * - Indicates base price (before customizations)
             * - User might pay more if they add extras
             * - Common in restaurants with customizable items
             *
             * Styling:
             * - body-regular: Normal font weight
             * - text-gray-200: Lighter gray (secondary information)
             * - mb-4: Margin bottom (16px) - space before button
             */}
            <Text className="body-regular text-gray-200 mb-4">
                From ${price}
            </Text>

            {/* =====================================================
                ADD TO CART BUTTON
                ===================================================== */}

            {/**
             * Add to Cart Button
             *
             * Touchable button that adds item to shopping cart.
             * Quick add: No customization screen (adds with defaults).
             *
             * onPress Handler:
             * - Calls addItem() from cart store
             * - Passes item data including:
             *   - id: Database document ID
             *   - name: Item name
             *   - price: Base price
             *   - image_url: Full image URL with project ID
             *   - restaurantId: Which restaurant this is from
             *   - customizations: Empty array (no customizations for quick add)
             *
             * Why include restaurantId?
             * - Cart can have items from multiple restaurants
             * - Need to track which restaurant each item is from
             * - Used for order creation and delivery
             *
             * Why empty customizations array?
             * - This is a "quick add" button
             * - For customizations, would show modal/screen first
             * - Empty array = default/base item
             * - User can modify customizations in cart later
             *
             * UX Pattern:
             * - One-tap add (frictionless)
             * - For items needing customization, would use different flow:
             *   1. Tap card → Show details modal
             *   2. Select customizations → Add to cart
             */}
            <TouchableOpacity
                onPress={() => addItem({
                    id: $id,                    // Menu item database ID
                    name,                       // Item name (destructured above)
                    price,                      // Base price
                    image_url: imageUrl,        // Full URL with project ID
                    restaurantId,               // Restaurant identifier
                    customizations: []          // No customizations for quick add
                })}
            >
                {/**
                 * Button Text
                 *
                 * Styling:
                 * - paragraph-bold: Bold paragraph text
                 * - text-primary: Brand color (orange/amber)
                 * - + symbol: Visual indicator (add action)
                 *
                 * Accessibility note:
                 * - Text clearly describes action
                 * - Color provides visual emphasis
                 * - + symbol reinforces add action
                 */}
                <Text className="paragraph-bold text-primary">
                    Add to Cart +
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    )
}

// Export component for use in menu lists/grids
export default MenuCard