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
    items: string;
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
        console.log("🟢 Fetching restaurant for accountId:", accountId);
        const result = await databases.listDocuments(DB_ID, RESTAURANTS_ID, [
            Query.equal("ownerId", accountId),
        ]);
        console.log("🟢 Restaurant query result:", result);
        console.log("🟢 Found restaurants:", result.documents.length);
        if (result.documents[0]) {
            console.log("🟢 Restaurant ID:", result.documents[0].$id);
            console.log("🟢 Restaurant Name:", result.documents[0].name);
        }
        return result.documents[0] ?? null;
    };

    const fetchOrders = async (restaurantId: string) => {
        console.log("🟢 Fetching orders for restaurantId:", restaurantId);
        console.log("🟢 Database ID:", DB_ID);
        console.log("🟢 Orders Collection ID:", ORDERS_ID);

        const result = await databases.listDocuments(DB_ID, ORDERS_ID, [
            Query.equal("restaurantId", restaurantId),
            Query.orderDesc("placedAt"),
            Query.limit(100),
        ]);

        console.log("🟢 Orders query result - Total:", result.total);
        console.log("🟢 Orders found:", result.documents.length);

        if (result.documents.length > 0) {
            result.documents.forEach((order, index) => {
                console.log(`🟢 Order ${index + 1}:`, {
                    id: order.$id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    restaurantId: order.restaurantId,
                    customerName: order.customerName,
                    totalPrice: order.totalPrice
                });
            });
        } else {
            console.log("⚠️ No orders found for this restaurant");

            // Let's check if there are ANY orders in the collection
            console.log("🔍 Checking all orders in collection...");
            const allOrders = await databases.listDocuments(DB_ID, ORDERS_ID, [
                Query.limit(10),
            ]);
            console.log("🔍 Total orders in collection:", allOrders.total);
            if (allOrders.documents.length > 0) {
                console.log("🔍 Sample orders and their restaurantIds:");
                allOrders.documents.forEach((order) => {
                    console.log(`   - Order ${order.orderNumber}: restaurantId = ${order.restaurantId}`);
                });
            }
        }

        return result.documents as Order[];
    };

    const loadOrders = useCallback(async () => {
        console.log("🟢 ========== LOAD ORDERS STARTED ==========");
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            console.log("🟢 Current user:", {
                id: user.$id,
                accountId: user.accountId,
                name: user.name,
                email: user.email
            });

            const restaurant = await fetchRestaurant(user.accountId);
            if (!restaurant) {
                console.error("❌ No restaurant found for this user");
                throw new Error("No restaurant found");
            }

            console.log("🟢 Restaurant found:", restaurant.$id);
            setCurrentRestaurantId(restaurant.$id);

            const ordersList = await fetchOrders(restaurant.$id);
            console.log("🟢 Setting orders state with", ordersList.length, "orders");

            setOrders(ordersList);
            filterOrders(ordersList, selectedFilter);
        } catch (err) {
            console.error("❌ Load orders error:", err);
            console.error("❌ Error stack:", (err as Error).stack);
            Alert.alert("Error", (err as Error).message);
        } finally {
            setLoading(false);
            setRefreshing(false);
            console.log("🟢 ========== LOAD ORDERS COMPLETED ==========");
        }
    }, [selectedFilter]);

    useEffect(() => {
        loadOrders();
    }, []);

    const onRefresh = () => {
        console.log("🔄 Refreshing orders...");
        setRefreshing(true);
        loadOrders();
    };

    const filterOrders = (ordersList: Order[], filter: string) => {
        console.log("🟢 Filtering orders:", { total: ordersList.length, filter });

        if (filter === "all") {
            setFilteredOrders(ordersList);
        } else if (filter === "active") {
            const filtered = ordersList.filter((o) =>
                ["pending", "accepted", "preparing", "ready"].includes(o.status)
            );
            console.log("🟢 Active orders found:", filtered.length);
            setFilteredOrders(filtered);
        } else {
            const filtered = ordersList.filter((o) => o.status === filter);
            console.log(`🟢 Orders with status '${filter}':`, filtered.length);
            setFilteredOrders(filtered);
        }
    };

    const handleFilterChange = (filter: string) => {
        console.log("🟢 Filter changed to:", filter);
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

            console.log("🟢 Updating order:", orderId, "to status:", newStatus);
            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, updateData);
            Alert.alert("Success", `Order status updated to ${STATUS_CONFIG[newStatus].label}`);
            loadOrders();
            setDetailsModalVisible(false);
        } catch (err) {
            console.error("❌ Update error:", err);
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
                break;
            case "out_for_delivery":
                break;
            case "delivered":
            case "cancelled":
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
            <View className="px-5 pt-5 pb-3 bg-white">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-xs font-semibold text-primary">ORDERS</Text>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">
                            Manage Orders
                        </Text>
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
                        <Pressable
                            onPress={onRefresh}
                            className="mt-4 bg-primary px-6 py-2 rounded-full"
                        >
                            <Text className="text-white font-semibold">Refresh</Text>
                        </Pressable>
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

                            {item.status === "ready" && !item.driverId && (
                                <View className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                                    <View className="flex-row items-center">
                                        <Ionicons name="bicycle" size={16} color="#3B82F6" />
                                        <Text className="text-sm text-blue-600 ml-2 font-semibold">
                                            Waiting for driver pickup
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {item.status === "out_for_delivery" && item.driverId && (
                                <View className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                                    <View className="flex-row items-center">
                                        <Ionicons name="bicycle" size={16} color="#3B82F6" />
                                        <Text className="text-sm text-blue-600 ml-2 font-semibold">
                                            Driver is delivering the order
                                        </Text>
                                    </View>
                                </View>
                            )}

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

            {/* Modal code remains the same... */}
        </SafeAreaView>
    );
}