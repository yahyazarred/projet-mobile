import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import useAppwrite from "@/lib/useAppwrite";
import { getOrderDetails, updateDeliveryStatus } from "@/lib/appwrite";
import { realtimeService } from "@/lib/realtimeService";
import * as Haptics from 'expo-haptics';

export default function DeliveryDetailScreen() {
    const { id } = useLocalSearchParams();
    const [updating, setUpdating] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);

    const {
        data: order,
        loading,
        refetch,
    } = useAppwrite({
        fn: getOrderDetails,
        params: id as string,
        skip: !id,
    });

    // Update local state when order data changes
    useEffect(() => {
        if (order) {
            setOrderData(order);
        }
    }, [order]);

    // Real-time subscription for this specific order
    useEffect(() => {
        if (!id) return;

        console.log("Setting up real-time subscription for order:", id);

        const unsubscribe = realtimeService.subscribeToOrder(
            id as string,
            (event) => {
                console.log("Order real-time event:", event.type, event.order.status);

                // Haptic feedback on status changes
                if (event.type === "update") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }

                // Update order data
                setOrderData(event.order);
            }
        );

        return () => {
            console.log("Cleaning up order real-time subscription");
            unsubscribe();
        };
    }, [id]);

    const handleUpdateStatus = async (
        status: "picked_up" | "on_the_way" | "delivered"
    ) => {
        const statusMessages = {
            picked_up: "Mark as Picked Up?",
            on_the_way: "Mark as On The Way?",
            delivered: "Mark as Delivered?",
        };

        Alert.alert("Update Status", statusMessages[status], [
            { text: "Cancel", style: "cancel" },
            {
                text: "Confirm",
                onPress: async () => {
                    try {
                        setUpdating(true);
                        await updateDeliveryStatus(id as string, status);

                        // Haptic feedback
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                        Alert.alert("Success", "Status updated successfully!");

                        if (status === "delivered") {
                            router.back();
                        }
                    } catch (error) {
                        Alert.alert("Error", "Failed to update status");
                        console.error("Update status error:", error);
                    } finally {
                        setUpdating(false);
                    }
                },
            },
        ]);
    };

    const handleCall = (phone: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert("No Phone", "Customer phone number not available");
        }
    };

    const handleNavigate = (address: string) => {
        if (address) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                address
            )}`;
            Linking.openURL(url);
        } else {
            Alert.alert("No Address", "Address not available");
        }
    };

    if (loading && !orderData) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#df5a0c" />
                <Text className="mt-3 text-gray-600">Loading order details...</Text>
            </SafeAreaView>
        );
    }

    if (!orderData) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                <Text className="mt-3 text-gray-600">Order not found</Text>
                <Pressable
                    onPress={() => router.back()}
                    className="mt-4 bg-primary px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const currentStatus = orderData.status || "ready";
    const statusInfo = realtimeService.getStatusInfo(currentStatus);
    const orderItems = orderData.items ? (typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items) : [];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-5 py-4 flex-row items-center border-b border-gray-100">
                <Pressable
                    onPress={() => router.back()}
                    className="mr-4 w-10 h-10 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </Pressable>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">
                        Order Details
                    </Text>
                    <Text className="text-xs text-gray-500">
                        #{orderData.orderNumber || orderData.$id.slice(-6).toUpperCase()}
                    </Text>
                </View>
                {/* Real-time indicator */}
                <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                    <Text className="text-xs text-green-600">Live</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Card */}
                <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
                    <View className="items-center">
                        <View
                            className="w-20 h-20 rounded-full items-center justify-center mb-3"
                            style={{ backgroundColor: `${statusInfo.color}20` }}
                        >
                            <Ionicons
                                name={statusInfo.icon as any}
                                size={40}
                                color={statusInfo.color}
                            />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mb-1">
                            {statusInfo.label}
                        </Text>
                        <Text className="text-sm text-gray-500">
                            {new Date(orderData.placedAt).toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Pickup Location */}
                <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <View className="bg-orange-100 w-10 h-10 rounded-full items-center justify-center">
                            <Ionicons name="restaurant" size={20} color="#f97316" />
                        </View>
                        <Text className="ml-3 text-lg font-bold text-gray-900">
                            Pickup Location
                        </Text>
                    </View>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        {orderData.restaurantName || "Restaurant"}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-3">
                        {orderData.restaurantAddress || "No address provided"}
                    </Text>
                    <Pressable
                        onPress={() => handleNavigate(orderData.restaurantAddress)}
                        className="bg-orange-50 rounded-xl py-3 flex-row items-center justify-center"
                    >
                        <Ionicons name="navigate" size={20} color="#f97316" />
                        <Text className="ml-2 text-orange-600 font-semibold">
                            Navigate
                        </Text>
                    </Pressable>
                </View>

                {/* Delivery Location */}
                <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <View className="bg-green-100 w-10 h-10 rounded-full items-center justify-center">
                            <Ionicons name="location" size={20} color="#22c55e" />
                        </View>
                        <Text className="ml-3 text-lg font-bold text-gray-900">
                            Delivery Location
                        </Text>
                    </View>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        {orderData.customerName || "Customer"}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-3">
                        {orderData.deliveryAddress || "No address provided"}
                    </Text>
                    <View className="flex-row space-x-2">
                        <Pressable
                            onPress={() => handleNavigate(orderData.deliveryAddress)}
                            className="flex-1 bg-green-50 rounded-xl py-3 flex-row items-center justify-center"
                        >
                            <Ionicons name="navigate" size={20} color="#22c55e" />
                            <Text className="ml-2 text-green-600 font-semibold">
                                Navigate
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => handleCall(orderData.customerPhone)}
                            className="flex-1 bg-blue-50 rounded-xl py-3 flex-row items-center justify-center"
                        >
                            <Ionicons name="call" size={20} color="#3b82f6" />
                            <Text className="ml-2 text-blue-600 font-semibold">
                                Call
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Order Items */}
                <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                        Order Items
                    </Text>
                    {orderItems.map((item: any, index: number) => (
                        <View
                            key={index}
                            className="flex-row justify-between items-center py-2 border-b border-gray-100"
                        >
                            <View className="flex-1">
                                <Text className="text-base text-gray-900">
                                    {item.quantity}x {item.name}
                                </Text>
                                {item.customizations && item.customizations.length > 0 && (
                                    <Text className="text-xs text-gray-500 mt-1">
                                        + {item.customizations.join(", ")}
                                    </Text>
                                )}
                            </View>
                            <Text className="text-base font-semibold text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                    <View className="flex-row justify-between items-center pt-3 mt-2 border-t-2 border-gray-200">
                        <Text className="text-lg font-bold text-gray-900">Total</Text>
                        <Text className="text-xl font-bold text-primary">
                            ${orderData.totalPrice?.toFixed(2) || "0.00"}
                        </Text>
                    </View>
                </View>

                {/* Special Instructions */}
                {orderData.deliveryInstructions && (
                    <View className="bg-amber-50 mx-4 mt-4 rounded-2xl p-5">
                        <View className="flex-row items-center mb-2">
                            <Ionicons
                                name="information-circle"
                                size={20}
                                color="#f59e0b"
                            />
                            <Text className="ml-2 font-semibold text-amber-900">
                                Delivery Instructions
                            </Text>
                        </View>
                        <Text className="text-sm text-amber-800">
                            {orderData.deliveryInstructions}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            {currentStatus !== "delivered" && currentStatus !== "cancelled" && (
                <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-100">
                    {currentStatus === "ready" && (
                        <Pressable
                            onPress={() => handleUpdateStatus("picked_up")}
                            disabled={updating}
                            className="bg-primary rounded-xl py-4 flex-row items-center justify-center"
                        >
                            {updating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="checkbox" size={24} color="white" />
                                    <Text className="ml-2 text-white text-lg font-bold">
                                        Mark as Picked Up
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}

                    {currentStatus === "picked_up" && (
                        <Pressable
                            onPress={() => handleUpdateStatus("on_the_way")}
                            disabled={updating}
                            className="bg-primary rounded-xl py-4 flex-row items-center justify-center"
                        >
                            {updating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="bicycle" size={24} color="white" />
                                    <Text className="ml-2 text-white text-lg font-bold">
                                        Start Delivery
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}

                    {currentStatus === "on_the_way" && (
                        <Pressable
                            onPress={() => handleUpdateStatus("delivered")}
                            disabled={updating}
                            className="bg-green-600 rounded-xl py-4 flex-row items-center justify-center"
                        >
                            {updating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={24}
                                        color="white"
                                    />
                                    <Text className="ml-2 text-white text-lg font-bold">
                                        Mark as Delivered
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}