import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
    ImageBackground,
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
            // Update only the name
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
            <ImageBackground
                source={require("@/assets/profile-bg.jpg")}
                className="flex-1"
                resizeMode="cover"
            >
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 30 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-2xl font-bold text-white">Profile</Text>
                        <Ionicons name="search-outline" size={22} color="#fff" />
                    </View>

                    {/* Profile Picture */}
                    <View className="items-center mb-6">
                        <Image
                            source={{ uri: user.avatar }}
                            className="w-28 h-28 rounded-full border-2 border-yellow-600"
                            resizeMode="cover"
                        />
                    </View>

                    {/* Profile Form */}
                    <ImageBackground
                        source={require("@/assets/form.jpg")}
                        className="rounded-2xl p-5 shadow-sm overflow-hidden"
                        resizeMode="cover"
                        imageStyle={{ opacity: 0.5 }}
                    >
                        {/* Name */}
                        <View className="mb-4">
                            <Text className="text-white text-sm">Full Name</Text>
                            {isEditing ? (
                                <TextInput
                                    className="text-gray-800 text-base font-semibold border-b border-gray-300"
                                    value={form.name}
                                    onChangeText={(text) => setForm({ ...form, name: text })}
                                />
                            ) : (
                                <Text className="text-gray-800 text-base font-semibold">{user.name}</Text>
                            )}
                        </View>

                        {/* Email (read-only) */}
                        <View className="mb-4">
                            <Text className="text-white text-sm">Email</Text>
                            <Text className="text-gray-800 text-base font-semibold">{user.email}</Text>
                        </View>

                        {/* Buttons */}
                        <View className="mt-8 space-y-3">
                            {isEditing ? (
                                <ImageBackground
                                    source={require("@/assets/save.jpg")}
                                    resizeMode="cover"
                                    imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                                    className="rounded-2xl overflow-hidden mb-3"
                                >
                                    <TouchableOpacity
                                        className="py-3 rounded-2xl"
                                        onPress={saveChanges}
                                        activeOpacity={0.8}
                                    >
                                        <Text className="text-white text-center font-semibold text-base">
                                            Save Changes
                                        </Text>
                                    </TouchableOpacity>
                                </ImageBackground>
                            ) : (
                                <ImageBackground
                                    source={require("@/assets/save.jpg")}
                                    resizeMode="cover"
                                    imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                                    className="rounded-2xl overflow-hidden mb-3"
                                >
                                    <TouchableOpacity
                                        className="py-3 rounded-2xl"
                                        onPress={() => setIsEditing(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Text className="text-white text-center font-semibold text-base">
                                            Edit Profile
                                        </Text>
                                    </TouchableOpacity>
                                </ImageBackground>
                            )}

                            <ImageBackground
                                source={require("@/assets/logout.jpg")}
                                resizeMode="cover"
                                imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                                className="rounded-2xl overflow-hidden mb-3"
                            >
                                <TouchableOpacity
                                    className="py-3 rounded-2xl"
                                    onPress={async () => {
                                        await logout();
                                        router.replace("../(auth)/sign-in");
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-white text-center font-semibold text-base">
                                        Logout
                                    </Text>
                                </TouchableOpacity>
                            </ImageBackground>
                        </View>
                    </ImageBackground>
                </ScrollView>
            </ImageBackground>
        </SafeAreaView>
    );
};

export default Profile;