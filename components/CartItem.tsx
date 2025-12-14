// Import the cart store hook to access cart management functions (add, remove, update quantities)
import { useCartStore } from "@/store/cart.store";
// Import the TypeScript type definition for cart items to ensure type safety
import { CartItemType } from "@/type";
// Import React Native components for building the mobile UI
import { Image, Text, TouchableOpacity, View } from "react-native";
// Import image assets used in the component (plus, minus, trash icons)
import {images} from "@/constants";

/**
 * CartItem Component
 *
 * This component displays a single item in the shopping cart with:
 * - Product image and name
 * - Price display
 * - Quantity controls (increase/decrease buttons)
 * - Remove item button
 *
 * @param item - The cart item object containing product details, quantity, and customizations
 */
const CartItem = ({ item }: { item: CartItemType }) => {
    // Destructure cart management functions from the Zustand store
    // - increaseQty: Adds one more of this item to the cart
    // - decreaseQty: Removes one of this item (or decreases quantity)
    // - removeItem: Completely removes this item from the cart
    const { increaseQty, decreaseQty, removeItem } = useCartStore();

    return (
        // Main container for the cart item with Tailwind CSS styling
        <View className="cart-item">
            {/* Left section: Product image and details */}
            <View className="flex flex-row items-center gap-x-3">
                {/* Product image container */}
                <View className="cart-item__image">
                    <Image
                        // Display the product image from a URL
                        source={{ uri: item.image_url }}
                        // 80% of container size (size-4/5) with rounded corners
                        className="size-4/5 rounded-lg"
                        // Cover mode ensures image fills the space while maintaining aspect ratio
                        resizeMode="cover"
                    />
                </View>

                {/* Product information and quantity controls */}
                <View>
                    {/* Product name with bold dark text */}
                    <Text className="base-bold text-dark-100">{item.name}</Text>

                    {/* Product price in primary color (orange) with bold styling */}
                    <Text className="paragraph-bold text-primary mt-1">
                        ${item.price}
                    </Text>

                    {/* Quantity adjustment controls */}
                    <View className="flex flex-row items-center gap-x-4 mt-2">
                        {/* Decrease quantity button */}
                        <TouchableOpacity
                            // When pressed, decrease the quantity of this specific item
                            // Pass item.id and customizations to identify the exact cart entry
                            onPress={() => decreaseQty(item.id, item.customizations!)}
                            className="cart-item__actions"
                        >
                            {/* Minus icon image with orange tint color */}
                            <Image
                                source={images.minus}
                                className="size-1/2"
                                resizeMode="contain"
                                tintColor={"#FF9C01"} // Orange color
                            />
                        </TouchableOpacity>

                        {/* Display current quantity of this item */}
                        <Text className="base-bold text-dark-100">{item.quantity}</Text>

                        {/* Increase quantity button */}
                        <TouchableOpacity
                            // When pressed, increase the quantity of this specific item
                            // Pass item.id and customizations to identify the exact cart entry
                            onPress={() => increaseQty(item.id, item.customizations!)}
                            className="cart-item__actions"
                        >
                            {/* Plus icon image with orange tint color */}
                            <Image
                                source={images.plus}
                                className="size-1/2"
                                resizeMode="contain"
                                tintColor={"#FF9C01"} // Orange color
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Right section: Delete button */}
            <TouchableOpacity
                // When pressed, completely remove this item from the cart
                // Uses item.id and customizations to identify which cart entry to remove
                onPress={() => removeItem(item.id, item.customizations!)}
                className="flex-center"
            >
                {/* Trash/delete icon */}
                <Image source={images.trash} className="size-5" resizeMode="contain" />
            </TouchableOpacity>
        </View>
    );
};

// Export the component so it can be used in other parts of the app
export default CartItem;