// app/(tabs3)/history.tsx
import { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "@/store/auth.store";
import useAppwrite from "@/lib/useAppwrite";
import { getDriverDeliveryHistory } from "@/lib/appwrite";

export default function DeliveryHistory() {
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("all");

    const {
        data: deliveryHistory,
        loading,
        refetch,
    } = useAppwrite({
        fn: getDriverDeliveryHistory,
        params: user?.$id || "",
        skip: !user?.$id,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    // Filter deliveries by period
    const filteredDeliveries = (deliveryHistory as any[])?.filter((order) => {
        if (selectedPeriod === "all") return true;

        const deliveredDate = new Date(order.deliveredAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - deliveredDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (selectedPeriod === "week") return diffDays <= 7;
        if (selectedPeriod === "month") return diffDays <= 30;
        return true;
    }) || [];

    // Calculate stats
    const stats = {
        totalDeliveries: filteredDeliveries.length,
        totalEarnings: filteredDeliveries.reduce(
            (sum, order) => sum + (order.totalAmount || 0),
            0
        ),
    };

    const renderDeliveryCard = ({ item }: { item: any }) => (
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">
                        {item.restaurantName || "Restaurant"}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                        Order #{item.$id.slice(-6).toUpperCase()}
                    </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-green-700">
                        DELIVERED
                    </Text>
                </View>
            </View>

            <View className="space-y-2">
                {/* Delivery Date */}
                <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text className="ml-2 text-sm text-gray-600">
                        {new Date(item.deliveredAt).toLocaleString()}
                    </Text>
                </View>

                {/* Customer */}
                <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={16} color="#6b7280" />
                    <Text className="ml-2 text-sm text-gray-600">
                        {item.customerName || "Customer"}
                    </Text>
                </View>

                {/* Delivery Location */}
                <View className="flex-row items-start">
                    <Ionicons name="location-outline" size={16} color="#6b7280" />
                    <Text className="ml-2 text-sm text-gray-600 flex-1">
                        {item.deliveryAddress || "No address"}
                    </Text>
                </View>
            </View>

            {/* Earnings */}
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-600">Delivery Fee</Text>
                <Text className="text-lg font-bold text-primary">
                    ${(item.totalAmount * 0.15).toFixed(2)}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-4 pb-3 bg-white">
                <View className="mb-4">
                    <Text className="text-xs font-semibold text-primary">
                        DELIVERY HISTORY
                    </Text>
                    <Text className="text-2xl font-bold text-gray-900 mt-1">
                        Past Deliveries
                    </Text>
                </View>

                {/* Period Selector */}
                <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
                    {(["week", "month", "all"] as const).map((period) => (
                        <Pressable
                            key={period}
                            onPress={() => setSelectedPeriod(period)}
                            className={`flex-1 py-2 rounded-lg ${
                                selectedPeriod === period ? "bg-white" : ""
                            }`}
                        >
                            <Text
                                className={`text-center font-semibold text-sm ${
                                    selectedPeriod === period
                                        ? "text-primary"
                                        : "text-gray-600"
                                }`}
                            >
                                {period === "week"
                                    ? "This Week"
                                    : period === "month"
                                        ? "This Month"
                                        : "All Time"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Stats */}
                <View className="flex-row space-x-3">
                    <View className="flex-1 bg-blue-50 rounded-xl p-3">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-xs text-blue-600 mb-1">
                                    Total Deliveries
                                </Text>
                                <Text className="text-2xl font-bold text-blue-900">
                                    {stats.totalDeliveries}
                                </Text>
                            </View>
                            <Ionicons name="bicycle" size={28} color="#3b82f6" />
                        </View>
                    </View>
                    <View className="flex-1 bg-green-50 rounded-xl p-3">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-xs text-green-600 mb-1">
                                    Total Earnings
                                </Text>
                                <Text className="text-2xl font-bold text-green-900">
                                    ${(stats.totalEarnings * 0.15).toFixed(2)}
                                </Text>
                            </View>
                            <Ionicons name="cash" size={28} color="#22c55e" />
                        </View>
                    </View>
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#df5a0c" />
                    <Text className="mt-3 text-gray-600">Loading history...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDeliveries}
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
                                name="document-text-outline"
                                size={64}
                                color="#ccc"
                            />
                            <Text className="text-gray-500 mt-4 text-center">
                                No delivery history
                            </Text>
                            <Text className="text-gray-400 text-sm text-center">
                                Completed deliveries will appear here
                            </Text>
                        </View>
                    }
                    renderItem={renderDeliveryCard}
                />
            )}
        </SafeAreaView>
    );
}