import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { logout, getCurrentUser } from "@/lib/appwrite";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAppwrite from "@/lib/useAppwrite";
import LottieView from "lottie-react-native";
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeIn,
    SlideInUp,
    SlideInDown,
    withDelay,
} from "react-native-reanimated";

const RestaurantProfile = () => {
    const { data: user, loading } = useAppwrite({ fn: getCurrentUser });

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace("../(auth)/sign-in");
                        } catch (error: any) {
                            console.error("Logout error:", error);
                            Alert.alert("Error", "Failed to log out. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const menuItems = [
        { icon: "restaurant-outline", label: "Menu Management", screen: "/menu" },
        { icon: "receipt-outline", label: "Orders", screen: "/orders" },
        { icon: "stats-chart-outline", label: "Analytics", screen: "/analytics" },
        { icon: "time-outline", label: "Operating Hours", screen: "/hours" },
        { icon: "notifications-outline", label: "Notifications", screen: "/notifications" },
        { icon: "settings-outline", label: "Settings", screen: "/settings" },
    ];

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#f97316" />
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500">No user data found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1">
            <ScrollView className="flex-1 bg-amber-50">

                {/* Cover Image */}
                <Animated.View entering={FadeInUp.duration(600).delay(50)}>
                    <View className="relative">
                        <Image
                            source={{ uri: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800" }}
                            className="w-full h-48"
                        />
                        <View className="absolute inset-0 bg-black/20" />
                    </View>
                </Animated.View>

                {/* Profile Header */}
                <Animated.View entering={FadeInUp.duration(600).delay(150)} className="px-4 -mt-16 mb-6">
                    <View className="bg-gray-50 rounded-2xl p-4 shadow-lg">
                        <View className="flex-row items-center relative">
                            <Image
                                source={{ uri: user.avatar }}
                                className="w-24 h-24 rounded-xl border-4 border-white"
                            />

                            <View className="flex-1 ml-4">
                                <Text className="text-2xl font-bold text-gray-900">{user.name}</Text>
                                <Text className="text-sm text-gray-600 mt-1">Restaurant Owner</Text>

                                <View className="flex-row items-center mt-2">
                                    <Ionicons name="shield-checkmark" size={16} color="#EA580C" />
                                    <Text className="text-sm font-semibold text-gray-700 ml-1">Verified Owner</Text>
                                </View>
                            </View>

                            {/* Lottie Animation */}
                            <View
                                style={{
                                    position: "absolute",
                                    right: 60,
                                    top: -46,
                                    width: 80,
                                    height: 80,
                                }}
                            >
                                <LottieView
                                    source={require("@/assets/animations/Chef pizza.json")}
                                    autoPlay
                                    loop
                                    style={{ width: 175, height: 175 }}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Quick Stats */}
                <Animated.View entering={FadeInUp.duration(600).delay(250)} className="px-4 mb-6">
                    <View className="bg-gray-50 rounded-2xl p-4 shadow-lg">
                        <Text className="text-lg font-bold text-gray-900 mb-3 text-center">Quick Stats</Text>

                        <View className="flex-row items-center">
                            {/* Stat 1 */}
                            <View className="flex-1 items-center">
                                <LottieView
                                    source={require("@/assets/animations/Confirming Order.json")}
                                    autoPlay
                                    loop
                                    style={{ width: 50, height: 50 }}
                                />
                                <Text className="text-2xl font-bold text-black mt-1">28</Text>
                                <Text className="text-xs text-gray-600 mt-1">Today's Orders</Text>
                            </View>

                            <View className="w-px bg-gray-200 h-full" />

                            {/* Stat 2 */}
                            <View className="flex-1 items-center">
                                <LottieView
                                    source={require("@/assets/animations/Money.json")}
                                    autoPlay
                                    loop
                                    style={{ width: 50, height: 50 }}
                                />
                                <Text className="text-2xl font-bold text-black mt-1">€2,450</Text>
                                <Text className="text-xs text-gray-600 mt-1">This Week</Text>
                            </View>

                            <View className="w-px bg-gray-200 h-full" />

                            {/* Stat 3 */}
                            <View className="flex-1 items-center">
                                <LottieView
                                    source={require("@/assets/animations/Star.json")}
                                    autoPlay
                                    loop
                                    style={{ width: 50, height: 50 }}
                                />
                                <Text className="text-2xl font-bold text-black mt-1">4.7</Text>
                                <Text className="text-xs text-gray-600 mt-1">Rating</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Contact Info */}
                <Animated.View entering={FadeInUp.duration(600).delay(350)} className="px-4 mb-6">
                    <View className="bg-gray-50 rounded-2xl p-4 shadow-lg">
                        <Text className="text-lg font-bold text-gray-900 mb-3 text-center">
                            Account Information
                        </Text>

                        <View>
                            <View className="flex-row items-center mb-3">
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                                    <Ionicons name="mail-outline" size={20} color="#EA580C" />
                                </View>

                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Email</Text>
                                    <Text className="text-sm text-gray-900">{user.email}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                                    <Ionicons name="person-outline" size={20} color="#EA580C" />
                                </View>

                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Role</Text>
                                    <Text className="text-sm text-gray-900 capitalize">Restaurant owner</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Management Menu */}
                <Animated.View entering={FadeInUp.duration(600).delay(450)} className="px-4 mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3 text-center">
                        Management
                    </Text>

                    <View className="bg-gray-50 rounded-2xl shadow-lg overflow-hidden">
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className={`flex-row items-center p-4 ${
                                    index !== menuItems.length - 1 ? "border-b border-gray-100" : ""
                                }`}
                                onPress={() => Alert.alert("Navigation", `Going to ${item.label}`)}
                            >
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                                    <Ionicons name={item.icon as any} size={22} color="#EA580C" />
                                </View>

                                <Text className="flex-1 ml-3 text-base text-gray-900">
                                    {item.label}
                                </Text>

                                <Ionicons name="chevron-forward" size={20} color="#EA580C" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* Logout Button */}
                <Animated.View entering={FadeInUp.duration(600).delay(550)} className="px-4 pb-8">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-orange-600 rounded-xl p-4 flex-row items-center justify-center shadow-sm mb-5"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={22} color="white" />
                        <Text className="text-white font-semibold text-base ml-2">
                            Logout
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default RestaurantProfile;
