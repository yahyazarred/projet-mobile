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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeIn,
    SlideInRight,
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
        {
            icon: "restaurant-outline",
            label: "Menu Management",
            screen: "/menu",
            color: "#f97316",
            bgColor: "#fff7ed"
        },
        {
            icon: "receipt-outline",
            label: "Orders",
            screen: "/orders",
            color: "#3b82f6",
            bgColor: "#eff6ff"
        },
        {
            icon: "stats-chart-outline",
            label: "Analytics",
            screen: "/analytics",
            color: "#8b5cf6",
            bgColor: "#f5f3ff"
        },
        {
            icon: "time-outline",
            label: "Operating Hours",
            screen: "/hours",
            color: "#10b981",
            bgColor: "#ecfdf5"
        },
        {
            icon: "notifications-outline",
            label: "Notifications",
            screen: "/notifications",
            color: "#ef4444",
            bgColor: "#fef2f2"
        },
        {
            icon: "settings-outline",
            label: "Settings",
            screen: "/settings",
            color: "#6b7280",
            bgColor: "#f9fafb"
        },
    ];

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
                    <Text className="text-white text-lg font-semibold">Loading profile...</Text>
                </LinearGradient>
            </View>
        );
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-slate-950">
                <Ionicons name="person-circle-outline" size={80} color="#475569" />
                <Text className="text-slate-400 mt-4">No user data found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#1e293b']}
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                        {/* Hero Header with Cover */}
                        <Animated.View entering={FadeInUp.duration(600).delay(50)}>
                            <View className="relative h-56">
                                {/* Cover Image */}
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800" }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />

                                {/* Gradient Overlay */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(15, 23, 42, 0.9)', '#0f172a']}
                                    className="absolute inset-0"
                                />

                                {/* Profile Avatar - Floating */}
                                <View className="absolute bottom-0 left-0 right-0 items-center">
                                    <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-1 mb-4">
                                        <Image
                                            source={{ uri: user.avatar }}
                                            className="w-32 h-32 rounded-3xl border-4 border-orange-500"
                                        />
                                        {/* Verified Badge */}
                                        <View className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-2">
                                            <Ionicons name="shield-checkmark" size={20} color="white" />
                                        </View>
                                    </View>
                                </View>

                                {/* Decorative Element */}
                                <View
                                    style={{
                                        position: "absolute",
                                        right: 20,
                                        top: 60,
                                        width: 100,
                                        height: 100,
                                    }}
                                >
                                    <LottieView
                                        source={require("@/assets/animations/Chef pizza.json")}
                                        autoPlay
                                        loop
                                        style={{ width: 180, height: 180 }}
                                    />
                                </View>
                            </View>
                        </Animated.View>

                        {/* Profile Info */}
                        <Animated.View entering={FadeInUp.duration(600).delay(150)} className="px-6 mt-4 mb-6">
                            <View className="items-center mb-6">
                                <Text className="text-white text-3xl font-bold mb-1">{user.name}</Text>
                                <Text className="text-orange-400 text-base font-semibold">Restaurant Owner</Text>
                                <View className="flex-row items-center mt-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                    <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                    <Text className="text-slate-300 text-sm">Active Now</Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Quick Stats Cards */}
                        <Animated.View entering={FadeInUp.duration(600).delay(250)} className="px-6 mb-6">
                            <View className="bg-white/5 rounded-3xl p-6 border border-white/10">
                                <Text className="text-white text-lg font-bold mb-4">Today's Overview</Text>

                                <View className="flex-row">
                                    {/* Stat 1 */}
                                    <View className="flex-1 items-center">
                                        <View className="bg-orange-500/20 rounded-2xl p-3 mb-2">
                                            <LottieView
                                                source={require("@/assets/animations/Confirming Order.json")}
                                                autoPlay
                                                loop
                                                style={{ width: 40, height: 40 }}
                                            />
                                        </View>
                                        <Text className="text-white text-2xl font-black">28</Text>
                                        <Text className="text-slate-400 text-xs mt-1">Orders</Text>
                                    </View>

                                    <View className="w-px bg-white/10 mx-4" />

                                    {/* Stat 2 */}
                                    <View className="flex-1 items-center">
                                        <View className="bg-green-500/20 rounded-2xl p-3 mb-2">
                                            <LottieView
                                                source={require("@/assets/animations/Money.json")}
                                                autoPlay
                                                loop
                                                style={{ width: 40, height: 40 }}
                                            />
                                        </View>
                                        <Text className="text-white text-2xl font-black">€2.4K</Text>
                                        <Text className="text-slate-400 text-xs mt-1">Revenue</Text>
                                    </View>

                                    <View className="w-px bg-white/10 mx-4" />

                                    {/* Stat 3 */}
                                    <View className="flex-1 items-center">
                                        <View className="bg-yellow-500/20 rounded-2xl p-3 mb-2">
                                            <LottieView
                                                source={require("@/assets/animations/Star.json")}
                                                autoPlay
                                                loop
                                                style={{ width: 40, height: 40 }}
                                            />
                                        </View>
                                        <Text className="text-white text-2xl font-black">4.7</Text>
                                        <Text className="text-slate-400 text-xs mt-1">Rating</Text>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Account Information */}
                        <Animated.View entering={FadeInUp.duration(600).delay(350)} className="px-6 mb-6">
                            <Text className="text-white text-lg font-bold mb-3">Account Details</Text>

                            <View className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                <View className="p-4 border-b border-white/10">
                                    <View className="flex-row items-center">
                                        <View className="bg-blue-500/20 rounded-xl p-3">
                                            <Ionicons name="mail-outline" size={24} color="#3b82f6" />
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className="text-slate-400 text-xs mb-1">Email Address</Text>
                                            <Text className="text-white text-base font-semibold">{user.email}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="p-4">
                                    <View className="flex-row items-center">
                                        <View className="bg-purple-500/20 rounded-xl p-3">
                                            <Ionicons name="person-outline" size={24} color="#8b5cf6" />
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className="text-slate-400 text-xs mb-1">Account Type</Text>
                                            <Text className="text-white text-base font-semibold">Premium Owner</Text>
                                        </View>
                                        <View className="bg-orange-500/20 px-3 py-1 rounded-full">
                                            <Text className="text-orange-400 text-xs font-bold">PRO</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Management Menu */}
                        <Animated.View entering={FadeInUp.duration(600).delay(450)} className="px-6 mb-6">
                            <Text className="text-white text-lg font-bold mb-3">Management</Text>

                            <View className="space-y-3">
                                {menuItems.map((item, index) => (
                                    <Animated.View
                                        key={index}
                                        entering={SlideInRight.duration(400).delay(500 + index * 50)}
                                    >
                                        <TouchableOpacity
                                            className="bg-white/5 rounded-2xl p-4 border border-white/10 active:scale-98"
                                            onPress={() => Alert.alert("Navigation", `Going to ${item.label}`)}
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-row items-center">
                                                <View
                                                    className="rounded-xl p-3"
                                                    style={{ backgroundColor: item.bgColor + '20' }}
                                                >
                                                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                                                </View>

                                                <Text className="flex-1 ml-4 text-white text-base font-semibold">
                                                    {item.label}
                                                </Text>

                                                <View className="bg-white/5 rounded-full p-2">
                                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        </Animated.View>

                        {/* Logout Button */}
                        <Animated.View entering={FadeInUp.duration(600).delay(900)} className="px-6 pb-8">
                            <TouchableOpacity
                                onPress={handleLogout}
                                className="active:scale-98"
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#dc2626', '#b91c1c']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="rounded-2xl p-5 flex-row items-center justify-center"
                                    style={{
                                        shadowColor: '#dc2626',
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 16,
                                    }}
                                >
                                    <Ionicons name="log-out-outline" size={24} color="white" />
                                    <Text className="text-white font-bold text-base ml-2">
                                        Logout from Account
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Footer Text */}
                            <Text className="text-slate-500 text-center text-xs mt-6">
                                Restaurant Management System v2.0
                            </Text>
                        </Animated.View>

                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

export default RestaurantProfile;