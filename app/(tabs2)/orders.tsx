import { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    Alert,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Query, Models } from "react-native-appwrite";
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeIn,
    SlideInUp,
    SlideInDown,
    withDelay,
} from "react-native-reanimated";

interface OrderItem {
    menuItemId?: string;
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
    items: string; // Can be JSON array string or simple string
    status: "pending" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
    totalPrice: number;
    deliveryAddress: string;
    deliveryInstructions?: string;
    placedAt: string;
    acceptedAt?: string;
    completedAt?: string;
    driverId?: string;
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
        setLoading(true);
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
            console.error(err);
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
        if (filter === "all") setFilteredOrders(ordersList);
        else if (filter === "active") {
            setFilteredOrders(ordersList.filter((o) => ["pending", "accepted", "preparing", "ready"].includes(o.status)));
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
            if (newStatus === "accepted") updateData.acceptedAt = new Date().toISOString();
            else if (newStatus === "delivered" || newStatus === "cancelled") updateData.completedAt = new Date().toISOString();

            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, updateData);
            Alert.alert("Success", `Order status updated to ${STATUS_CONFIG[newStatus].label}`);
            loadOrders();
            setDetailsModalVisible(false);
        } catch (err) {
            console.error(err);
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
        <SafeAreaView className="flex-1 bg-amber-50">
            {/* Header + Filter */}
            <View className="px-5 pt-5 pb-3 bg-amber-50">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-xs font-semibold text-primary">ORDERS</Text>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">Manage Orders</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                            Restaurant ID: {currentRestaurantId.substring(0, 8)}...
                        </Text>
                    </View>
                    <View className="bg-primary px-4 py-2 rounded-full">
                        <Text className="text-white font-bold">{filteredOrders.length}</Text>
                    </View>
                </View>

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
                                selectedFilter === filter.key ? "bg-primary" : "bg-gray-50"
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
                        <Text className="text-gray-500 mt-4 text-lg font-semibold">No orders found</Text>
                        <Text className="text-gray-400 text-sm">
                            {selectedFilter === "all" ? "No orders yet" : `No ${selectedFilter} orders`}
                        </Text>
                        <Pressable
                            onPress={onRefresh}
                            className="mt-4 bg-orange-500 px-6 py-2 rounded-full shadow-md"
                        >
                            <Text className="text-white font-semibold">Refresh</Text>
                        </Pressable>
                    </View>
                }
                renderItem={({ item, index }) => {
                    const statusConfig = STATUS_CONFIG[item.status];

                    let itemsArray: OrderItem[] = [];
                    try {
                        const parsed = JSON.parse(item.items);
                        if (Array.isArray(parsed)) itemsArray = parsed;
                        else
                            itemsArray = [
                                { name: String(item.items), quantity: 1, price: item.totalPrice, menuItemId: "" },
                            ];
                    } catch {
                        itemsArray = [
                            { name: String(item.items), quantity: 1, price: item.totalPrice, menuItemId: "" },
                        ];
                    }

                    return (
                        <Animated.View
                            entering={FadeInUp.duration(500).delay(index * 50)}
                            className="mb-5"
                        >
                            <Pressable
                                onPress={() => showOrderDetails(item)}
                                className="bg-white rounded-3xl shadow-lg overflow-hidden"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    elevation: 6,
                                }}
                            >
                                {/* Order Header */}
                                <View className="p-5 bg-gradient-to-r from-orange-50 to-white border-b border-gray-100">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-row items-center">
                                            <View
                                                className="w-4 h-4 rounded-full mr-2"
                                                style={{ backgroundColor: statusConfig.color }}
                                            />
                                            <Text className="text-lg font-bold text-gray-900">
                                                #{item.orderNumber}
                                            </Text>
                                        </View>
                                        <View
                                            className="px-3 py-1 rounded-full"
                                            style={{ backgroundColor: `${statusConfig.color}20` }}
                                        >
                                            <Text
                                                className="text-xs font-semibold"
                                                style={{ color: statusConfig.color }}
                                            >
                                                {statusConfig.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <View>
                                            <Text className="text-sm text-gray-700 font-medium">{item.customerName}</Text>
                                            <Text className="text-xs text-gray-400 mt-0.5">
                                                {new Date(item.placedAt).toLocaleString()}
                                            </Text>
                                        </View>
                                        <Text className="text-lg font-bold text-orange-500">
                                            ${item.totalPrice.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Items Preview */}
                                <View className="px-5 py-4 bg-orange-50">
                                    <Text className="text-xs text-gray-500 mb-2 font-semibold">
                                        {itemsArray.length} item{itemsArray.length > 1 ? "s" : ""}
                                    </Text>
                                    {itemsArray.slice(0, 2).map((orderItem, idx) => (
                                        <Text key={idx} className="text-sm text-gray-800" numberOfLines={1}>
                                            {orderItem.quantity}x {orderItem.name}
                                        </Text>
                                    ))}
                                    {itemsArray.length > 2 && (
                                        <Text className="text-xs text-gray-500 mt-1">
                                            +{itemsArray.length - 2} more...
                                        </Text>
                                    )}
                                </View>

                                {/* Status / Actions */}
                                {getStatusActions(item.status).length > 0 && (
                                    <View className="flex-row border-t border-gray-200">
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
                                                    idx > 0 ? "border-l border-gray-200" : ""
                                                }`}
                                            >
                                                <Text
                                                    className={`font-semibold ${
                                                        action.status === "cancelled" ? "text-red-600" : "text-orange-500"
                                                    }`}
                                                >
                                                    {action.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </Pressable>
                        </Animated.View>
                    );
                }}
            />

        </SafeAreaView>
    );
}
