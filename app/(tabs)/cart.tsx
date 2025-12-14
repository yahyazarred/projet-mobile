import { View, Text, FlatList, Alert, TextInput, Modal, Pressable, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import cn from "clsx";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { createOrder, OrderItem } from "@/lib/orderService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getCurrentUser } from "@/lib/appwrite";
import * as Location from 'expo-location';




const Cart = () => {

    // STATE AND STORE
    // Access cart store for managing cart items and operations
    const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
    // Loading state for order placement
    const [loading, setLoading] = useState(false);
    // Loading state for fetching current location
    const [locationLoading, setLocationLoading] = useState(false);

    // Modal visibility state for delivery details form
    const [modalVisible, setModalVisible] = useState(false);

    // Delivery form data
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryInstructions, setDeliveryInstructions] = useState("");//optional description
    const [customerPhone, setCustomerPhone] = useState("");

    // ========================================================================
    // CALCULATIONS
    // ========================================================================

    // Calculate order totals
    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();
    const deliveryFee = 5.00;
    const discount = 0.50;
    const finalTotal = totalPrice + deliveryFee - discount;

    // ========================================================================
    // LOCATION HANDLER
    // ========================================================================
    const getCurrentAddress = async () => {
        setLocationLoading(true);
        try {
            // Step 1: Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Please enable location permissions in settings to use this feature.'
                );
                setLocationLoading(false);
                return;
            }

            // Step 2: Get current GPS coordinates
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High // Use high accuracy for precise location
            });

            // Step 3: Convert coordinates to human-readable address
            const addressData = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (addressData[0]) {
                const addr = addressData[0];

                // Step 4: Format address from available components
                // Combines name, street, city, region, postal code, country
                const parts = [
                    addr.name,
                    addr.street,
                    addr.city,
                    addr.region,
                    addr.postalCode,
                    addr.country
                ].filter(Boolean); // Remove any null/undefined values

                // Set the formatted address in the input field
                setDeliveryAddress(parts.join(', '));
            } else {
                // Geocoding returned no results
                Alert.alert('Error', 'Could not determine your address. Please enter manually.');
            }
        } catch (error) {
            // Handle any errors during location fetching
            console.error('Error getting location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your location. Please enter your address manually.'
            );
        } finally {
            // Always stop loading indicator
            setLocationLoading(false);
        }
    };

    // ========================================================================
    // ORDER HANDLERS
    // ========================================================================


    const handleOrderNow = () => {
        // Check if cart is empty
        if (items.length === 0) {
            Alert.alert("Empty Cart", "Please add items to your cart first");
            return;
        }
        // Open the delivery details modal
        setModalVisible(true);
    };

    const handlePlaceOrder = async () => {
        // ====================================================================
        // VALIDATION
        // ====================================================================

        // Validate that delivery address is provided (required field)
        if (!deliveryAddress.trim()) {//trim remove spaces
            Alert.alert("Missing Information", "Please enter your delivery address");
            return;
        }

        try {
            // Start loading state
            setLoading(true);

            // ================================================================
            // EXTRACT RESTAURANT ID
            // ================================================================

            // Get restaurant ID from the first cart item
            const restaurantId = items[0]?.restaurantId;

            // Validate that restaurant ID exists
            if (!restaurantId) {
                console.error(" Restaurant ID is missing from cart items!");
                throw new Error("Restaurant information not found. Please add items to cart again.");
            }

            // ================================================================
            // TRANSFORM CART ITEMS TO ORDER FORMAT
            // ================================================================

            // Convert cart items to the format expected by the order service
            const orderItems: OrderItem[] = items.map(item => ({
                menuItemId: item.id, // Menu item ID
                name: item.name, // Item name
                price: item.price, // Item price
                quantity: item.quantity, // Quantity ordered
            }));


            // ================================================================
            // SUBMIT ORDER
            // ================================================================

            // Call the order service to create the order in the database
            const createdOrder = await createOrder({
                restaurantId,
                items: orderItems,
                totalPrice: finalTotal,
                deliveryAddress,
                deliveryInstructions,
                customerPhone,
            });

            // ================================================================
            // POST-ORDER CLEANUP
            // ================================================================

            // Clear all items from cart since order was successful
            clearCart();

            // Close the delivery details modal
            setModalVisible(false);

            // ================================================================
            // SUCCESS MESSAGE
            // ================================================================

            // Show success alert with order number
            Alert.alert(
                "Order Placed!",
                `Order #${createdOrder.orderNumber} has been placed successfully. The restaurant will confirm it shortly.`,
                [
                    {
                        text: "OK",
                        // Navigate to search tab after user dismisses alert
                        onPress: () => router.push("/(tabs)/search"),
                    },
                ]
            );
        } catch (error) {
            // ================================================================
            // ERROR HANDLING
            // ================================================================

            // Comprehensive error logging for debugging
            console.error(" ========== PLACE ORDER FAILED ==========");


            // Show user-friendly error message
            Alert.alert(
                "Order Failed",
                (error as Error).message || "Failed to place order. Please try again."
            );
        } finally {
            // Always stop loading indicator, whether success or failure
            setLoading(false);
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <SafeAreaView className="bg-white h-full">
            {/* ================================================================
                MAIN CART LIST
                ================================================================ */}
            <FlatList
                // Data source: cart items from store
                data={items}

                // Render each cart item using CartItem component
                renderItem={({ item }) => <CartItem item={item} />}

                // Unique key for each item
                keyExtractor={(item) => item.id}

                // Container styling with padding and space for footer
                contentContainerClassName="pb-28 px-5 pt-5"

                    //LIST HEADER - Cart Title
                ListHeaderComponent={() => <CustomHeader title="Your Cart" />}

                    //EMPTY STATE - Shown when cart has no items
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-20">
                        {/* Empty cart icon */}
                        <Ionicons name="cart-outline" size={64} color="#ccc" />

                        {/* Empty state message */}
                        <Text className="text-gray-500 mt-4 text-lg">Your cart is empty</Text>
                        <Text className="text-gray-400 text-sm">Add some delicious items!</Text>
                    </View>
                )}


                ListFooterComponent={() => totalItems > 0 && (
                    <View className="gap-5">
                            //PAYMENT SUMMARY CARD
                        <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                            {/* Payment summary title */}
                            <Text className="h3-bold text-dark-100 mb-5">
                                Payment Summary
                            </Text>


                        </View>

                            //ORDER NOW BUTTON
                            //Opens delivery details modal
                        <CustomButton
                            title="Order Now"
                            onPress={handleOrderNow}
                        />
                    </View>
                )}
            />

            {/* ================================================================
                DELIVERY DETAILS MODAL
                Slides up from bottom to collect delivery information
                ================================================================ */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent // Allows background dimming
            >
                {/* Modal overlay with semi-transparent background */}
                <View className="flex-1 bg-black/50 justify-end">
                    {/* Modal content card */}
                    <View className="bg-white rounded-t-3xl max-h-[80%]">

                        {/* ====================================================
                            MODAL HEADER
                            ==================================================== */}
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                            {/* Modal title */}
                            <Text className="text-xl font-bold text-gray-900">Delivery Details</Text>

                            {/* Close button */}
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </Pressable>
                        </View>

                        {/* ====================================================
                            MODAL CONTENT - Scrollable Form
                            ==================================================== */}
                        <ScrollView className="p-5">
                            <View className="gap-4">

                                {/* ============================================
                                    PHONE NUMBER INPUT
                                    ============================================ */}
                                <View>
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number *
                                    </Text>
                                    <TextInput
                                        placeholder="Enter your phone number"
                                        value={customerPhone}
                                        keyboardType="phone-pad" // Show numeric keyboard
                                        className="border border-gray-300 rounded-xl p-4 text-base"
                                    />
                                </View>

                                {/* ============================================
                                    DELIVERY ADDRESS INPUT
                                    Includes "Use Current Location" button
                                    ============================================ */}
                                <View>
                                    {/* Label with location button */}
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-sm font-semibold text-gray-700">
                                            Delivery Address *
                                        </Text>

                                        {/* "Use Current Location" button */}
                                        <TouchableOpacity
                                            onPress={getCurrentAddress}
                                            disabled={locationLoading}
                                            className="flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
                                        >
                                            {locationLoading ? (
                                                // Show spinner while fetching location
                                                <ActivityIndicator size="small" color="#3b82f6" />
                                            ) : (
                                                // Show location icon and text
                                                <>
                                                    <Ionicons name="location" size={16} color="#3b82f6" />
                                                    <Text className="text-blue-500 text-xs font-medium">Use Current</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {/* Multi-line address input */}
                                    <TextInput
                                        placeholder="Enter your full delivery address"
                                        value={deliveryAddress}
                                        multiline // Allow multiple lines
                                        numberOfLines={3} // Initial height
                                        textAlignVertical="top" // Align text to top
                                        className="border border-gray-300 rounded-xl p-4 text-base h-24"
                                    />
                                </View>

                                {/* ============================================
                                    DELIVERY INSTRUCTIONS (OPTIONAL)
                                    ============================================ */}
                                <View>
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Delivery Instructions (Optional)
                                    </Text>
                                    <TextInput
                                        placeholder="E.g., Ring the doorbell, Leave at door..."
                                        value={deliveryInstructions}
                                        multiline
                                        numberOfLines={2}
                                        textAlignVertical="top"
                                        className="border border-gray-300 rounded-xl p-4 text-base h-20"
                                    />
                                </View>

                                {/* ============================================
                                    ORDER SUMMARY IN MODAL
                                    Shows breakdown of charges
                                    ============================================ */}
                                <View className="bg-gray-50 rounded-xl p-4 mt-2">
                                    <Text className="text-sm font-bold text-gray-900 mb-2">Order Summary</Text>

                                    {/* Subtotal row */}
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-sm text-gray-600">Subtotal</Text>
                                        <Text className="text-sm font-semibold">${totalPrice.toFixed(2)}</Text>//2 chiffres apres virgule
                                    </View>

                                    {/* Delivery fee row */}
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-sm text-gray-600">Delivery Fee</Text>
                                        <Text className="text-sm font-semibold">${deliveryFee.toFixed(2)}</Text>
                                    </View>

                                    {/* Discount row */}
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm text-gray-600">Discount</Text>
                                        <Text className="text-sm font-semibold text-green-600">-${discount.toFixed(2)}</Text>
                                    </View>

                                    {/* Divider */}
                                    <View className="border-t border-gray-300 pt-2">
                                        {/* Total row */}
                                        <View className="flex-row justify-between">
                                            <Text className="text-base font-bold text-gray-900">Total</Text>
                                            <Text className="text-base font-bold text-primary">${finalTotal.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* ====================================================
                            MODAL FOOTER - Place Order Button
                            ==================================================== */}
                        <View className="p-5 border-t border-gray-100">
                            <CustomButton
                                // Show "Placing Order..." while loading
                                title={loading ? "Placing Order..." : "Place Order"}
                                onPress={handlePlaceOrder}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
export default Cart;