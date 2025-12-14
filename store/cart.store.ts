/**
 * Shopping Cart Store (Zustand)
 *
 * Global state management for the shopping cart using Zustand.
 * This store manages:
 * - Cart items (menu items added by customer)
 * - Quantities for each item
 * - Customizations (toppings, size, etc.)
 *
 * Key Feature: Customization-Aware Cart
 * - Same menu item with different customizations = separate cart entries
 * - Example: "Large Pizza with Extra Cheese" ≠ "Medium Pizza with No Cheese"
 *
 * Used throughout the app to:
 * - Add items from menu to cart
 * - Update quantities
 * - Remove items
 * - Calculate totals
 * - Checkout process
 */

import { create } from "zustand";

/**
 * CartItem Interface
 *
 * Defines the structure of an item in the shopping cart.
 * Each cart item is a menu item plus quantity and customizations.
 */
export interface CartItem {
    id: string;              // Menu item ID (from database)
    name: string;            // Item name (e.g., "Margherita Pizza")
    price: number;           // Price per unit (base price)
    quantity: number;        // How many of this item in cart
    image_url: string;       // Image URL for display in cart
    restaurantId: string;    // Which restaurant this item is from
    customizations?: any;    // Optional customizations (toppings, size, etc.)
    // Using 'any' for flexibility - can be array, object, or any structure
}

/**
 * CartStore Interface
 *
 * Defines all the state and actions for the cart store.
 */
interface CartStore {
    // =====================================================
    // STATE (Data)
    // =====================================================

    items: CartItem[];  // Array of all items currently in cart

    // =====================================================
    // ACTIONS (Functions to modify cart)
    // =====================================================

    /**
     * Add Item to Cart
     * Adds a new item or increases quantity if already exists
     * Takes into account customizations when checking for duplicates
     *
     * @param item - Item to add (quantity is optional, defaults to 1)
     */
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;

    /**
     * Remove Item from Cart
     * Completely removes an item from cart
     *
     * @param id - Menu item ID
     * @param customizations - Item customizations (must match to remove correct item)
     */
    removeItem: (id: string, customizations?: any) => void;

    /**
     * Update Item Quantity
     * Directly set quantity to a specific number
     *
     * @param id - Menu item ID
     * @param quantity - New quantity (if 0 or less, removes item)
     */
    updateQuantity: (id: string, quantity: number) => void;

    /**
     * Increase Quantity by 1
     * Increments quantity of a specific cart item
     *
     * @param id - Menu item ID
     * @param customizations - Item customizations
     */
    increaseQty: (id: string, customizations?: any) => void;

    /**
     * Decrease Quantity by 1
     * Decrements quantity of a specific cart item (minimum 1)
     *
     * @param id - Menu item ID
     * @param customizations - Item customizations
     */
    decreaseQty: (id: string, customizations?: any) => void;

    /**
     * Clear Entire Cart
     * Removes all items from cart
     */
    clearCart: () => void;

    /**
     * Get Total Number of Items
     * Calculates total quantity across all cart items
     *
     * @returns Total quantity (sum of all item quantities)
     */
    getTotalItems: () => number;

    /**
     * Get Total Cart Price
     * Calculates total cost of all items in cart
     *
     * @returns Total price in dollars
     */
    getTotalPrice: () => number;
}

/**
 * Create Cart Store
 *
 * Zustand store for managing shopping cart state globally.
 *
 * Parameters:
 * - set: Function to update state
 * - get: Function to read current state (useful in actions)
 *
 * Usage in Components:
 * ```typescript
 * import { useCartStore } from '@/store/cart.store';
 *
 * function MenuItem({ item }) {
 *   const addItem = useCartStore(state => state.addItem);
 *
 *   return (
 *     <button onClick={() => addItem({ ...item, restaurantId: "123" })}>
 *       Add to Cart
 *     </button>
 *   );
 * }
 * ```
 */
export const useCartStore = create<CartStore>((set, get) => ({
    // =====================================================
    // INITIAL STATE
    // =====================================================

    items: [],  // Start with empty cart

    // =====================================================
    // ADD ITEM ACTION
    // =====================================================

    /**
     * Add Item to Cart
     *
     * Smart adding logic:
     * 1. Check if item with same ID AND customizations already exists
     * 2. If exists: Increase quantity of existing item
     * 3. If new: Add as new cart entry
     *
     * Why compare customizations?
     * - Same menu item with different customizations = different products
     * - Example: "Pizza + Extra Cheese" ≠ "Pizza + No Cheese"
     * - Must be separate cart entries so user can adjust each independently
     *
     * How comparison works:
     * - JSON.stringify converts objects to strings
     * - Compare strings to check if customizations are identical
     * - Example: {size: "large"} → '{"size":"large"}'
     */
    addItem: (item) => {
        // Step 1: Find if item with same ID and customizations already exists
        const existingItem = get().items.find(
            (i) =>
                i.id === item.id &&  // Same menu item ID
                // Compare customizations as strings (deep equality check)
                JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
        );

        if (existingItem) {
            // Case 1: Item exists - UPDATE quantity
            // Map through items and update the matching one
            set({
                items: get().items.map((i) =>
                    // Find the matching item (same ID and customizations)
                    i.id === item.id &&
                    JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
                        // Update: Keep all properties, just increase quantity
                        // Add the new quantity (or 1 if not specified) to existing quantity
                        ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                        // Keep other items unchanged
                        : i
                ),
            });
        } else {
            // Case 2: Item doesn't exist - ADD new entry
            // Add to the end of the items array
            set({
                items: [
                    ...get().items,  // Keep all existing items
                    {
                        ...item,  // Spread all item properties
                        quantity: item.quantity || 1  // Set quantity (default to 1)
                    }
                ],
            });
        }
    },

    // =====================================================
    // REMOVE ITEM ACTION
    // =====================================================

    /**
     * Remove Item from Cart
     *
     * Completely removes an item from cart.
     * Must match both ID and customizations to remove correct item.
     *
     * Why both ID and customizations?
     * - User might have same item with different customizations
     * - Must remove only the exact match, not all items with that ID
     *
     * @param id - Menu item ID
     * @param customizations - Item customizations
     */
    removeItem: (id, customizations) => {
        set({
            // Filter keeps items that DON'T match
            // ! negates the condition (keep everything except the match)
            items: get().items.filter(
                (item) => !(
                    item.id === id &&  // Same menu item ID
                    // Same customizations (compared as strings)
                    JSON.stringify(item.customizations) === JSON.stringify(customizations)
                )
            )
        });
    },

    // =====================================================
    // UPDATE QUANTITY ACTION
    // =====================================================

    /**
     * Update Item Quantity
     *
     * Directly sets quantity to a specific number.
     * If quantity is 0 or less, removes the item entirely.
     *
     * Note: This doesn't consider customizations (updates by ID only)
     * For customization-aware updates, use increaseQty/decreaseQty
     *
     * @param id - Menu item ID
     * @param quantity - New quantity value
     */
    updateQuantity: (id, quantity) => {
        // If quantity is 0 or negative, remove the item
        if (quantity <= 0) {
            get().removeItem(id);
        } else {
            // Otherwise, update the quantity
            set({
                items: get().items.map((item) =>
                    item.id === id
                        ? { ...item, quantity }  // Update quantity
                        : item  // Keep other items unchanged
                ),
            });
        }
    },

    // =====================================================
    // INCREASE QUANTITY ACTION
    // =====================================================

    /**
     * Increase Quantity by 1
     *
     * Increments quantity of a specific cart item.
     * Takes into account customizations to update the correct item.
     *
     * Used in cart UI for "+" buttons.
     *
     * @param id - Menu item ID
     * @param customizations - Item customizations
     */
    increaseQty: (id, customizations) => {
        // set() with callback gives you current state
        set((state) => ({
            items: state.items.map((item) =>
                // Find matching item (same ID and customizations)
                item.id === id &&
                JSON.stringify(item.customizations) === JSON.stringify(customizations)
                    // Increase quantity by 1
                    ? { ...item, quantity: item.quantity + 1 }
                    // Keep other items unchanged
                    : item
            ),
        }));
    },

    // =====================================================
    // DECREASE QUANTITY ACTION
    // =====================================================

    /**
     * Decrease Quantity by 1
     *
     * Decrements quantity of a specific cart item.
     * Minimum quantity is 1 (won't go below 1).
     * To remove item completely, use removeItem().
     *
     * Used in cart UI for "-" buttons.
     *
     * Math.max(1, quantity - 1) explained:
     * - Returns the larger of: 1 or (quantity - 1)
     * - If quantity is 2: max(1, 1) = 1 ✓
     * - If quantity is 1: max(1, 0) = 1 ✓ (prevents going to 0)
     *
     * @param id - Menu item ID
     * @param customizations - Item customizations
     */
    decreaseQty: (id, customizations) => {
        set((state) => ({
            items: state.items.map((item) =>
                // Find matching item (same ID and customizations)
                item.id === id &&
                JSON.stringify(item.customizations) === JSON.stringify(customizations)
                    // Decrease quantity but don't go below 1
                    ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                    // Keep other items unchanged
                    : item
            ),
        }));
    },

    // =====================================================
    // CLEAR CART ACTION
    // =====================================================

    /**
     * Clear Entire Cart
     *
     * Removes all items from cart.
     * Used after successful checkout or when user manually clears cart.
     */
    clearCart: () => {
        set({ items: [] });  // Reset to empty array
    },

    // =====================================================
    // COMPUTED VALUES (Getters)
    // =====================================================

    /**
     * Get Total Number of Items
     *
     * Calculates total quantity across all cart items.
     *
     * How reduce() works:
     * - Iterates through all items
     * - Accumulates a single value (total)
     * - For each item: total = total + item.quantity
     * - Initial value: 0
     *
     * Example:
     * - Cart: [{ quantity: 2 }, { quantity: 3 }, { quantity: 1 }]
     * - Result: 0 + 2 + 3 + 1 = 6 total items
     *
     * @returns Total quantity of all items
     */
    getTotalItems: () => {
        return get().items.reduce(
            (total, item) => total + item.quantity,  // Add each item's quantity
            0  // Start with 0
        );
    },

    /**
     * Get Total Cart Price
     *
     * Calculates total cost of all items in cart.
     *
     * Formula for each item: price × quantity
     * Then sum all items.
     *
     * Example:
     * - Item 1: $10 × 2 = $20
     * - Item 2: $15 × 1 = $15
     * - Total: $20 + $15 = $35
     *
     * @returns Total price in dollars
     */
    getTotalPrice: () => {
        return get().items.reduce(
            (total, item) => total + (item.price * item.quantity),  // Add price × quantity
            0  // Start with $0
        );
    },
}));