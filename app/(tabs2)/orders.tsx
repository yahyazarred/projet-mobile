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
import { LinearGradient } from 'expo-linear-gradient';

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
    pending: { label: "NEW ORDER", color: "#EF4444", bgColor: "#FEE2E2", icon: "alert-circle" },
    accepted: { label: "ACCEPTED", color: "#F59E0B", bgColor: "#FEF3C7", icon: "checkmark-circle" },
    preparing: { label: "PREPARING", color: "#8B5CF6", bgColor: "#EDE9FE", icon: "restaurant" },
    ready: { label: "READY", color: "#10B981", bgColor: "#D1FAE5", icon: "checkmark-done" },
    out_for_delivery: { label: "OUT FOR DELIVERY", color: "#3B82F6", bgColor: "#DBEAFE", icon: "bicycle" },
    delivered: { label: "DELIVERED", color: "#6B7280", bgColor: "#F3F4F6", icon: "checkmark-done-circle" },
    cancelled: { label: "CANCELLED", color: "#DC2626", bgColor: "#FEE2E2", icon: "close-circle" },
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
                actions.push({ status: "accepted", label: "Accept" });
                actions.push({ status: "cancelled", label: "Reject" });
                break;
            case "accepted":
                actions.push({ status: "preparing", label: "Start Prep" });
                break;
            case "preparing":
                actions.push({ status: "ready", label: "Ready" });
                break;
        }
        return actions;
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-950">
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#334155']}
                    className="flex-1 justify-center items-center"
                >
                    <View className="bg-white/10 rounded-full p-8 mb-4">
                        <ActivityIndicator size="large" color="#f97316" />
                    </View>
                    <Text className="text-white text-lg font-semibold">Loading orders...</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#1e293b']}
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    {/* Header */}
                    <View className="px-5 pt-5 pb-3">
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <View className="flex-row items-center mb-2">
                                    <View className="w-1 h-6 bg-orange-500 rounded-full mr-2" />
                                    <Text className="text-orange-500 text-xs font-bold tracking-widest uppercase">
                                        Kitchen Display
                                    </Text>
                                </View>
                                <Text className="text-white text-3xl font-bold">Order Tickets</Text>
                            </View>
                            <View className="bg-orange-500/20 border border-orange-500/30 px-4 py-3 rounded-2xl">
                                <Text className="text-orange-500 font-bold text-xl">{filteredOrders.length}</Text>
                                <Text className="text-orange-300 text-xs">Active</Text>
                            </View>
                        </View>

                        {/* Filter Pills */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                            {[
                                { key: "all", label: "All", icon: "list" },
                                { key: "active", label: "Active", icon: "flame" },
                                { key: "pending", label: "New", icon: "alert-circle" },
                                { key: "preparing", label: "Prep", icon: "restaurant" },
                                { key: "ready", label: "Ready", icon: "checkmark-done" },
                                { key: "delivered", label: "Done", icon: "checkmark-circle" },
                            ].map((filter) => (
                                <Pressable
                                    key={filter.key}
                                    onPress={() => handleFilterChange(filter.key)}
                                    className={`mr-2 px-4 py-2 rounded-xl flex-row items-center ${
                                        selectedFilter === filter.key
                                            ? "bg-orange-500"
                                            : "bg-white/5 border border-white/10"
                                    }`}
                                >
                                    <Ionicons
                                        name={filter.icon as any}
                                        size={16}
                                        color={selectedFilter === filter.key ? "white" : "#94a3b8"}
                                    />
                                    <Text
                                        className={`font-semibold ml-2 ${
                                            selectedFilter === filter.key ? "text-white" : "text-slate-400"
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
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#f97316"
                            />
                        }
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <View className="bg-white/5 rounded-full p-8 mb-4 border border-white/10">
                                    <Ionicons name="receipt-outline" size={64} color="#475569" />
                                </View>
                                <Text className="text-white text-xl font-bold mb-2">No Orders</Text>
                                <Text className="text-slate-400 text-sm mb-6">
                                    {selectedFilter === "all" ? "No orders yet" : `No ${selectedFilter} orders`}
                                </Text>
                                <Pressable
                                    onPress={onRefresh}
                                    className="bg-orange-500 px-6 py-3 rounded-xl flex-row items-center"
                                >
                                    <Ionicons name="refresh" size={20} color="white" />
                                    <Text className="text-white font-semibold ml-2">Refresh</Text>
                                </Pressable>
                            </View>
                        }
                        renderItem={({ item, index }) => {
                            const statusConfig = STATUS_CONFIG[item.status];

                            let itemsArray: OrderItem[] = [];
                            try {
                                const parsed = JSON.parse(item.items);
                                if (Array.isArray(parsed)) itemsArray = parsed;
                                else itemsArray = [{ name: String(item.items), quantity: 1, price: item.totalPrice, menuItemId: "" }];
                            } catch {
                                itemsArray = [{ name: String(item.items), quantity: 1, price: item.totalPrice, menuItemId: "" }];
                            }

                            const orderTime = new Date(item.placedAt);
                            const timeString = orderTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            });

                            return (
                                <Animated.View
                                    entering={FadeInUp.duration(500).delay(index * 50)}
                                    className="mb-4"
                                >
                                    <Pressable
                                        onPress={() => showOrderDetails(item)}
                                        className="bg-white rounded-2xl overflow-hidden"
                                        style={{
                                            shadowColor: statusConfig.color,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 12,
                                            elevation: 8,
                                        }}
                                    >
                                        {/* Ticket Punch Holes */}
                                        <View className="absolute top-0 left-0 right-0 flex-row justify-between px-4 z-10">
                                            {[...Array(8)].map((_, i) => (
                                                <View
                                                    key={i}
                                                    className="w-3 h-3 rounded-full bg-slate-950 -mt-1.5"
                                                />
                                            ))}
                                        </View>

                                        {/* Status Banner */}
                                        <View
                                            className="py-3 items-center border-b-2 border-dashed border-gray-300"
                                            style={{ backgroundColor: statusConfig.bgColor }}
                                        >
                                            <Text
                                                className="text-xs font-black tracking-widest"
                                                style={{ color: statusConfig.color }}
                                            >
                                                {statusConfig.label}
                                            </Text>
                                        </View>

                                        {/* Ticket Header */}
                                        <View className="px-6 py-4 border-b-2 border-dashed border-gray-300">
                                            <View className="flex-row justify-between items-start mb-2">
                                                <View>
                                                    <Text className="text-2xl font-black text-gray-900">
                                                        #{item.orderNumber}
                                                    </Text>
                                                    <Text className="text-xs text-gray-500 font-mono mt-0.5">
                                                        {timeString.toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="items-end">
                                                    <Text className="text-2xl font-black text-orange-600">
                                                        ${item.totalPrice.toFixed(2)}
                                                    </Text>
                                                    <View className="bg-gray-100 px-3 py-1 rounded-full mt-1">
                                                        <Text className="text-xs font-bold text-gray-600">
                                                            {itemsArray.length} ITEM{itemsArray.length > 1 ? 'S' : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Customer Info */}
                                            <View className="bg-gray-50 rounded-lg px-3 py-2 mt-2">
                                                <View className="flex-row items-center">
                                                    <Ionicons name="person" size={14} color="#6b7280" />
                                                    <Text className="text-sm font-bold text-gray-700 ml-2">
                                                        {item.customerName}
                                                    </Text>
                                                </View>
                                                {item.customerPhone && (
                                                    <View className="flex-row items-center mt-1">
                                                        <Ionicons name="call" size={14} color="#6b7280" />
                                                        <Text className="text-xs text-gray-600 ml-2 font-mono">
                                                            {item.customerPhone}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Order Items */}
                                        <View className="px-6 py-4 bg-amber-50">
                                            <Text className="text-xs font-black text-gray-500 mb-3 tracking-wider">
                                                ORDER DETAILS
                                            </Text>
                                            {itemsArray.map((orderItem, idx) => (
                                                <View
                                                    key={idx}
                                                    className="flex-row justify-between mb-3 pb-3 border-b border-gray-200"
                                                >
                                                    <View className="flex-1 mr-4">
                                                        <View className="flex-row items-center">
                                                            <View className="bg-orange-500 rounded-md w-8 h-8 items-center justify-center mr-3">
                                                                <Text className="text-white font-black text-sm">
                                                                    {orderItem.quantity}×
                                                                </Text>
                                                            </View>
                                                            <Text className="text-base font-bold text-gray-900 flex-1">
                                                                {orderItem.name}
                                                            </Text>
                                                        </View>
                                                        {orderItem.customizations && orderItem.customizations.length > 0 && (
                                                            <View className="ml-11 mt-1">
                                                                {orderItem.customizations.map((custom, i) => (
                                                                    <Text key={i} className="text-xs text-gray-600 italic">
                                                                        • {custom}
                                                                    </Text>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text className="text-sm font-bold text-gray-700">
                                                        ${orderItem.price.toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Delivery Address */}
                                        {item.deliveryAddress && (
                                            <View className="px-6 py-3 bg-gray-50 border-t-2 border-dashed border-gray-300">
                                                <View className="flex-row items-start">
                                                    <Ionicons name="location" size={16} color="#f97316" />
                                                    <View className="flex-1 ml-2">
                                                        <Text className="text-xs font-black text-gray-500 mb-1">
                                                            DELIVERY TO:
                                                        </Text>
                                                        <Text className="text-sm text-gray-700 font-semibold">
                                                            {item.deliveryAddress}
                                                        </Text>
                                                        {item.deliveryInstructions && (
                                                            <Text className="text-xs text-gray-500 mt-1 italic">
                                                                Note: {item.deliveryInstructions}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        )}

                                        {/* Action Buttons */}
                                        {getStatusActions(item.status).length > 0 && (
                                            <View className="flex-row border-t-2 border-dashed border-gray-300">
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
                                                        className={`flex-1 py-4 items-center ${
                                                            idx > 0 ? "border-l border-gray-300" : ""
                                                        } ${action.status === "cancelled" ? "bg-red-50" : "bg-orange-50"}`}
                                                    >
                                                        <Text
                                                            className={`font-black text-sm tracking-wide ${
                                                                action.status === "cancelled" ? "text-red-600" : "text-orange-600"
                                                            }`}
                                                        >
                                                            {action.label.toUpperCase()}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        )}

                                        {/* Bottom Punch Holes */}
                                        <View className="absolute bottom-0 left-0 right-0 flex-row justify-between px-4 z-10">
                                            {[...Array(8)].map((_, i) => (
                                                <View
                                                    key={i}
                                                    className="w-3 h-3 rounded-full bg-slate-950 -mb-1.5"
                                                />
                                            ))}
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            );
                        }}
                    />
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}