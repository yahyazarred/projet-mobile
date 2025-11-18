import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import useAuthStore from "@/store/auth.store";
import useAppwrite from "@/lib/useAppwrite";
import { getDriverDeliveryHistory, logout } from "@/lib/appwrite";

export default function DriverProfile() {
    const { user, setIsAuthenticated, setUser } = useAuthStore();
    const [loggingOut, setLoggingOut] = useState(false);
    const routerHook = useRouter();

    const {
        data: deliveryHistory,
        loading: historyLoading,
    } = useAppwrite({
        fn: getDriverDeliveryHistory,
        params: user?.$id || "",
        skip: !user?.$id,
    });

    const handleLogout = async () => {
        console.log("🟡 handleLogout called - bypassing alert");

        try {
            console.log("🔴 Starting logout...");
            setLoggingOut(true);

            // First, clear the auth state
            console.log("🔴 Clearing auth state...");
            setIsAuthenticated(false);
            setUser(null);

            // Then logout from Appwrite
            console.log("🔴 Logging out from Appwrite...");
            await logout();

            console.log("🔴 Attempting navigation...");

            // Try navigation
            router.replace("/(auth)/sign-in");

            console.log("✅ Logout complete!");

        } catch (error: any) {
            console.error("❌ Logout error:", error);
            // Even if logout fails, clear state and navigate
            setIsAuthenticated(false);
            setUser(null);
            router.replace("/(auth)/sign-in");
        } finally {
            setLoggingOut(false);
        }
    };

    // Check if user is authenticated, if not redirect
    useEffect(() => {
        if (!user && !loggingOut) {
            console.log("⚠️ No user found, redirecting to sign-in");
            router.replace("/(auth)/sign-in");
        }
    }, [user, loggingOut]);

    const stats = {
        totalDeliveries: (deliveryHistory as any[])?.length || 0,
        totalEarnings: (deliveryHistory as any[])?.reduce(
            (sum: number, order: any) => sum + (order.totalAmount || 0),
            0
        ) || 0,
        avgRating: 4.8,
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
            >
                {/* Header */}
                <View className="bg-white px-5 py-6">
                    <View className="items-center">
                        <View className="bg-primary w-24 h-24 rounded-full items-center justify-center mb-3">
                            <Ionicons name="person" size={48} color="white" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900">
                            {user?.name || "Driver"}
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            {user?.email || ""}
                        </Text>
                        <View className="bg-green-100 px-4 py-1 rounded-full mt-3">
                            <Text className="text-green-700 font-semibold text-xs">
                                ACTIVE DRIVER
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats Cards */}
                <View className="px-5 py-4">
                    <View className="flex-row space-x-3">
                        {/* Total Deliveries */}
                        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                            <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                                <Ionicons name="bicycle" size={24} color="#3b82f6" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">
                                {stats.totalDeliveries}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                                Total Deliveries
                            </Text>
                        </View>

                        {/* Average Rating */}
                        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                            <View className="bg-yellow-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                                <Ionicons name="star" size={24} color="#f59e0b" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">
                                {stats.avgRating}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                                Avg Rating
                            </Text>
                        </View>
                    </View>

                    {/* Total Earnings */}
                    <View className="bg-gradient-to-r from-primary to-orange-600 rounded-2xl p-5 mt-3 shadow-sm">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-white/80 text-sm mb-1">
                                    Total Earnings
                                </Text>
                                <Text className="text-white text-3xl font-bold">
                                    ${stats.totalEarnings.toFixed(2)}
                                </Text>
                            </View>
                            <View className="bg-white/20 w-16 h-16 rounded-full items-center justify-center">
                                <Ionicons name="cash" size={32} color="white" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recent Deliveries */}
                <View className="px-5 py-2">
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                        Recent Deliveries
                    </Text>

                    {historyLoading ? (
                        <View className="bg-white rounded-2xl p-8 items-center">
                            <ActivityIndicator size="large" color="#df5a0c" />
                            <Text className="text-gray-500 mt-2">Loading history...</Text>
                        </View>
                    ) : (deliveryHistory as any[])?.length > 0 ? (
                        <View className="bg-white rounded-2xl overflow-hidden">
                            {(deliveryHistory as any[])?.slice(0, 5).map((order: any, index: number) => (
                                <View
                                    key={order.$id}
                                    className={`p-4 flex-row items-center justify-between ${
                                        index !== 0 ? "border-t border-gray-100" : ""
                                    }`}
                                >
                                    <View className="flex-1">
                                        <Text className="text-base font-semibold text-gray-900">
                                            {order.restaurantName || "Restaurant"}
                                        </Text>
                                        <Text className="text-xs text-gray-500 mt-1">
                                            {new Date(order.deliveredAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-base font-bold text-primary">
                                            ${order.totalAmount?.toFixed(2)}
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                                            <Text className="text-xs text-green-600 ml-1">
                                                Delivered
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="bg-white rounded-2xl p-8 items-center">
                            <Ionicons name="document-text-outline" size={48} color="#ccc" />
                            <Text className="text-gray-500 mt-2">No delivery history</Text>
                        </View>
                    )}
                </View>

                {/* Settings Section */}
                <View className="px-5 py-4">
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                        Settings
                    </Text>

                    <View className="bg-white rounded-2xl overflow-hidden">
                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-gray-100"
                            activeOpacity={0.7}
                        >
                            <View className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                                <Ionicons name="person-outline" size={20} color="#374151" />
                            </View>
                            <Text className="flex-1 ml-3 text-base text-gray-900">
                                Edit Profile
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-gray-100"
                            activeOpacity={0.7}
                        >
                            <View className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                                <Ionicons name="notifications-outline" size={20} color="#374151" />
                            </View>
                            <Text className="flex-1 ml-3 text-base text-gray-900">
                                Notifications
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-gray-100"
                            activeOpacity={0.7}
                        >
                            <View className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                                <Ionicons name="help-circle-outline" size={20} color="#374151" />
                            </View>
                            <Text className="flex-1 ml-3 text-base text-gray-900">
                                Help & Support
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                console.log("🟢 LOGOUT BUTTON PRESSED!");
                                handleLogout();
                            }}
                            disabled={loggingOut}
                            className="flex-row items-center p-4"
                            activeOpacity={0.7}
                        >
                            <View className="bg-red-100 w-10 h-10 rounded-full items-center justify-center">
                                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                            </View>
                            <Text className="flex-1 ml-3 text-base text-red-600 font-semibold">
                                {loggingOut ? "Logging out..." : "Logout"}
                            </Text>
                            {loggingOut && <ActivityIndicator color="#dc2626" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}