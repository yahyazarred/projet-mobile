import { View, Text, Alert } from "react-native";
import { logout } from "@/lib/appwrite";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";

const RestaurantProfile = () => {
    const handleLogout = async () => {
        try {
            await logout();
            router.replace("/sign-in");
        } catch (error: any) {
            Alert.alert("Error", "Failed to log out. Please try again.");
            console.error("Logout error:", error);
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-white px-4">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
                Restaurant Owner Profile
            </Text>

            <CustomButton title="Logout" onPress={handleLogout} />
        </View>
    );
};

export default RestaurantProfile;
