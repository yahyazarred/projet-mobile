// ==================== IMPORTS ====================
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useAppwrite from "@/lib/useAppwrite";  // Custom hook for data fetching
import { getCurrentUser, updateUser, logout, account } from "@/lib/appwrite";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import LottieView from "lottie-react-native";

// ==================== PROFILE COMPONENT ====================
const Profile = () => {
    // ==================== DATA FETCHING ====================
    // useAppwrite: Custom hook that handles loading, error, and data states
    // Returns: { data, loading, refetch }
    const { data: user, loading, refetch } = useAppwrite({ fn: getCurrentUser });

    // ==================== STATE ====================
    const [isEditing, setIsEditing] = useState(false);  // Edit mode toggle
    const [form, setForm] = useState({
        name: "",
        email: "",
    });

    // ==================== SYNC FORM WITH USER DATA ====================
    // When user data loads, populate the form
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
            });
        }
    }, [user]);  // Runs when user changes

    // ==================== SAVE PROFILE CHANGES ====================
    const saveChanges = async () => {
        if (!user) return;

        try {
            // Only update if name changed (prevents unnecessary API calls)
            if (form.name !== user.name) {
                // Update in Appwrite auth system
                await account.updateName(form.name);
                // Update in our database
                await updateUser(user.$id, { name: form.name });
            }

            // Refresh user data from server
            await refetch();
            setIsEditing(false);  // Exit edit mode
            alert("Profile updated successfully!");
        } catch (error: any) {
            console.error("Update error:", error);
            alert("Failed to update profile.");
        }
    };

    // ==================== LOADING STATE ====================
    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#D4A574" />
            </SafeAreaView>
        );
    }

    // ==================== NO USER STATE ====================
    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500">No user data found.</Text>
            </SafeAreaView>
        );
    }

    // ==================== RENDER PROFILE ====================
    return (
        <SafeAreaView className="flex-1 bg-amber-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
            >
                {/* ==================== HEADER WITH ANIMATION ==================== */}
                <View className="relative h-56 rounded-b-[30px] overflow-hidden">

                    {/* Background Lottie Animation */}
                    <LottieView
                        source={require("@/assets/animations/Fast Food.json")}
                        autoPlay
                        loop
                        resizeMode="cover"
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            width: "100%",
                            height: "70%",
                            zIndex: -1,  // Behind other content
                        }}
                    />

                    {/* Header content on top of animation */}
                    <View className="pt-4 px-5">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-bold text-white">My Profile</Text>
                            <TouchableOpacity className="bg-white/20 p-2 rounded-full">
                                <Ionicons name="notifications-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ==================== FLOATING PROFILE PICTURE ==================== */}
                {/* Positioned to overlap header (negative margin) */}
                <View className="items-center">
                    <View
                        className="relative bg-white rounded-full"
                        style={{
                            marginTop: -24,  // Pulls up to overlap header
                            zIndex: 10,      // Appears above header
                            width: 110,
                            height: 110,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {/* Show avatar if exists, otherwise show initial letter */}
                        {user.avatar ? (
                            <Image
                                source={{ uri: user.avatar }}
                                className="w-full h-full rounded-full border-4 border-white"
                                resizeMode="cover"
                            />
                        ) : (
                            // Fallback: First letter of name
                            <Text className="text-4xl font-bold text-gray-700">
                                {user.name?.charAt(0).toUpperCase()}
                            </Text>
                        )}

                        {/* Camera icon button (bottom-right of profile pic) */}
                        <TouchableOpacity
                            className="absolute bottom-0 right-0 bg-amber-500 p-2 rounded-full border-4 border-white"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ==================== CONTENT SECTION ==================== */}
                <View className="px-5 pt-10 pb-8">

                    {/* ==================== USER STATS CARD ==================== */}
                    {/* Displays orders, favorites, reviews with Lottie icons */}
                    <View className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex-row justify-around">
                        {/* Orders stat */}
                        <View className="items-center">
                            <LottieView
                                source={require('@/assets/animations/Confirming Order.json')}
                                autoPlay
                                loop
                                style={{ width: 50, height: 50 }}
                            />
                            <Text className="text-2xl font-bold text-black">24</Text>
                            <Text className="text-xs text-gray-600 mt-1">Orders</Text>
                        </View>

                        {/* Vertical divider */}
                        <View className="w-px bg-amber-500" />

                        {/* Favorites stat */}
                        <View className="items-center">
                            <LottieView
                                source={require('@/assets/animations/like.json')}
                                speed={0.5}  // Slower animation
                                autoPlay
                                loop
                                style={{ width: 50, height: 50 }}
                            />
                            <Text className="text-2xl font-bold text-black">12</Text>
                            <Text className="text-xs text-gray-600 mt-1">Favorites</Text>
                        </View>

                        <View className="w-px bg-amber-500" />

                        {/* Reviews stat */}
                        <View className="items-center">
                            <LottieView
                                source={require('@/assets/animations/Winner.json')}
                                autoPlay
                                loop
                                style={{ width: 50, height: 50 }}
                            />
                            <Text className="text-2xl font-bold text-black">8</Text>
                            <Text className="text-xs text-gray-600 mt-1">Reviews</Text>
                        </View>
                    </View>

                    {/* ==================== PROFILE INFORMATION CARD ==================== */}
                    <View className="bg-white rounded-2xl p-5 shadow-md mb-6">
                        <Text className="text-lg font-bold text-black mb-4 text-center">
                            Profile Information
                        </Text>

                        {/* Name Field (editable when isEditing = true) */}
                        <View className="mb-4">
                            <Text className="text-xs text-gray-600 mb-2">Full Name</Text>
                            {isEditing ? (
                                // Edit mode: Show TextInput
                                <View className="flex-row items-center bg-amber-100 rounded-xl px-4 py-3 border border-amber-500">
                                    <Ionicons name="person-outline" size={20} color="#B91C1C" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 text-base"
                                        value={form.name}
                                        onChangeText={(text) => setForm({ ...form, name: text })}
                                        placeholder="Enter your name"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            ) : (
                                // View mode: Show static text
                                <View className="flex-row items-center bg-amber-50 rounded-xl px-4 py-3 border border-amber-500">
                                    <Ionicons name="person-outline" size={20} color="#F59E0B" />
                                    <Text className="ml-3 text-gray-900 text-base font-medium">
                                        {user.name}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Email Field (read-only, cannot be edited) */}
                        <View className="mb-4">
                            <Text className="text-xs text-gray-600 mb-2">Email Address</Text>
                            <View className="flex-row items-center bg-amber-50 rounded-xl px-4 py-3 border border-amber-500">
                                <Ionicons name="mail-outline" size={20} color="#F59E0B" />
                                <Text className="ml-3 text-gray-900 text-base font-medium">
                                    {user.email}
                                </Text>
                            </View>
                        </View>

                        {/* Role Badge (customer/driver/owner) */}
                        <View className="flex-row items-center bg-red-700 rounded-xl px-4 py-3">
                            <Ionicons name="shield-checkmark" size={20} color="white" />
                            <Text className="ml-3 text-white text-base font-medium capitalize">
                                {user.role || "Customer"}
                            </Text>
                        </View>
                    </View>

                    {/* ==================== ACTION BUTTONS ==================== */}
                    <View className="space-y-3">
                        {isEditing ? (
                            // Edit mode: Show Save and Cancel buttons
                            <>
                                <TouchableOpacity
                                    className="bg-red-700 rounded-xl p-4 shadow-sm mb-3"
                                    onPress={saveChanges}
                                    activeOpacity={0.8}
                                >
                                    <View className="flex-row items-center justify-center">
                                        <Ionicons name="checkmark-circle" size={22} color="white" />
                                        <Text className="text-white text-center font-semibold text-base ml-2">
                                            Save Changes
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="bg-gray-200 rounded-xl p-4"
                                    onPress={() => {
                                        setIsEditing(false);
                                        // Reset form to original user data
                                        setForm({
                                            name: user.name || "",
                                            email: user.email || "",
                                        });
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View className="flex-row items-center justify-center">
                                        <Ionicons name="close-circle" size={22} color="white" />
                                        <Text className="text-white text-center font-semibold text-base ml-2">
                                            Cancel
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        ) : (
                            // View mode: Show Edit Profile button
                            <>
                                <TouchableOpacity
                                    className="bg-amber-500 rounded-xl p-4 shadow-sm mb-3"
                                    onPress={() => setIsEditing(true)}
                                    activeOpacity={0.8}
                                >
                                    <View className="flex-row items-center justify-center">
                                        <Ionicons name="create-outline" size={22} color="white" />
                                        <Text className="text-white text-center font-semibold text-base ml-2">
                                            Edit Profile
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* ==================== QUICK ACTIONS MENU ==================== */}
                    <View className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
                        {/* Favorites */}
                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-amber-100"
                            activeOpacity={0.7}
                        >
                            <View className="bg-amber-50 p-2 rounded-full">
                                <Ionicons name="heart-outline" size={20} color="#F59E0B" />
                            </View>
                            <Text className="flex-1 ml-3 text-gray-900 font-medium">
                                My Favorites
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
                        </TouchableOpacity>

                        {/* Order History */}
                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-amber-100"
                            activeOpacity={0.7}
                        >
                            <View className="bg-amber-50 p-2 rounded-full">
                                <Ionicons name="receipt-outline" size={20} color="#F59E0B" />
                            </View>
                            <Text className="flex-1 ml-3 text-gray-900 font-medium">
                                Order History
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
                        </TouchableOpacity>

                        {/* Settings */}
                        <TouchableOpacity
                            className="flex-row items-center p-4"
                            activeOpacity={0.7}
                        >
                            <View className="bg-amber-50 p-2 rounded-full">
                                <Ionicons name="settings-outline" size={20} color="#F59E0B" />
                            </View>
                            <Text className="flex-1 ml-3 text-gray-900 font-medium">
                                Settings
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
                        </TouchableOpacity>
                    </View>

                    {/* ==================== LOGOUT BUTTON ==================== */}
                    <TouchableOpacity
                        className="bg-amber-500 rounded-xl p-4 shadow-sm mt-5 mb-5"
                        onPress={async () => {
                            await logout();
                            router.replace("../(auth)/sign-in");
                        }}
                        activeOpacity={0.8}
                    >
                        <View className="flex-row items-center justify-center">
                            <Ionicons name="log-out-outline" size={22} color="white" />
                            <Text className="text-white text-center font-semibold text-base ml-2">
                                Logout
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
