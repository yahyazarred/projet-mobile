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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Query, Models } from "react-native-appwrite";
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
    items: string; // JSON string
    status: "pending" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
    totalPrice: number;
    deliveryAddress: string;
    deliveryInstructions?: string;
    placedAt: string;
    acceptedAt?: string;
    completedAt?: string;
    deliveryAgentId?: string;
}

const DB_ID = appwriteConfig.databaseId;
const ORDERS_ID = appwriteConfig.ordersCollectionId;
const RESTAURANTS_ID = appwriteConfig.restaurantCollectionId;

const STATUS_CONFIG = {
    pending: { label: "New Order", color: "#EF4444", icon: "alert-circle" },
    accepted: { label: "Accepted", color: "#F59E0B", icon: "checkmark-circle" },
    preparing: { label: "Preparing", color: "#8B5CF6", icon: "restaurant" },
    ready: { label: "Ready", color: "#10B981", icon: "checkmark-done" },
    out_for_delivery: { label: "Out for Delivery", color: "#3B82F6", icon: "bicycle" },
    delivered: { label: "Delivered", color: "#6B7280", icon: "checkmark-done-circle" },
    cancelled: { label: "Cancelled", color: "#DC2626", icon: "close-circle" },
};

export default function OrdersManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentRestaurantId, setCurrentRestaurantId] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const fetchRestaurant = async (accountId: string) => {
        const result = await databases.listDocuments(DB_ID, RESTAURANTS_ID, [
            Query.equal("ownerId", accountId),
        ]);
        return result.documents[0] ?? null;
    };

    const fetchOrders = async (restaurantId: string) => {
        const result = await databases.listDocuments(DB_ID, ORDERS_ID, [
            Query.equal("restaurantId", restaurantId),
            Query.orderDesc("placedAt"),
            Query.limit(100),
        ]);
        return result.documents as Order[];
    };

    const loadOrders = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            const restaurant = await fetchRestaurant(user.accountId);
            if (!restaurant) throw new Error("No restaurant found");

            setCurrentRestaurantId(restaurant.$id);

            const ordersList = await fetchOrders(restaurant.$id);
            setOrders(ordersList);
            filterOrders(ordersList, selectedFilter);
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
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const filterOrders = (ordersList: Order[], filter: string) => {
        if (filter === "all") {
            setFilteredOrders(ordersList);
        } else if (filter === "active") {
            setFilteredOrders(
                ordersList.filter((o) =>
                    ["pending", "accepted", "preparing", "ready"].includes(o.status)
                )
            );
        } else {
            setFilteredOrders(ordersList.filter((o) => o.status === filter));
        }
    };

    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
        filterOrders(orders, filter);
    };

    const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
        try {
            const updateData: any = { status: newStatus };

            if (newStatus === "accepted") {
                updateData.acceptedAt = new Date().toISOString();
            } else if (newStatus === "delivered" || newStatus === "cancelled") {
                updateData.completedAt = new Date().toISOString();
            }

            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, updateData);
            Alert.alert("Success", `Order status updated to ${STATUS_CONFIG[newStatus].label}`);
            loadOrders();
            setDetailsModalVisible(false);
        } catch (err) {
            console.error("Update error:", err);
            Alert.alert("Error", (err as Error).message);
        }
    };

    const showOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsModalVisible(true);
    };

    const getStatusActions = (currentStatus: Order["status"]) => {
        const actions: { status: Order["status"]; label: string }[] = [];

        switch (currentStatus) {
            case "pending":
                actions.push({ status: "accepted", label: "Accept Order" });
                actions.push({ status: "cancelled", label: "Reject Order" });
                break;
            case "accepted":
                actions.push({ status: "preparing", label: "Start Preparing" });
                break;
            case "preparing":
                actions.push({ status: "ready", label: "Mark as Ready" });
                break;
            case "ready":
                actions.push({ status: "out_for_delivery", label: "Out for Delivery" });
                break;
            case "out_for_delivery":
                actions.push({ status: "delivered", label: "Mark as Delivered" });
                break;
        }

        return actions;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#df5a0c" />
                <Text className="mt-3 text-gray-600">Loading orders...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-5 pb-3 bg-white">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-xs font-semibold text-primary">ORDERS</Text>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">
                            Manage Orders
                        </Text>
                    </View>
                    <View className="bg-primary px-4 py-2 rounded-full">
                        <Text className="text-white font-bold">{filteredOrders.length}</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[
                        { key: "all", label: "All" },
                        { key: "active", label: "Active" },
                        { key: "pending", label: "New" },
                        { key: "preparing", label: "Preparing" },
                        { key: "ready", label: "Ready" },
                        { key: "delivered", label: "Completed" },
                    ].map((filter) => (
                        <Pressable
                            key={filter.key}
                            onPress={() => handleFilterChange(filter.key)}
                            className={`mr-2 px-4 py-2 rounded-full ${
                                selectedFilter === filter.key ? "bg-primary" : "bg-gray-100"
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
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text className="text-gray-500 mt-4 text-lg">No orders found</Text>
                        <Text className="text-gray-400 text-sm">
                            {selectedFilter === "all" ? "No orders yet" : `No ${selectedFilter} orders`}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const statusConfig = STATUS_CONFIG[item.status];
                    const itemsArray: OrderItem[] = JSON.parse(item.items);

                    return (
                        <Pressable
                            onPress={() => showOrderDetails(item)}
                            className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
                        >
                            {/* Order Header */}
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
                                    <View>
                                        <Text className="text-sm text-gray-600">{item.customerName}</Text>
                                        <Text className="text-xs text-gray-400 mt-0.5">
                                            {new Date(item.placedAt).toLocaleString()}
                                        </Text>
                                    </View>
                                    <Text className="text-lg font-bold text-primary">
                                        ${item.totalPrice.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            {/* Order Items Preview */}
                            <View className="px-4 py-3 bg-gray-50">
                                <Text className="text-xs text-gray-500 mb-1">
                                    {itemsArray.length} item{itemsArray.length > 1 ? "s" : ""}
                                </Text>
                                {itemsArray.slice(0, 2).map((orderItem, idx) => (
                                    <Text key={idx} className="text-sm text-gray-700" numberOfLines={1}>
                                        {orderItem.quantity}x {orderItem.name}
                                    </Text>
                                ))}
                                {itemsArray.length > 2 && (
                                    <Text className="text-xs text-gray-400 mt-1">
                                        +{itemsArray.length - 2} more...
                                    </Text>
                                )}
                            </View>

                            {/* Quick Actions */}
                            {getStatusActions(item.status).length > 0 && (
                                <View className="flex-row border-t border-gray-100">
                                    {getStatusActions(item.status).map((action, idx) => (
                                        <Pressable
                                            key={idx}
                                            onPress={() => {
                                                Alert.alert(
                                                    "Confirm Action",
                                                    `${action.label} for order #${item.orderNumber}?`,
                                                    [
                                                        { text: "Cancel", style: "cancel" },
                                                        {
                                                            text: "Confirm",
                                                            onPress: () => updateOrderStatus(item.$id, action.status),
                                                        },
                                                    ]
                                                );
                                            }}
                                            className={`flex-1 py-3 items-center ${
                                                idx > 0 ? "border-l border-gray-100" : ""
                                            }`}
                                        >
                                            <Text
                                                className={`font-semibold ${
                                                    action.status === "cancelled" ? "text-red-600" : "text-blue-600"
                                                }`}
                                            >
                                                {action.label}
                                            </Text>
                                        </Pressable>
                                    ))}
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
                            <Text className="text-xl font-bold text-gray-900">Order Details</Text>
                            <Pressable onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </Pressable>
                        </View>

                        {selectedOrder && (
                            <ScrollView className="p-5">
                                {/* Order Info */}
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

                                {/* Customer Info */}
                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <Text className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER</Text>
                                    <Text className="text-base font-semibold text-gray-900">
                                        {selectedOrder.customerName}
                                    </Text>
                                    {selectedOrder.customerPhone && (
                                        <Text className="text-sm text-gray-600 mt-1">
                                            {selectedOrder.customerPhone}
                                        </Text>
                                    )}
                                    <View className="mt-3 pt-3 border-t border-gray-200">
                                        <Text className="text-xs font-semibold text-gray-500 mb-1">DELIVERY ADDRESS</Text>
                                        <Text className="text-sm text-gray-700">{selectedOrder.deliveryAddress}</Text>
                                    </View>
                                    {selectedOrder.deliveryInstructions && (
                                        <View className="mt-3 pt-3 border-t border-gray-200">
                                            <Text className="text-xs font-semibold text-gray-500 mb-1">INSTRUCTIONS</Text>
                                            <Text className="text-sm text-gray-700">
                                                {selectedOrder.deliveryInstructions}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Order Items */}
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

                                {/* Total */}
                                <View className="bg-primary/10 rounded-xl p-4 mb-5">
                                    <View className="flex-row justify-between">
                                        <Text className="text-lg font-bold text-gray-900">Total</Text>
                                        <Text className="text-xl font-bold text-primary">
                                            ${selectedOrder.totalPrice.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                {getStatusActions(selectedOrder.status).map((action, idx) => (
                                    <Pressable
                                        key={idx}
                                        onPress={() => updateOrderStatus(selectedOrder.$id, action.status)}
                                        className={`py-4 rounded-xl items-center mb-3 ${
                                            action.status === "cancelled" ? "bg-red-500" : "bg-primary"
                                        }`}
                                    >
                                        <Text className="text-white font-bold text-base">{action.label}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}