import { View, Text, Alert } from "react-native";
import { router } from "expo-router";
import { logout } from "@/lib/appwrite";
import CustomButton from "@/components/CustomButton"; // assuming you have this button component

const RestaurantOwnerMain = () => {
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
                Restaurant Owner Main Page
            </Text>

            <CustomButton title="Logout" onPress={handleLogout} />
        </View>
    );
};

export default RestaurantOwnerMain;
