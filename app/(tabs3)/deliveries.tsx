import { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    ScrollView,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Models } from "react-native-appwrite";
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";

interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customizations?: string[];
}

interface Order extends Models.Document {
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    restaurantId: string;
    restaurantName?: string;
    restaurantAddress?: string;
    items: string;
    status: "ready" | "out_for_delivery" | "delivered";
    totalPrice: number;
    deliveryAddress: string;
    deliveryInstructions?: string;
    placedAt: string;
    deliveryAgentId?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
}

const DB_ID = appwriteConfig.databaseId;
const ORDERS_ID = appwriteConfig.ordersCollectionId;

const STATUS_CONFIG = {
    ready: { label: "Ready for Pickup", color: "#10B981", icon: "checkmark-done" },
    out_for_delivery: { label: "Out for Delivery", color: "#3B82F6", icon: "bicycle" },
    delivered: { label: "Delivered", color: "#6B7280", icon: "checkmark-done-circle" },
};

export default function DriverDeliveries() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentDriverId, setCurrentDriverId] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<string>("available");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const loadOrders = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            setCurrentDriverId(user.$id);

            let ordersList: Order[] = [];

            // Import functions from appwrite.ts
            const { getAvailableOrders, getDriverDeliveries } = await import("@/lib/appwrite");

            if (selectedFilter === "available") {
                ordersList = await getAvailableOrders() as Order[];
            } else if (selectedFilter === "my_deliveries") {
                ordersList = await getDriverDeliveries(user.$id, false) as Order[];
            }

            setOrders(ordersList);
            setFilteredOrders(ordersList);
        } catch (err) {
            console.error("Load orders error:", err);
            Alert.alert("Error", (err as Error).message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedFilter]);

    useEffect(() => {
        loadOrders();
    }, [selectedFilter]);

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
    };

    const acceptDelivery = async (orderId: string) => {
        try {
            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, {
                deliveryAgentId: currentDriverId,
                status: "out_for_delivery",
                pickedUpAt: new Date().toISOString(),
            });
            Alert.alert("Success", "Delivery accepted! Head to the restaurant.");
            loadOrders();
            setDetailsModalVisible(false);
        } catch (err) {
            console.error("Accept delivery error:", err);
            Alert.alert("Error", (err as Error).message);
        }
    };

    const markAsDelivered = async (orderId: string) => {
        try {
            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, {
                status: "delivered",
                deliveredAt: new Date().toISOString(),
            });
            Alert.alert("Success", "Order marked as delivered!");
            loadOrders();
            setDetailsModalVisible(false);
        } catch (err) {
            console.error("Mark delivered error:", err);
            Alert.alert("Error", (err as Error).message);
        }
    };

    const showOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsModalVisible(true);
    };

    const openNavigation = (address: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        Linking.openURL(url);
    };

    const callCustomer = (phone?: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert("No Phone", "Customer phone number not available");
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-gray-600">Loading deliveries...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-5 pb-3 bg-white">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-xs font-semibold text-blue-600">DELIVERIES</Text>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">
                            {selectedFilter === "available" ? "Available Orders" : "My Deliveries"}
                        </Text>
                    </View>
                    <View className="bg-blue-600 px-4 py-2 rounded-full">
                        <Text className="text-white font-bold">{filteredOrders.length}</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[
                        { key: "available", label: "Available" },
                        { key: "my_deliveries", label: "My Deliveries" },
                    ].map((filter) => (
                        <Pressable
                            key={filter.key}
                            onPress={() => handleFilterChange(filter.key)}
                            className={`mr-2 px-4 py-2 rounded-full ${
                                selectedFilter === filter.key ? "bg-blue-600" : "bg-gray-100"
                            }`}
                        >
                            <Text
                                className={`font-semibold ${
                                    selectedFilter === filter.key ? "text-white" : "text-gray-700"
                                }`}
                            >
                                {filter.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Orders List */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.$id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="bicycle-outline" size={64} color="#ccc" />
                        <Text className="text-gray-500 mt-4 text-lg">No deliveries found</Text>
                        <Text className="text-gray-400 text-sm">
                            {selectedFilter === "available"
                                ? "Check back soon for new orders"
                                : "You don't have any active deliveries"}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const statusConfig = STATUS_CONFIG[item.status];
                    const itemsArray: OrderItem[] = JSON.parse(item.items);
                    const isMyDelivery = item.deliveryAgentId === currentDriverId;

                    return (
                        <Pressable
                            onPress={() => showOrderDetails(item)}
                            className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
                        >
                            <View className="p-4 border-b border-gray-100">
                                <View className="flex-row justify-between items-center mb-2">
                                    <View className="flex-row items-center">
                                        <View
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: statusConfig.color }}
                                        />
                                        <Text className="text-base font-bold text-gray-900">
                                            #{item.orderNumber}
                                        </Text>
                                    </View>
                                    <View
                                        className="px-3 py-1 rounded-full"
                                        style={{ backgroundColor: `${statusConfig.color}20` }}
                                    >
                                        <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
                                            {statusConfig.label}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {item.customerName}
                                        </Text>
                                        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                                            <Ionicons name="location" size={12} /> {item.deliveryAddress}
                                        </Text>
                                    </View>
                                    <Text className="text-lg font-bold text-blue-600 ml-2">
                                        ${item.totalPrice.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            <View className="px-4 py-3 bg-gray-50">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-xs text-gray-500">Items</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {itemsArray.length} item{itemsArray.length > 1 ? "s" : ""}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-500">Placed</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {new Date(item.placedAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {!isMyDelivery && item.status === "ready" && (
                                <Pressable
                                    onPress={() => {
                                        Alert.alert(
                                            "Accept Delivery",
                                            `Accept delivery for order #${item.orderNumber}?`,
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                    text: "Accept",
                                                    onPress: () => acceptDelivery(item.$id),
                                                },
                                            ]
                                        );
                                    }}
                                    className="bg-blue-600 py-3 items-center"
                                >
                                    <Text className="text-white font-bold text-base">Accept Delivery</Text>
                                </Pressable>
                            )}

                            {isMyDelivery && item.status === "out_for_delivery" && (
                                <View className="flex-row border-t border-gray-100">
                                    <Pressable
                                        onPress={() => openNavigation(item.deliveryAddress)}
                                        className="flex-1 py-3 items-center border-r border-gray-100"
                                    >
                                        <View className="flex-row items-center">
                                            <Ionicons name="navigate" size={16} color="#3B82F6" />
                                            <Text className="font-semibold text-blue-600 ml-1">Navigate</Text>
                                        </View>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => callCustomer(item.customerPhone)}
                                        className="flex-1 py-3 items-center"
                                    >
                                        <View className="flex-row items-center">
                                            <Ionicons name="call" size={16} color="#10B981" />
                                            <Text className="font-semibold text-green-600 ml-1">Call</Text>
                                        </View>
                                    </Pressable>
                                </View>
                            )}
                        </Pressable>
                    );
                }}
            />

            {/* Order Details Modal */}
            <Modal visible={detailsModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[85%]">
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Delivery Details</Text>
                            <Pressable onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </Pressable>
                        </View>

                        {selectedOrder && (
                            <ScrollView className="p-5">
                                <View className="mb-5">
                                    <Text className="text-2xl font-bold text-gray-900 mb-1">
                                        #{selectedOrder.orderNumber}
                                    </Text>
                                    <View
                                        className="self-start px-3 py-1 rounded-full"
                                        style={{ backgroundColor: `${STATUS_CONFIG[selectedOrder.status].color}20` }}
                                    >
                                        <Text
                                            className="text-sm font-semibold"
                                            style={{ color: STATUS_CONFIG[selectedOrder.status].color }}
                                        >
                                            {STATUS_CONFIG[selectedOrder.status].label}
                                        </Text>
                                    </View>
                                </View>

                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <Text className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER</Text>
                                    <Text className="text-base font-semibold text-gray-900">
                                        {selectedOrder.customerName}
                                    </Text>
                                    {selectedOrder.customerPhone && (
                                        <Pressable
                                            onPress={() => callCustomer(selectedOrder.customerPhone)}
                                            className="flex-row items-center mt-2"
                                        >
                                            <Ionicons name="call" size={16} color="#3B82F6" />
                                            <Text className="text-sm text-blue-600 ml-2 font-semibold">
                                                {selectedOrder.customerPhone}
                                            </Text>
                                        </Pressable>
                                    )}
                                    <View className="mt-3 pt-3 border-t border-gray-200">
                                        <Text className="text-xs font-semibold text-gray-500 mb-1">
                                            DELIVERY ADDRESS
                                        </Text>
                                        <Text className="text-sm text-gray-700 mb-2">
                                            {selectedOrder.deliveryAddress}
                                        </Text>
                                        <Pressable
                                            onPress={() => openNavigation(selectedOrder.deliveryAddress)}
                                            className="flex-row items-center self-start"
                                        >
                                            <Ionicons name="navigate" size={16} color="#3B82F6" />
                                            <Text className="text-sm text-blue-600 ml-1 font-semibold">
                                                Open in Maps
                                            </Text>
                                        </Pressable>
                                    </View>
                                    {selectedOrder.deliveryInstructions && (
                                        <View className="mt-3 pt-3 border-t border-gray-200">
                                            <Text className="text-xs font-semibold text-gray-500 mb-1">
                                                INSTRUCTIONS
                                            </Text>
                                            <Text className="text-sm text-gray-700">
                                                {selectedOrder.deliveryInstructions}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-gray-500 mb-3">ORDER ITEMS</Text>
                                    {JSON.parse(selectedOrder.items).map((item: OrderItem, idx: number) => (
                                        <View key={idx} className="flex-row justify-between py-3 border-b border-gray-100">
                                            <View className="flex-1">
                                                <Text className="text-base font-semibold text-gray-900">
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
                                </View>

                                <View className="bg-blue-50 rounded-xl p-4 mb-5">
                                    <View className="flex-row justify-between">
                                        <Text className="text-lg font-bold text-gray-900">Total</Text>
                                        <Text className="text-xl font-bold text-blue-600">
                                            ${selectedOrder.totalPrice.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {selectedOrder.deliveryAgentId !== currentDriverId && selectedOrder.status === "ready" && (
                                    <Pressable
                                        onPress={() => acceptDelivery(selectedOrder.$id)}
                                        className="bg-blue-600 py-4 rounded-xl items-center mb-3"
                                    >
                                        <Text className="text-white font-bold text-base">Accept Delivery</Text>
                                    </Pressable>
                                )}

                                {selectedOrder.deliveryAgentId === currentDriverId && selectedOrder.status === "out_for_delivery" && (
                                    <Pressable
                                        onPress={() => {
                                            Alert.alert(
                                                "Confirm Delivery",
                                                "Have you delivered this order to the customer?",
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    {
                                                        text: "Yes, Delivered",
                                                        onPress: () => markAsDelivered(selectedOrder.$id),
                                                    },
                                                ]
                                            );
                                        }}
                                        className="bg-green-600 py-4 rounded-xl items-center mb-3"
                                    >
                                        <Text className="text-white font-bold text-base">Mark as Delivered</Text>
                                    </Pressable>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}