import { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Modal,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Models, Query } from "react-native-appwrite";
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";

interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customizations?: string[];
}

interface DeliveryHistory extends Models.Document {
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    restaurantId: string;
    items: string;
    status: "delivered" | "cancelled";
    totalPrice: number;
    deliveryAddress: string;
    placedAt: string;
    driverId: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    deliveryFee: number;
}

const DB_ID = appwriteConfig.databaseId;
const ORDERS_ID = appwriteConfig.ordersCollectionId;

export default function DriverHistory() {
    const [deliveries, setDeliveries] = useState<DeliveryHistory[]>([]);
    const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentDriverId, setCurrentDriverId] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryHistory | null>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const [averageRating] = useState(4.8);

    const loadHistory = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            setCurrentDriverId(user.$id);

            const result = await databases.listDocuments(DB_ID, ORDERS_ID, [
                Query.equal("driverId", user.$id),
                Query.equal("status", "delivered"),
                Query.orderDesc("deliveredAt"),
                Query.limit(100),
            ]);

            const history = result.documents as DeliveryHistory[];
            setDeliveries(history);
            filterByPeriod(history, selectedPeriod);
        } catch (err) {
            console.error("Load history error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadHistory();
    }, [selectedPeriod]);

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const filterByPeriod = (deliveriesList: DeliveryHistory[], period: string) => {
        const now = new Date();
        let filtered = deliveriesList;

        if (period === "today") {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filtered = deliveriesList.filter(d => new Date(d.deliveredAt!) >= todayStart);
        } else if (period === "week") {
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = deliveriesList.filter(d => new Date(d.deliveredAt!) >= weekStart);
        } else if (period === "month") {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = deliveriesList.filter(d => new Date(d.deliveredAt!) >= monthStart);
        }

        setFilteredDeliveries(filtered);
    };

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);
    };

    const showDeliveryDetails = (delivery: DeliveryHistory) => {
        setSelectedDelivery(delivery);
        setDetailsModalVisible(true);
    };

    const calculateDeliveryTime = (pickedUp?: string, delivered?: string) => {
        if (!pickedUp || !delivered) return "N/A";

        const start = new Date(pickedUp);
        const end = new Date(delivered);
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.round(diffMs / 60000);

        return `${diffMins}m`;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-gray-600">Loading history...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="px-5 pt-5 pb-3 bg-white">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-xs font-semibold text-blue-600">HISTORY</Text>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">
                            Delivery History
                        </Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {[
                        { key: "today", label: "Today" },
                        { key: "week", label: "This Week" },
                        { key: "month", label: "This Month" },
                        { key: "all", label: "All Time" },
                    ].map((period) => (
                        <Pressable
                            key={period.key}
                            onPress={() => handlePeriodChange(period.key)}
                            className={`mr-2 px-4 py-2 rounded-full ${
                                selectedPeriod === period.key ? "bg-blue-600" : "bg-gray-100"
                            }`}
                        >
                            <Text
                                className={`font-semibold ${
                                    selectedPeriod === period.key ? "text-white" : "text-gray-700"
                                }`}
                            >
                                {period.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <View className="flex-row gap-2 mb-2">
                    <View className="flex-1 bg-blue-50 rounded-xl p-3">
                        <Text className="text-xs text-blue-600 font-semibold">DELIVERIES</Text>
                        <Text className="text-2xl font-bold text-blue-600 mt-1">
                            {filteredDeliveries.length}
                        </Text>
                    </View>
                    <View className="flex-1 bg-green-50 rounded-xl p-3">
                        <Text className="text-xs text-green-600 font-semibold">EARNED</Text>
                        <Text className="text-2xl font-bold text-green-600 mt-1">
                            ${filteredDeliveries.reduce((sum, d) => sum + (d.deliveryFee || 5), 0).toFixed(2)}
                        </Text>
                    </View>
                    <View className="flex-1 bg-purple-50 rounded-xl p-3">
                        <Text className="text-xs text-purple-600 font-semibold">RATING</Text>
                        <Text className="text-2xl font-bold text-purple-600 mt-1">
                            {averageRating.toFixed(1)}
                        </Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={filteredDeliveries}
                keyExtractor={(item) => item.$id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="document-text-outline" size={64} color="#ccc" />
                        <Text className="text-gray-500 mt-4 text-lg">No deliveries found</Text>
                        <Text className="text-gray-400 text-sm">
                            {selectedPeriod === "all"
                                ? "You haven't completed any deliveries yet"
                                : `No deliveries in ${selectedPeriod}`}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const itemsArray: OrderItem[] = JSON.parse(item.items);
                    const deliveryTime = calculateDeliveryTime(item.pickedUpAt, item.deliveredAt);
                    const earnedAmount = item.deliveryFee || 5;

                    return (
                        <Pressable
                            onPress={() => showDeliveryDetails(item)}
                            className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
                        >
                            <View className="p-4 border-b border-gray-100">
                                <View className="flex-row justify-between items-center mb-2">
                                    <View className="flex-row items-center">
                                        <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                                        <Text className="text-base font-bold text-gray-900">
                                            #{item.orderNumber}
                                        </Text>
                                    </View>
                                    <View className="bg-green-50 px-3 py-1 rounded-full">
                                        <Text className="text-xs font-semibold text-green-600">
                                            Delivered
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {item.customerName}
                                        </Text>
                                        <Text className="text-xs text-gray-500 mt-1">
                                            {item.deliveredAt
                                                ? new Date(item.deliveredAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'N/A'}
                                        </Text>
                                    </View>
                                    <Text className="text-lg font-bold text-green-600 ml-2">
                                        ${earnedAmount.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            <View className="px-4 py-3 bg-gray-50">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <Ionicons name="location" size={14} color="#6B7280" />
                                        <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
                                            {item.deliveryAddress.substring(0, 30)}...
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="time" size={14} color="#6B7280" />
                                        <Text className="text-xs text-gray-600 ml-1">{deliveryTime}</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="cube" size={14} color="#6B7280" />
                                        <Text className="text-xs text-gray-600 ml-1">
                                            {itemsArray.length} item{itemsArray.length > 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    );
                }}
            />

            <Modal visible={detailsModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[85%]">
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Delivery Details</Text>
                            <Pressable onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </Pressable>
                        </View>

                        {selectedDelivery && (
                            <ScrollView className="p-5">
                                <View className="mb-5">
                                    <Text className="text-2xl font-bold text-gray-900 mb-1">
                                        #{selectedDelivery.orderNumber}
                                    </Text>
                                    <View className="self-start px-3 py-1 rounded-full bg-green-50">
                                        <Text className="text-sm font-semibold text-green-600">
                                            ✓ Delivered
                                        </Text>
                                    </View>
                                </View>

                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <Text className="text-xs font-semibold text-gray-500 mb-3">DELIVERY INFO</Text>

                                    <View className="mb-3">
                                        <Text className="text-xs text-gray-500 mb-1">Customer</Text>
                                        <Text className="text-base font-semibold text-gray-900">
                                            {selectedDelivery.customerName}
                                        </Text>
                                    </View>

                                    <View className="mb-3">
                                        <Text className="text-xs text-gray-500 mb-1">Delivery Address</Text>
                                        <Text className="text-sm text-gray-700">
                                            {selectedDelivery.deliveryAddress}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View>
                                            <Text className="text-xs text-gray-500 mb-1">Picked Up</Text>
                                            <Text className="text-sm font-semibold text-gray-900">
                                                {selectedDelivery.pickedUpAt
                                                    ? new Date(selectedDelivery.pickedUpAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'N/A'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 mb-1">Delivered</Text>
                                            <Text className="text-sm font-semibold text-gray-900">
                                                {selectedDelivery.deliveredAt
                                                    ? new Date(selectedDelivery.deliveredAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'N/A'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 mb-1">Time Taken</Text>
                                            <Text className="text-sm font-semibold text-gray-900">
                                                {calculateDeliveryTime(selectedDelivery.pickedUpAt, selectedDelivery.deliveredAt)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-gray-500 mb-3">ORDER ITEMS</Text>
                                    {JSON.parse(selectedDelivery.items).map((item: OrderItem, idx: number) => (
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

                                <View className="bg-green-50 rounded-xl p-4">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm text-gray-600">Order Total</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            ${selectedDelivery.totalPrice.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between pt-2 border-t border-green-200">
                                        <Text className="text-base font-bold text-gray-900">Your Earnings</Text>
                                        <Text className="text-xl font-bold text-green-600">
                                            ${(selectedDelivery.deliveryFee || 5).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}