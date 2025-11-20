import { View, Text, Alert } from "react-native";
import CustomButton from "@/components/CustomButton";
import { logout } from "@/lib/appwrite";
import { router } from "expo-router";

const DriverProfile = () => {

    const handleLogout = async () => {
        try {
            await logout();
            router.replace("/sign-in"); // Redirect to your login page
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to logout");
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-amber-50 p-5">
            <Text className="text-2xl font-bold mb-6">Driver Profile Page</Text>

            <CustomButton
                title="Logout"
                onPress={handleLogout}
                style="bg-red-700"
            />
        </View>
    );
};

export default DriverProfile;
