// Restaurant owner profile screen showing account info, stats, and management options
// Displays user information, quick stats, account details, and navigation to other features

// Import React Native core components
import {
    View,
    Text,
    ScrollView,        // Scrollable container for long content
    TouchableOpacity,  // Touchable element with opacity feedback
    Image,             // Display images (avatar, cover photo)
    Alert,             // Native alert dialogs
    ActivityIndicator, // Loading spinner
} from "react-native";

// SafeAreaView prevents content from overlapping with device notches
import { SafeAreaView } from "react-native-safe-area-context";

// Import authentication functions from Appwrite
import { logout, getCurrentUser } from "@/lib/appwrite";

// Router for navigation between screens
import { router } from "expo-router";

// Vector icons library
import { Ionicons } from "@expo/vector-icons";

// Custom hook for fetching data with Appwrite
import useAppwrite from "@/lib/useAppwrite";

// Lottie for animated JSON-based animations
import LottieView from "lottie-react-native";

// LinearGradient for smooth color transitions
import { LinearGradient } from 'expo-linear-gradient';

// Main component for restaurant owner profile screen
const RestaurantProfile = () => {
    // ===== Data Fetching =====
    // Fetch current user data using custom Appwrite hook
    // This hook automatically handles loading states and errors
    const { data: user, loading } = useAppwrite({ fn: getCurrentUser });

    // ===== Logout Handler =====
    // Function to log out the user with confirmation dialog
    const handleLogout = async () => {
        // Show confirmation alert before logging out
        Alert.alert(
            "Logout",                           // Alert title
            "Are you sure you want to logout?", // Alert message
            [
                // Cancel button - does nothing
                { text: "Cancel", style: "cancel" },
                {
                    // Logout button - red destructive style
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Call logout function to clear session
                            await logout();

                            // Navigate to sign-in screen
                            // replace() removes current screen from navigation stack
                            router.replace("/(auth)/sign-in");
                        } catch (error: any) {
                            // Log error for debugging
                            console.error("Logout error:", error?.message || String(error));

                            // Show error alert to user
                            Alert.alert("Error", "Failed to log out. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    // ===== Menu Items Configuration =====
    // Array of management features the user can access
    // Each item has icon, label, navigation route, and custom colors
    const menuItems = [
        {
            icon: "restaurant-outline",           // Ionicons icon name
            label: "Menu Management",              // Display text
            screen: "/menu",                       // Navigation route (not currently used)
            color: "#f97316",                      // Icon and accent color (orange)
            bgColor: "#fff7ed"                     // Background color (light orange)
        },
        {
            icon: "receipt-outline",
            label: "Orders",
            screen: "/orders",
            color: "#3b82f6",                      // Blue
            bgColor: "#eff6ff"
        },
        {
            icon: "stats-chart-outline",
            label: "Analytics",
            screen: "/analytics",
            color: "#8b5cf6",                      // Purple
            bgColor: "#f5f3ff"
        },
        {
            icon: "time-outline",
            label: "Operating Hours",
            screen: "/hours",
            color: "#10b981",                      // Green
            bgColor: "#ecfdf5"
        },
        {
            icon: "notifications-outline",
            label: "Notifications",
            screen: "/notifications",
            color: "#ef4444",                      // Red
            bgColor: "#fef2f2"
        },
        {
            icon: "settings-outline",
            label: "Settings",
            screen: "/settings",
            color: "#6b7280",                      // Gray
            bgColor: "#f9fafb"
        },
    ];

    // ===== Loading State =====
    // Show loading screen while fetching user data
    if (loading) {
        return (
            <View className="flex-1 bg-slate-950">
                {/* Gradient background for visual appeal */}
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#334155']} // Dark gradient
                    className="flex-1 justify-center items-center"
                >
                    {/* Container with subtle background for spinner */}
                    <View className="bg-white/10 rounded-full p-8 mb-4">
                        <ActivityIndicator size="large" color="#f97316" />
                    </View>
                    <Text className="text-white text-lg font-semibold">Loading profile...</Text>
                </LinearGradient>
            </View>
        );
    }

    // ===== Error State =====
    // Show error message if user data couldn't be loaded
    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-slate-950">
                {/* Large person icon */}
                <Ionicons name="person-circle-outline" size={80} color="#475569" />
                <Text className="text-slate-400 mt-4">No user data found.</Text>
            </SafeAreaView>
        );
    }

    // ===== Main Profile Screen Render =====
    return (
        <View className="flex-1 bg-slate-950">
            {/* Background gradient for entire screen */}
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#1e293b']} // Dark blue/purple gradient
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    {/* Scrollable container for all content */}
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false} // Hide scroll bar
                    >

                        {/* ===== HERO HEADER WITH COVER IMAGE ===== */}
                        <View>
                            <View className="relative h-56">
                                {/* Cover Photo - Restaurant background image */}
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800" }}
                                    className="w-full h-full"
                                    resizeMode="cover" // Fill entire space while maintaining aspect ratio
                                />

                                {/* Gradient Overlay - Creates smooth transition to profile section */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(15, 23, 42, 0.9)', '#0f172a']}
                                    className="absolute inset-0" // Cover entire image
                                />

                                {/* Profile Avatar - Floating over cover image */}
                                <View className="absolute bottom-0 left-0 right-0 items-center">
                                    {/* Glass-morphism effect container */}
                                    <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-1 mb-4">
                                        {/* User avatar with orange border */}
                                        <Image
                                            source={{ uri: user.avatar }}
                                            className="w-32 h-32 rounded-3xl border-4 border-orange-500"
                                        />
                                        {/* Verified Badge - Shield icon in bottom-right corner */}
                                        <View className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-2">
                                            <Ionicons name="shield-checkmark" size={20} color="white" />
                                        </View>
                                    </View>
                                </View>

                                {/* Decorative Animated Element - Chef pizza animation */}
                                <View
                                    style={{
                                        position: "absolute",
                                        right: 20,
                                        top: 60,
                                        width: 100,
                                        height: 100,
                                    }}
                                >
                                    {/* Lottie animation - Animated chef making pizza */}
                                    <LottieView
                                        source={require("@/assets/animations/Chef pizza.json")}
                                        autoPlay       // Start animation automatically
                                        loop           // Loop animation continuously
                                        style={{ width: 180, height: 180 }}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* ===== PROFILE INFORMATION ===== */}
                        <View className="px-6 mt-4 mb-6">
                            <View className="items-center mb-6">
                                {/* User's name */}
                                <Text className="text-white text-3xl font-bold mb-1">{user.name}</Text>

                                {/* User's role */}
                                <Text className="text-orange-400 text-base font-semibold">Restaurant Owner</Text>

                                {/* Active status badge */}
                                <View className="flex-row items-center mt-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                    {/* Green dot indicator */}
                                    <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                    <Text className="text-slate-300 text-sm">Active Now</Text>
                                </View>
                            </View>
                        </View>

                        {/* ===== QUICK STATS CARDS ===== */}
                        {/* Dashboard showing today's key metrics */}
                        <View className="px-6 mb-6">
                            <View className="bg-white/5 rounded-3xl p-6 border border-white/10">
                                <Text className="text-white text-lg font-bold mb-4">Today's Overview</Text>

                                {/* Three-column stats layout */}
                                <View className="flex-row">
                                    {/* ===== STAT 1: Orders ===== */}
                                    <View className="flex-1 items-center">
                                        {/* Animated icon container */}
                                        <View className="bg-orange-500/20 rounded-2xl p-3 mb-2">
                                            <LottieView
                                                source={require("@/assets/animations/Confirming Order.json")}
                                                autoPlay
                                                loop
                                                style={{ width: 40, height: 40 }}
                                            />
                                        </View>
                                        {/* Stat value */}
                                        <Text className="text-white text-2xl font-black">28</Text>
                                        {/* Stat label */}
                                        <Text className="text-slate-400 text-xs mt-1">Orders</Text>
                                    </View>

                                    {/* Vertical divider line */}
                                    <View className="w-px bg-white/10 mx-4" />

                                    {/* ===== STAT 2: Revenue ===== */}
                                    <View className="flex-1 items-center">
                                        {/* Animated money icon */}
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

                                    {/* Vertical divider line */}
                                    <View className="w-px bg-white/10 mx-4" />

                                    {/* ===== STAT 3: Rating ===== */}
                                    <View className="flex-1 items-center">
                                        {/* Animated star icon */}
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
                        </View>

                        {/* ===== ACCOUNT INFORMATION ===== */}
                        {/* Detailed account information cards */}
                        <View className="px-6 mb-6">
                            <Text className="text-white text-lg font-bold mb-3">Account Details</Text>

                            <View className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                {/* Email Information Row */}
                                <View className="p-4 border-b border-white/10">
                                    <View className="flex-row items-center">
                                        {/* Email icon with blue background */}
                                        <View className="bg-blue-500/20 rounded-xl p-3">
                                            <Ionicons name="mail-outline" size={24} color="#3b82f6" />
                                        </View>
                                        {/* Email details */}
                                        <View className="ml-4 flex-1">
                                            <Text className="text-slate-400 text-xs mb-1">Email Address</Text>
                                            <Text className="text-white text-base font-semibold">{user.email}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Account Type Row */}
                                <View className="p-4">
                                    <View className="flex-row items-center">
                                        {/* Person icon with purple background */}
                                        <View className="bg-purple-500/20 rounded-xl p-3">
                                            <Ionicons name="person-outline" size={24} color="#8b5cf6" />
                                        </View>
                                        {/* Account type details */}
                                        <View className="ml-4 flex-1">
                                            <Text className="text-slate-400 text-xs mb-1">Account Type</Text>
                                            <Text className="text-white text-base font-semibold">Premium Owner</Text>
                                        </View>
                                        {/* PRO badge */}
                                        <View className="bg-orange-500/20 px-3 py-1 rounded-full">
                                            <Text className="text-orange-400 text-xs font-bold">PRO</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* ===== MANAGEMENT MENU ===== */}
                        {/* List of navigation options for different features */}
                        <View className="px-6 mb-6">
                            <Text className="text-white text-lg font-bold mb-3">Management</Text>

                            {/* Container for menu items */}
                            <View className="space-y-3">
                                {/* Loop through menuItems array and create button for each */}
                                {menuItems.map((item, index) => (
                                    <View key={index}>
                                        <TouchableOpacity
                                            className="bg-white/5 rounded-2xl p-4 border border-white/10 active:scale-98"
                                            // Currently shows alert, but would navigate in production
                                            onPress={() => Alert.alert("Navigation", `Going to ${item.label}`)}
                                            activeOpacity={0.7} // Slight transparency when pressed
                                        >
                                            <View className="flex-row items-center">
                                                {/* Icon container with custom color */}
                                                <View
                                                    className="rounded-xl p-3"
                                                    style={{ backgroundColor: item.bgColor + '20' }} // Add transparency
                                                >
                                                    <Ionicons
                                                        name={item.icon as any}
                                                        size={24}
                                                        color={item.color}
                                                    />
                                                </View>

                                                {/* Menu item label */}
                                                <Text className="flex-1 ml-4 text-white text-base font-semibold">
                                                    {item.label}
                                                </Text>

                                                {/* Chevron/arrow indicating it's tappable */}
                                                <View className="bg-white/5 rounded-full p-2">
                                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ===== LOGOUT BUTTON ===== */}
                        {/* Prominent logout button at bottom of screen */}
                        <View className="px-6 pb-8">
                            <TouchableOpacity
                                onPress={handleLogout} // Trigger logout confirmation
                                className="active:scale-98" // Slight shrink effect when pressed
                                activeOpacity={0.9}
                            >
                                {/* Red gradient button with shadow */}
                                <LinearGradient
                                    colors={['#dc2626', '#b91c1c']} // Red gradient
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
                                    {/* Logout icon */}
                                    <Ionicons name="log-out-outline" size={24} color="white" />
                                    {/* Logout text */}
                                    <Text className="text-white font-bold text-base ml-2">
                                        Logout from Account
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Footer Text - App version */}
                            <Text className="text-slate-500 text-center text-xs mt-6">
                                Restaurant Management System v2.0
                            </Text>
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

// Export component as default export
export default RestaurantProfile;