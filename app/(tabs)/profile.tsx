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
import { getCurrentUser, updateUser, logout } from "@/lib/appwrite";
import { router } from "expo-router";
import { useState, useEffect } from "react";

const Profile = () => {
    // Real hook (kept) but we provide a mock fallback for dev
    const { data: realUser, loading, refetch } = useAppwrite({ fn: getCurrentUser });

    // ---- TEMP DEV MOCK USER ----
    const DEV_USE_MOCK = true;

    const mockUser = {
        $id: "dev-mock-1",
        name: "Dev Tester",
        email: "dev@example.com",
        phone: "+1 555 000 000",
        addressHome: "123 Dev Street",
        addressWork: "456 Work Ave",
        avatar: "https://i.pravatar.cc/150?img=5",
    };

    // whichever is available: realUser (if auth works) or mockUser
    const user = DEV_USE_MOCK ? mockUser : realUser;

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        addressHome: "",
        addressWork: "",
    });

    // Populate form when user loads
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                addressHome: user.addressHome || "",
                addressWork: user.addressWork || "",
            });
        }
    }, [user]);

    const saveChanges = async () => {
        if (!user) return; // TypeScript safe guard
        try {
            await updateUser(user.$id, form);
            await refetch();
            setIsEditing(false);
        } catch (error: any) {
            console.error("Update error:", error);
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
            {/* Page background */}
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

                    {/* Profile Form with background */}
                    <ImageBackground
                        source={require("@/assets/form.jpg")}
                        className="rounded-2xl p-5 shadow-sm overflow-hidden"
                        resizeMode="cover"
                        imageStyle={{ opacity: 0.5 }}

                    >
                        {/* Full Name */}
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

                        {/* Email */}
                        <View className="mb-4">
                            <Text className="text-white text-sm">Email</Text>
                            {isEditing ? (
                                <TextInput
                                    className="text-gray-800 text-base font-semibold border-b border-gray-300"
                                    value={form.email}
                                    onChangeText={(text) => setForm({ ...form, email: text })}
                                />
                            ) : (
                                <Text className="text-gray-800 text-base font-semibold">{user.email}</Text>
                            )}
                        </View>

                        {/* Phone */}
                        <View className="mb-4">
                            <Text className="text-white text-sm">Phone</Text>
                            {isEditing ? (
                                <TextInput
                                    className="text-gray-800 text-base font-semibold border-b border-gray-300"
                                    value={form.phone}
                                    onChangeText={(text) => setForm({ ...form, phone: text })}
                                />
                            ) : (
                                <Text className="text-gray-800 text-base font-semibold">{user.phone}</Text>
                            )}
                        </View>

                        {/* Address Home */}
                        <View className="mb-4">
                            <Text className="text-white text-sm">Address Home</Text>
                            {isEditing ? (
                                <TextInput
                                    className="text-gray-800 text-base font-semibold border-b border-gray-300"
                                    value={form.addressHome}
                                    onChangeText={(text) => setForm({ ...form, addressHome: text })}
                                />
                            ) : (
                                <Text className="text-gray-800 text-base font-semibold">{user.addressHome}</Text>
                            )}
                        </View>

                        {/* Address Work */}
                        <View className="mb-4">
                            <Text className="text-white text-sm">Address Work</Text>
                            {isEditing ? (
                                <TextInput
                                    className="text-gray-800 text-base font-semibold border-b border-gray-300"
                                    value={form.addressWork}
                                    onChangeText={(text) => setForm({ ...form, addressWork: text })}
                                />
                            ) : (
                                <Text className="text-gray-800 text-base font-semibold">{user.addressWork}</Text>
                            )}
                        </View>

                        {/* Buttons */}
                        <View className="mt-8 space-y-3">
                            {isEditing ? (
                                <ImageBackground
                                    source={require("@/assets/save.jpg")} // ✅ background for Save button
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
                                    source={require("@/assets/save.jpg")} // ✅ background for Edit button
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
                                source={require("@/assets/logout.jpg")} // ✅ background for Logout button
                                resizeMode="cover"
                                imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                                className="rounded-2xl overflow-hidden mb-3"
                            >
                                <TouchableOpacity
                                    className="py-3 rounded-2xl"
                                    onPress={async () => {
                                        await logout();
                                        router.replace("/(auth)/sign-in");
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
