import { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useAuthStore from "@/store/auth.store";
import useAppwrite from "@/lib/useAppwrite";
import {
    getAvailableDeliveries,
    getDriverDeliveries,
    assignDriverToOrder,
} from "@/lib/appwrite";
import { realtimeService } from "@/lib/realtimeService";
import * as Haptics from 'expo-haptics';

type TabType = "available" | "active";

export default function DeliveryDashboard() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>("active");
    const [refreshing, setRefreshing] = useState(false);
    const [realtimeConnected, setRealtimeConnected] = useState(false);
    const [activeDeliveriesLocal, setActiveDeliveriesLocal] = useState<any[]>([]);
    const [availableDeliveriesLocal, setAvailableDeliveriesLocal] = useState<any[]>([]);

    // Fetch active deliveries (assigned to this driver)
    const {
        data: activeDeliveries,
        loading: activeLoading,
        refetch: refetchActive,
    } = useAppwrite({
        fn: getDriverDeliveries,
        params: user?.$id || "",
        skip: !user?.$id,
    });

    // Fetch available deliveries (ready for pickup, not assigned)
    const {
        data: availableDeliveries,
        loading: availableLoading,
        refetch: refetchAvailable,
    } = useAppwrite({
        fn: getAvailableDeliveries,
    });

    // Update local state when data changes
    useEffect(() => {
        if (activeDeliveries) {
            setActiveDeliveriesLocal(activeDeliveries as any[]);
        }
    }, [activeDeliveries]);

    useEffect(() => {
        if (availableDeliveries) {
            setAvailableDeliveriesLocal(availableDeliveries as any[]);
        }
    }, [availableDeliveries]);

    // Real-time subscription for driver
    useEffect(() => {
        if (!user?.$id) return;

        console.log("Setting up real-time subscription for driver:", user.$id);

        const unsubscribe = realtimeService.subscribeToDriverDeliveries(
            user.$id,
            (event) => {
                console.log("Driver real-time event:", event.type, event.order.$id);

                // Haptic feedback for new available orders
                if (event.isAvailable && event.type === "create") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }

                // Update active deliveries
                if (event.order.driverId === user.$id) {
                    setActiveDeliveriesLocal((prev) => {
                        let updated = [...prev];

                        if (event.type === "create" || event.type === "update") {
                            const index = updated.findIndex(o => o.$id === event.order.$id);
                            if (index !== -1) {
                                updated[index] = event.order;
                            } else {
                                updated.unshift(event.order);
                            }
                        } else if (event.type === "delete" || event.order.status === "delivered") {
                            updated = updated.filter(o => o.$id !== event.order.$id);
                        }

                        return updated;
                    });
                }

                // Update available deliveries
                if (event.isAvailable) {
                    setAvailableDeliveriesLocal((prev) => {
                        let updated = [...prev];

                        if (event.type === "create" && event.order.status === "ready") {
                            updated.unshift(event.order);
                        } else if (event.type === "update") {
                            // Remove from available if assigned or status changed
                            if (event.order.driverId || event.order.status !== "ready") {
                                updated = updated.filter(o => o.$id !== event.order.$id);
                            }
                        } else if (event.type === "delete") {
                            updated = updated.filter(o => o.$id !== event.order.$id);
                        }

                        return updated;
                    });
                }

                setRealtimeConnected(true);
            }
        );

        return () => {
            console.log("Cleaning up driver real-time subscription");
            unsubscribe();
            setRealtimeConnected(false);
        };
    }, [user?.$id]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            if (activeTab === "active") {
                await refetchActive();
            } else {
                await refetchAvailable();
            }
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    }, [activeTab, refetchActive, refetchAvailable]);

    const handleAcceptDelivery = async (orderId: string) => {
        if (!user?.$id) return;

        Alert.alert(
            "Accept Delivery",
            "Do you want to accept this delivery?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Accept",
                    onPress: async () => {
                        try {
                            await assignDriverToOrder(orderId, user.$id);

                            // Haptic feedback
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                            Alert.alert("Success", "Delivery accepted!");
                            setActiveTab("active");
                        } catch (error) {
                            Alert.alert("Error", "Failed to accept delivery");
                            console.error("Accept delivery error:", error);
                        }
                    },
                },
            ]
        );
    };

    const handleViewDetails = (orderId: string) => {
        router.push(`/delivery-detail/${orderId}`);
    };

    const renderDeliveryCard = ({ item }: { item: any }) => {
        const isActive = activeTab === "active";
        const statusInfo = realtimeService.getStatusInfo(item.status);

        return (
            <Pressable
                onPress={() => handleViewDetails(item.$id)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
            >
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900">
                            {item.restaurantName || "Restaurant"}
                        </Text>
                        <Text className="text-sm text-gray-600 mt-1">
                            Order #{item.orderNumber || item.$id.slice(-6).toUpperCase()}
                        </Text>
                    </View>
                    <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${statusInfo.color}20` }}
                    >
                        <Text
                            className="text-xs font-semibold"
                            style={{ color: statusInfo.color }}
                        >
                            {statusInfo.label.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View className="space-y-2">
                    {/* Pickup Location */}
                    <View className="flex-row items-start mb-2">
                        <Ionicons
                            name="restaurant-outline"
                            size={18}
                            color="#f97316"
                        />
                        <View className="ml-2 flex-1">
                            <Text className="text-xs text-gray-500">Pickup</Text>
                            <Text className="text-sm text-gray-800">
                                {item.restaurantAddress || "Restaurant address"}
                            </Text>
                        </View>
                    </View>

                    {/* Delivery Location */}
                    <View className="flex-row items-start mb-2">
                        <Ionicons
                            name="location-outline"
                            size={18}
                            color="#22c55e"
                        />
                        <View className="ml-2 flex-1">
                            <Text className="text-xs text-gray-500">Deliver to</Text>
                            <Text className="text-sm text-gray-800">
                                {item.deliveryAddress || "Customer address"}
                            </Text>
                        </View>
                    </View>

                    {/* Customer Info */}
                    <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={18} color="#6b7280" />
                        <Text className="ml-2 text-sm text-gray-700">
                            {item.customerName || "Customer"}
                        </Text>
                    </View>
                </View>

                {/* Order Amount */}
                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-sm text-gray-600">Order Total</Text>
                    <Text className="text-lg font-bold text-primary">
                        ${item.totalPrice?.toFixed(2) || "0.00"}
                    </Text>
                </View>

                {/* Action Button */}
                {!isActive && (
                    <Pressable
                        onPress={() => handleAcceptDelivery(item.$id)}
                        className="bg-primary rounded-xl py-3 mt-3"
                    >
                        <Text className="text-white text-center font-semibold">
                            Accept Delivery
                        </Text>
                    </Pressable>
                )}

                {isActive && (
                    <Pressable
                        onPress={() => handleViewDetails(item.$id)}
                        className="bg-gray-100 rounded-xl py-3 mt-3"
                    >
                        <Text className="text-gray-700 text-center font-semibold">
                            View Details
                        </Text>
                    </Pressable>
                )}
            </Pressable>
        );
    };

    const currentData = activeTab === "active" ? activeDeliveriesLocal : availableDeliveriesLocal;
    const loading = activeTab === "active" ? activeLoading : availableLoading;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-4 pb-3 bg-white">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <View className="flex-row items-center">
                            <Text className="text-xs font-semibold text-primary">
                                DELIVERY DRIVER
                            </Text>
                            {realtimeConnected && (
                                <View className="ml-2 flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                                    <Text className="text-xs text-green-600">Live</Text>
                                </View>
                            )}
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">
                            Your Deliveries
                        </Text>
                    </View>
                    <Pressable
                        onPress={onRefresh}
                        className="bg-gray-100 w-12 h-12 rounded-full items-center justify-center"
                    >
                        <Ionicons name="refresh" size={22} color="#374151" />
                    </Pressable>
                </View>

                {/* Tabs */}
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                    <Pressable
                        onPress={() => setActiveTab("active")}
                        className={`flex-1 py-2 rounded-lg ${
                            activeTab === "active" ? "bg-white" : ""
                        }`}
                    >
                        <Text
                            className={`text-center font-semibold ${
                                activeTab === "active"
                                    ? "text-primary"
                                    : "text-gray-600"
                            }`}
                        >
                            Active ({activeDeliveriesLocal.length})
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab("available")}
                        className={`flex-1 py-2 rounded-lg ${
                            activeTab === "available" ? "bg-white" : ""
                        }`}
                    >
                        <Text
                            className={`text-center font-semibold ${
                                activeTab === "available"
                                    ? "text-primary"
                                    : "text-gray-600"
                            }`}
                        >
                            Available ({availableDeliveriesLocal.length})
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#df5a0c" />
                    <Text className="mt-3 text-gray-600">Loading deliveries...</Text>
                </View>
            ) : (
                <FlatList
                    data={currentData}
                    keyExtractor={(item) => item.$id}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom: 100,
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#df5a0c"
                        />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Ionicons
                                name={
                                    activeTab === "active"
                                        ? "bicycle-outline"
                                        : "fast-food-outline"
                                }
                                size={64}
                                color="#ccc"
                            />
                            <Text className="text-gray-500 mt-4 text-center">
                                {activeTab === "active"
                                    ? "No active deliveries"
                                    : "No available deliveries"}
                            </Text>
                            <Text className="text-gray-400 text-sm text-center">
                                {activeTab === "active"
                                    ? "Check available tab for new orders"
                                    : "New orders will appear here automatically"}
                            </Text>
                        </View>
                    }
                    renderItem={renderDeliveryCard}
                />
            )}
        </SafeAreaView>
    );
}