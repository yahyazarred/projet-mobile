import { View, Text, FlatList, Alert, TextInput, Modal, Pressable, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import cn from "clsx";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import { createOrder, OrderItem } from "@/lib/orderService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getCurrentUser } from "@/lib/appwrite";
import * as Location from 'expo-location';

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
);

const Cart = () => {
    const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form data for order
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryInstructions, setDeliveryInstructions] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();
    const deliveryFee = 5.00;
    const discount = 0.50;
    const finalTotal = totalPrice + deliveryFee - discount;

    const getCurrentAddress = async () => {
        setLocationLoading(true);
        try {
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Please enable location permissions in settings to use this feature.'
                );
                setLocationLoading(false);
                return;
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            // Reverse geocode to get address
            const addressData = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (addressData[0]) {
                const addr = addressData[0];
                // Format the address nicely
                const parts = [
                    addr.name,
                    addr.street,
                    addr.city,
                    addr.region,
                    addr.postalCode,
                    addr.country
                ].filter(Boolean); // Remove null/undefined values

                setDeliveryAddress(parts.join(', '));
            } else {
                Alert.alert('Error', 'Could not determine your address. Please enter manually.');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your location. Please enter your address manually.'
            );
        } finally {
            setLocationLoading(false);
        }
    };

    const handleOrderNow = () => {
        if (items.length === 0) {
            Alert.alert("Empty Cart", "Please add items to your cart first");
            return;
        }
        setModalVisible(true);
    };

    const handlePlaceOrder = async () => {
        // Validate delivery address
        if (!deliveryAddress.trim()) {
            Alert.alert("Missing Information", "Please enter your delivery address");
            return;
        }

        try {
            setLoading(true);

            console.log("🛒 ========== PLACE ORDER STARTED ==========");
            console.log("🛒 Cart items count:", items.length);

            // Debug: Log all cart items
            items.forEach((item, index) => {
                console.log(`🛒 Cart Item ${index + 1}:`, {
                    id: item.id,
                    name: item.name,
                    restaurantId: item.restaurantId,
                    price: item.price,
                    quantity: item.quantity
                });
            });

            // Get restaurant ID from the first item (assuming all items are from same restaurant)
            const restaurantId = items[0]?.restaurantId;

            console.log("🍽️ Restaurant ID from cart:", restaurantId);
            console.log("🍽️ Full first item:", {
                id: items[0]?.id,
                name: items[0]?.name,
                restaurantId: items[0]?.restaurantId,
            });

            if (!restaurantId) {
                console.error("❌ Restaurant ID is missing from cart items!");
                console.error("❌ Cart item structure:", JSON.stringify(items[0], null, 2));
                throw new Error("Restaurant information not found. Please add items to cart again.");
            }

            // Transform cart items to order items
            const orderItems: OrderItem[] = items.map(item => ({
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                customizations: item.customizations,
            }));

            console.log("📦 Order items prepared:", orderItems.length);
            console.log("💰 Final total:", finalTotal);
            console.log("📍 Delivery address:", deliveryAddress.substring(0, 50) + "...");
            console.log("📞 Customer phone:", customerPhone || "Not provided");

            // Create the order
            const createdOrder = await createOrder({
                restaurantId,
                items: orderItems,
                totalPrice: finalTotal,
                deliveryAddress,
                deliveryInstructions,
                customerPhone,
            });

            console.log("✅ Order created successfully!");
            console.log("📋 Created order details:", {
                id: createdOrder.$id,
                orderNumber: createdOrder.orderNumber,
                status: createdOrder.status,
                restaurantId: createdOrder.restaurantId
            });
            console.log("🛒 ========== PLACE ORDER COMPLETED ==========");

            // Clear the cart after successful order
            clearCart();
            setModalVisible(false);

            // Show success message
            Alert.alert(
                "Order Placed!",
                `Order #${createdOrder.orderNumber} has been placed successfully. The restaurant will confirm it shortly.`,
                [
                    {
                        text: "OK",
                        onPress: () => router.push("/(tabs)/search"),
                    },
                ]
            );
        } catch (error) {
            console.error("❌ ========== PLACE ORDER FAILED ==========");
            console.error("❌ Error:", error);
            console.error("❌ Error message:", (error as any).message);
            console.error("❌ Error type:", (error as any).type);
            console.error("❌ Error code:", (error as any).code);
            console.error("❌ Full error object:", JSON.stringify(error, null, 2));

            Alert.alert(
                "Order Failed",
                (error as Error).message || "Failed to place order. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="bg-white h-full">
            <FlatList
                data={items}
                renderItem={({ item }) => <CartItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerClassName="pb-28 px-5 pt-5"
                ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-20">
                        <Ionicons name="cart-outline" size={64} color="#ccc" />
                        <Text className="text-gray-500 mt-4 text-lg">Your cart is empty</Text>
                        <Text className="text-gray-400 text-sm">Add some delicious items!</Text>
                    </View>
                )}
                ListFooterComponent={() => totalItems > 0 && (
                    <View className="gap-5">
                        <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                            <Text className="h3-bold text-dark-100 mb-5">
                                Payment Summary
                            </Text>

                            <PaymentInfoStripe
                                label={`Total Items (${totalItems})`}
                                value={`$${totalPrice.toFixed(2)}`}
                            />
                            <PaymentInfoStripe
                                label="Delivery Fee"
                                value={`$${deliveryFee.toFixed(2)}`}
                            />
                            <PaymentInfoStripe
                                label="Discount"
                                value={`- $${discount.toFixed(2)}`}
                                valueStyle="!text-success"
                            />
                            <View className="border-t border-gray-300 my-2" />
                            <PaymentInfoStripe
                                label="Total"
                                value={`$${finalTotal.toFixed(2)}`}
                                labelStyle="base-bold !text-dark-100"
                                valueStyle="base-bold !text-dark-100 !text-right"
                            />
                        </View>

                        <CustomButton
                            title="Order Now"
                            onPress={handleOrderNow}
                        />
                    </View>
                )}
            />

            {/* Order Details Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[80%]">
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Delivery Details</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </Pressable>
                        </View>

                        <ScrollView className="p-5">
                            <View className="gap-4">
                                <View>
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number *
                                    </Text>
                                    <TextInput
                                        placeholder="Enter your phone number"
                                        value={customerPhone}
                                        onChangeText={setCustomerPhone}
                                        keyboardType="phone-pad"
                                        className="border border-gray-300 rounded-xl p-4 text-base"
                                    />
                                </View>

                                <View>
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-sm font-semibold text-gray-700">
                                            Delivery Address *
                                        </Text>
                                        <TouchableOpacity
                                            onPress={getCurrentAddress}
                                            disabled={locationLoading}
                                            className="flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
                                        >
                                            {locationLoading ? (
                                                <ActivityIndicator size="small" color="#3b82f6" />
                                            ) : (
                                                <>
                                                    <Ionicons name="location" size={16} color="#3b82f6" />
                                                    <Text className="text-blue-500 text-xs font-medium">Use Current</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        placeholder="Enter your full delivery address"
                                        value={deliveryAddress}
                                        onChangeText={setDeliveryAddress}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        className="border border-gray-300 rounded-xl p-4 text-base h-24"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Delivery Instructions (Optional)
                                    </Text>
                                    <TextInput
                                        placeholder="E.g., Ring the doorbell, Leave at door..."
                                        value={deliveryInstructions}
                                        onChangeText={setDeliveryInstructions}
                                        multiline
                                        numberOfLines={2}
                                        textAlignVertical="top"
                                        className="border border-gray-300 rounded-xl p-4 text-base h-20"
                                    />
                                </View>

                                {/* Order Summary */}
                                <View className="bg-gray-50 rounded-xl p-4 mt-2">
                                    <Text className="text-sm font-bold text-gray-900 mb-2">Order Summary</Text>
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-sm text-gray-600">Subtotal</Text>
                                        <Text className="text-sm font-semibold">${totalPrice.toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-sm text-gray-600">Delivery Fee</Text>
                                        <Text className="text-sm font-semibold">${deliveryFee.toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm text-gray-600">Discount</Text>
                                        <Text className="text-sm font-semibold text-green-600">-${discount.toFixed(2)}</Text>
                                    </View>
                                    <View className="border-t border-gray-300 pt-2">
                                        <View className="flex-row justify-between">
                                            <Text className="text-base font-bold text-gray-900">Total</Text>
                                            <Text className="text-base font-bold text-primary">${finalTotal.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View className="p-5 border-t border-gray-100">
                            <CustomButton
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