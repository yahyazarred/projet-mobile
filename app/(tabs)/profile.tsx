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
import useAppwrite from "@/lib/useAppwrite";
import { getCurrentUser, updateUser, logout, account } from "@/lib/appwrite";
import { router } from "expo-router";
import { useState, useEffect } from "react";

const Profile = () => {
    const { data: user, loading, refetch } = useAppwrite({ fn: getCurrentUser });

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
            });
        }
    }, [user]);

    const saveChanges = async () => {
        if (!user) return;

        try {
            if (form.name !== user.name) {
                await account.updateName(form.name);
                await updateUser(user.$id, { name: form.name });
            }

            await refetch();
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error: any) {
            console.error("Update error:", error);
            alert("Failed to update profile.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#D4A574" />
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
        <SafeAreaView className="flex-1 bg-amber-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
            >
                {/* Header with mustard gradient */}
                <View className="bg-amber-600 pb-20 pt-4 px-5 rounded-b-[30px]">
                    <View className="flex-row justify-between items-center mb-8">
                        <Text className="text-2xl font-bold text-white">My Profile</Text>
                        <TouchableOpacity className="bg-white/20 p-2 rounded-full">
                            <Ionicons name="notifications-outline" size={24} color="#ffff" />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Picture */}
                    <View className="items-center -mb-16">
                        <View className="relative">
                            <Image
                                source={{ uri: user.avatar }}
                                className="w-32 h-32 rounded-full border-4 border-white"
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                className="absolute bottom-0 right-0 bg-amber-600 p-2 rounded-full border-4 border-white"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="camera" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View className="px-5 pt-20 pb-8">
                    {/* User Stats */}
                    <View className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex-row justify-around">
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-black">24</Text>
                            <Text className="text-xs text-gray-600 mt-1">Orders</Text>
                        </View>
                        <View className="w-px bg-amber-500" />
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-black">12</Text>
                            <Text className="text-xs text-gray-600 mt-1">Favorites</Text>
                        </View>
                        <View className="w-px bg-amber-500" />
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-black">8</Text>
                            <Text className="text-xs text-gray-600 mt-1">Reviews</Text>
                        </View>
                    </View>

                    {/* Profile Information */}
                    <View className="bg-white rounded-2xl p-5 shadow-md mb-6">
                        <Text className="text-lg font-bold text-black mb-4 text-center">
                            Profile Information
                        </Text>

                        {/* Name Field */}
                        <View className="mb-4">
                            <Text className="text-xs text-gray-600 mb-2">Full Name</Text>
                            {isEditing ? (
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
                                <View className="flex-row items-center bg-amber-50 rounded-xl px-4 py-3 border border-amber-500">
                                    <Ionicons name="person-outline" size={20} color="#D97706" />
                                    <Text className="ml-3 text-gray-900 text-base font-medium">
                                        {user.name}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Email Field */}
                        <View className="mb-4">
                            <Text className="text-xs text-gray-600 mb-2">Email Address</Text>
                            <View className="flex-row items-center bg-amber-50 rounded-xl px-4 py-3 border border-orange-500">
                                <Ionicons name="mail-outline" size={20} color="#B91C1C" />
                                <Text className="ml-3 text-gray-900 text-base font-medium">
                                    {user.email}
                                </Text>
                            </View>
                        </View>

                        {/* Role Badge */}
                        <View className="flex-row items-center bg-red-700 rounded-xl px-4 py-3">
                            <Ionicons name="shield-checkmark" size={20} color="white" />
                            <Text className="ml-3 text-white text-base font-medium capitalize">
                                {user.role || "Customer"}
                            </Text>
                        </View>
                    </View>


                    {/* Action Buttons */}
                    <View className="space-y-3">
                        {isEditing ? (
                            <>
                                <TouchableOpacity
                                    className="bg-orange-600 rounded-xl p-4 shadow-sm mb-3"
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
                                        setForm({
                                            name: user.name || "",
                                            email: user.email || "",
                                        });
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View className="flex-row items-center justify-center">
                                        <Ionicons name="close-circle" size={22} color="#6B7280" />
                                        <Text className="text-gray-700 text-center font-semibold text-base ml-2">
                                            Cancel
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        ) : (
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
                                <TouchableOpacity
                                    className="bg-amber-500 rounded-xl p-4 shadow-sm"
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
                            </>
                        )}
                    </View>

                    {/* Quick Actions */}
                    <View className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-amber-100"
                            activeOpacity={0.7}
                        >
                            <View className="bg-amber-50 p-2 rounded-full">
                                <Ionicons name="heart-outline" size={20} color="#B91C1C" />
                            </View>
                            <Text className="flex-1 ml-3 text-gray-900 font-medium">
                                My Favorites
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-amber-100"
                            activeOpacity={0.7}
                        >
                            <View className="bg-amber-50 p-2 rounded-full">
                                <Ionicons name="receipt-outline" size={20} color="#D97706" />
                            </View>
                            <Text className="flex-1 ml-3 text-gray-900 font-medium">
                                Order History
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-4"
                            activeOpacity={0.7}
                        >
                            <View className="bg-amber-50 p-2 rounded-full">
                                <Ionicons name="settings-outline" size={20} color="#D97706" />
                            </View>
                            <Text className="flex-1 ml-3 text-gray-900 font-medium">
                                Settings
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;