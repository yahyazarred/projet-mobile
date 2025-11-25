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

const DriverProfile = () => {
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
        { icon: "bicycle-outline", label: "Active Deliveries", screen: "/deliveries" },
        { icon: "time-outline", label: "Delivery History", screen: "/history" },
        { icon: "wallet-outline", label: "Earnings", screen: "/earnings" },
        { icon: "stats-chart-outline", label: "Performance", screen: "/performance" },
        { icon: "notifications-outline", label: "Notifications", screen: "/notifications" },
        { icon: "settings-outline", label: "Settings", screen: "/settings" },
    ];

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
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
            <ScrollView className="flex-1 bg-gray-50">
                {/* Cover Image */}
                <View className="relative">
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800" }}
                        className="w-full h-48"
                    />
                    <View className="absolute inset-0 bg-black/20" />
                </View>

                {/* Profile Header */}
                <View className="px-4 -mt-16 mb-6">
                    <View className="bg-white rounded-2xl p-4 shadow-lg">
                        <View className="flex-row items-center">
                            <Image
                                source={{ uri: user.avatar }}
                                className="w-24 h-24 rounded-xl border-4 border-white"
                            />
                            <View className="flex-1 ml-4">
                                <Text className="text-2xl font-bold text-gray-900">
                                    {user.name}
                                </Text>
                                <Text className="text-sm text-gray-600 mt-1">
                                    Delivery Agent
                                </Text>
                                <View className="flex-row items-center mt-2">
                                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                                    <Text className="text-sm font-semibold text-gray-700 ml-1">
                                        Verified Driver
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View className="px-4 mb-6">
                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-3">
                            Today's Stats
                        </Text>
                        <View className="flex-row justify-around">
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-blue-600">12</Text>
                                <Text className="text-xs text-gray-600 mt-1">Deliveries</Text>
                            </View>
                            <View className="w-px bg-gray-200" />
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-green-600">$84.50</Text>
                                <Text className="text-xs text-gray-600 mt-1">Earned</Text>
                            </View>
                            <View className="w-px bg-gray-200" />
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-purple-600">4.9</Text>
                                <Text className="text-xs text-gray-600 mt-1">Rating</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* This Week Overview */}
                <View className="px-4 mb-6">
                    <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-sm">
                        <Text className="text-white text-lg font-bold mb-3">
                            This Week
                        </Text>
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-white/80 text-xs mb-1">Total Deliveries</Text>
                                <Text className="text-white text-2xl font-bold">48</Text>
                            </View>
                            <View>
                                <Text className="text-white/80 text-xs mb-1">Total Earnings</Text>
                                <Text className="text-white text-2xl font-bold">$336.00</Text>
                            </View>
                            <View>
                                <Text className="text-white/80 text-xs mb-1">Avg. Time</Text>
                                <Text className="text-white text-2xl font-bold">18m</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Contact Info */}
                <View className="px-4 mb-6">
                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-3">
                            Account Information
                        </Text>
                        <View>
                            <View className="flex-row items-center mb-3">
                                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                                    <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Email</Text>
                                    <Text className="text-sm text-gray-900">{user.email}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center mb-3">
                                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                                    <Ionicons name="person-outline" size={20} color="#8B5CF6" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Role</Text>
                                    <Text className="text-sm text-gray-900 capitalize">{user.role}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                                    <Ionicons name="star-outline" size={20} color="#10B981" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Status</Text>
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                        <Text className="text-sm text-gray-900 font-semibold">Available</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menu Options */}
                <View className="px-4 mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                        Quick Access
                    </Text>
                    <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className={`flex-row items-center p-4 ${
                                    index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                                onPress={() => Alert.alert("Navigation", `Going to ${item.label}`)}
                            >
                                <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                                    <Ionicons name={item.icon as any} size={22} color="#6B7280" />
                                </View>
                                <Text className="flex-1 ml-3 text-base text-gray-900">
                                    {item.label}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Availability Toggle */}
                <View className="px-4 mb-6">
                    <TouchableOpacity
                        onPress={() => Alert.alert("Availability", "Toggle availability feature")}
                        className="bg-green-500 rounded-xl p-4 flex-row items-center justify-between shadow-sm"
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text className="text-white font-semibold text-base ml-3">
                                You're Available for Deliveries
                            </Text>
                        </View>
                        <Ionicons name="toggle" size={32} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View className="px-4 pb-8 mb-5">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-500 rounded-xl p-4 flex-row items-center justify-center shadow-sm"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={22} color="white" />
                        <Text className="text-white font-semibold text-base ml-2">
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default DriverProfile;