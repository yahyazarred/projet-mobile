// Driver Profile Screen
// This screen shows the delivery driver's account information, stats, and settings
// Displays daily/weekly earnings, delivery count, ratings, and quick access menu

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

// SafeAreaView prevents content overlap with device notches/status bar
import { SafeAreaView } from "react-native-safe-area-context";

// Import authentication functions from Appwrite
import { logout, getCurrentUser } from "@/lib/appwrite";

// Router for navigation between screens
import { router } from "expo-router";

// Ionicons for vector icons (stats, menu items, actions)
import { Ionicons } from "@expo/vector-icons";

// Custom hook for fetching data with Appwrite
import useAppwrite from "@/lib/useAppwrite";

// ===== Main Driver Profile Component =====
const DriverProfile = () => {
    // ===== Data Fetching =====
    // Fetch current user data using custom Appwrite hook
    // This hook automatically handles loading states and errors
    const { data: user, loading } = useAppwrite({ fn: getCurrentUser });

    // ===== Logout Handler =====
    // Function to log out the driver with confirmation dialog
    const handleLogout = async () => {
        // Show confirmation alert before logging out
        Alert.alert(
            "Logout",                           // Alert title
            "Are you sure you want to logout?", // Alert message
            [
                // Cancel button - closes dialog without action
                { text: "Cancel", style: "cancel" },
                {
                    // Logout button - red destructive style
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Call logout function to clear user session
                            await logout();

                            // Navigate to sign-in screen
                            // replace() removes current screen from navigation history
                            router.replace("../(auth)/sign-in");
                        } catch (error: any) {
                            // Log error for debugging
                            console.error("Logout error:", error);

                            // Show error alert to user
                            Alert.alert("Error", "Failed to log out. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    // ===== Menu Items Configuration =====
    // Array of quick access options for different features
    // Each item has an icon, label, and navigation route
    const menuItems = [
        {
            icon: "bicycle-outline",          // Ionicons icon name
            label: "Active Deliveries",       // Display text
            screen: "/deliveries"             // Navigation route
        },
        {
            icon: "time-outline",
            label: "Delivery History",
            screen: "/history"
        },
        {
            icon: "wallet-outline",
            label: "Earnings",                // View detailed earnings/payments
            screen: "/earnings"
        },
        {
            icon: "stats-chart-outline",
            label: "Performance",             // Performance metrics and analytics
            screen: "/performance"
        },
        {
            icon: "notifications-outline",
            label: "Notifications",
            screen: "/notifications"
        },
        {
            icon: "settings-outline",
            label: "Settings",                // App settings and preferences
            screen: "/settings"
        },
    ];

    // ===== Loading State =====
    // Show loading screen while fetching user data
    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    // ===== Error State =====
    // Show error message if user data couldn't be loaded
    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500">No user data found.</Text>
            </SafeAreaView>
        );
    }

    // ===== Main Profile Screen Render =====
    return (
        <SafeAreaView className="flex-1">
            {/* Scrollable container for all content */}
            <ScrollView className="flex-1 bg-gray-50">

                {/* ===== COVER IMAGE HEADER ===== */}
                {/* Background banner image at top of profile */}
                <View className="relative">
                    {/* Cover photo showing delivery/motorcycle theme */}
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800" }}
                        className="w-full h-48"
                    />
                    {/* Dark overlay to make text/content more visible */}
                    <View className="absolute inset-0 bg-black/20" />
                </View>

                {/* ===== PROFILE CARD ===== */}
                {/* Floating profile card with avatar and driver info */}
                <View className="px-4 -mt-16 mb-6">
                    {/* Card positioned to overlap cover image */}
                    <View className="bg-white rounded-2xl p-4 shadow-lg">
                        <View className="flex-row items-center">
                            {/* Driver's avatar/profile picture */}
                            <Image
                                source={{ uri: user.avatar }}
                                className="w-24 h-24 rounded-xl border-4 border-white"
                            />
                            {/* Driver information text */}
                            <View className="flex-1 ml-4">
                                {/* Driver's name */}
                                <Text className="text-2xl font-bold text-gray-900">
                                    {user.name}
                                </Text>
                                {/* Driver's role/title */}
                                <Text className="text-sm text-gray-600 mt-1">
                                    Delivery Agent
                                </Text>
                                {/* Verification badge */}
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

                {/* ===== TODAY'S STATS CARD ===== */}
                {/* Shows driver's performance for current day */}
                <View className="px-4 mb-6 ">
                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-3">
                            Today's Stats
                        </Text>
                        {/* Three-column stats layout */}
                        <View className="flex-row justify-around">
                            {/* Stat 1: Number of deliveries completed today */}
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-blue-600">12</Text>
                                <Text className="text-xs text-gray-600 mt-1">Deliveries</Text>
                            </View>

                            {/* Vertical divider line */}
                            <View className="w-px bg-gray-200" />

                            {/* Stat 2: Total earnings for today */}
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-green-600">$84.50</Text>
                                <Text className="text-xs text-gray-600 mt-1">Earned</Text>
                            </View>

                            {/* Vertical divider line */}
                            <View className="w-px bg-gray-200" />

                            {/* Stat 3: Current driver rating */}
                            <View className="items-center">
                                <Text className="text-2xl font-bold text-purple-600">4.9</Text>
                                <Text className="text-xs text-gray-600 mt-1">Rating</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ===== WEEKLY OVERVIEW CARD ===== */}
                {/* Summary of driver's weekly performance */}
                <View className="px-4 mb-6 ">
                    {/* Blue gradient card for visual distinction */}
                    <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-sm">
                        <Text className="text-black text-lg font-bold mb-3">
                            This Week
                        </Text>
                        {/* Three-column weekly stats */}
                        <View className="flex-row justify-between items-center">
                            {/* Weekly total deliveries */}
                            <View>
                                <Text className="text-black/80 text-xs mb-1">Total Deliveries</Text>
                                <Text className="text-black text-2xl font-bold">48</Text>
                            </View>
                            {/* Weekly total earnings */}
                            <View>
                                <Text className="text-black/80 text-xs mb-1">Total Earnings</Text>
                                <Text className="text-black text-2xl font-bold">$336.00</Text>
                            </View>
                            {/* Average delivery time */}
                            <View>
                                <Text className="text-black/80 text-xs mb-1">Avg. Time</Text>
                                <Text className="text-black text-2xl font-bold">18m</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ===== ACCOUNT INFORMATION CARD ===== */}
                {/* Displays driver's account details */}
                <View className="px-4 mb-6">
                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-3">
                            Account Information
                        </Text>
                        <View>
                            {/* Email Address Row */}
                            <View className="flex-row items-center mb-3">
                                {/* Email icon in blue circle */}
                                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                                    <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                                </View>
                                {/* Email label and value */}
                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Email</Text>
                                    <Text className="text-sm text-gray-900">{user.email}</Text>
                                </View>
                            </View>

                            {/* Role/Account Type Row */}
                            <View className="flex-row items-center mb-3">
                                {/* Person icon in purple circle */}
                                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                                    <Ionicons name="person-outline" size={20} color="#8B5CF6" />
                                </View>
                                {/* Role label and value */}
                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Role</Text>
                                    {/* Capitalize first letter of role */}
                                    <Text className="text-sm text-gray-900 capitalize">{user.role}</Text>
                                </View>
                            </View>

                            {/* Availability Status Row */}
                            <View className="flex-row items-center">
                                {/* Star icon in green circle */}
                                <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                                    <Ionicons name="star-outline" size={20} color="#10B981" />
                                </View>
                                {/* Status label and indicator */}
                                <View className="ml-3 flex-1">
                                    <Text className="text-xs text-gray-500">Status</Text>
                                    <View className="flex-row items-center">
                                        {/* Green dot indicating online/available status */}
                                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                        <Text className="text-sm text-gray-900 font-semibold">Available</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ===== QUICK ACCESS MENU ===== */}
                {/* List of navigation options for different features */}
                <View className="px-4 mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                        Quick Access
                    </Text>
                    {/* White card containing all menu items */}
                    <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {/* Loop through menuItems array and create row for each */}
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className={`flex-row items-center p-4 ${
                                    // Add border between items, except for last item
                                    index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                                // Currently shows alert, would navigate in production
                                onPress={() => Alert.alert("Navigation", `Going to ${item.label}`)}
                            >
                                {/* Menu item icon in gray circle */}
                                <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                                    <Ionicons name={item.icon as any} size={22} color="#6B7280" />
                                </View>
                                {/* Menu item label text */}
                                <Text className="flex-1 ml-3 text-base text-gray-900">
                                    {item.label}
                                </Text>
                                {/* Chevron arrow indicating navigation */}
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ===== AVAILABILITY TOGGLE BUTTON ===== */}
                {/* Button to toggle driver's online/available status */}
                <View className="px-4 mb-6">
                    <TouchableOpacity
                        onPress={() => Alert.alert("Availability", "Toggle availability feature")}
                        className="bg-green-500 rounded-xl p-4 flex-row items-center justify-between shadow-sm"
                        activeOpacity={0.7} // Slight transparency when pressed
                    >
                        {/* Left side: Status text with icon */}
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text className="text-white font-semibold text-base ml-3">
                                You're Available for Deliveries
                            </Text>
                        </View>
                        {/* Right side: Toggle icon (visual indicator, not functional yet) */}
                        <Ionicons name="toggle" size={32} color="white" />
                    </TouchableOpacity>
                </View>

                {/* ===== LOGOUT BUTTON ===== */}
                {/* Red button to log out of the account */}
                <View className="px-4 pb-8 mb-5">
                    <TouchableOpacity
                        onPress={handleLogout} // Trigger logout confirmation dialog
                        className="bg-red-500 rounded-xl p-4 flex-row items-center justify-center shadow-sm"
                        activeOpacity={0.7}
                    >
                        {/* Logout icon */}
                        <Ionicons name="log-out-outline" size={22} color="white" />
                        {/* Logout text */}
                        <Text className="text-white font-semibold text-base ml-2">
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Export component as default export
export default DriverProfile;