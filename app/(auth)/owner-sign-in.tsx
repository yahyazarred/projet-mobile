import { View, Text, Alert } from "react-native";
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { createUser, createRestaurant, logout, getCurrentUser } from "@/lib/appwrite";

const OwnerSignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
        ownerName: "",
        restaurantName: "",
        description: "",
    });

    const submit = async () => {
        const { email, password, ownerName, restaurantName, description } = form;

        if (!email || !password || !ownerName || !restaurantName || !description) {
            return Alert.alert("Error", "Please fill in all fields.");
        }

        setIsSubmitting(true);

        try {
            await logout().catch(() => null);

            // Create a user with role = restaurant_owner
            await createUser({
                email,
                password,
                name: ownerName,
                role: "restaurant_owner",
            });

            // Fetch the user profile to get accountId
            const user = await getCurrentUser();
            if (!user) throw new Error("User creation failed");

            // Create the restaurant and link to user
            await createRestaurant({
                ownerId: user.accountId,
                name: restaurantName,
                description,
            });

            Alert.alert("Success", "Restaurant created!");
            router.replace("../(tabs2)/restaurant-profile");

        } catch (error: any) {
            console.error("OwnerSignUp error:", error);
            Alert.alert("Error", error.message || "Failed to create restaurant");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="bg-amber-50 rounded-lg p-5 mt-5">

            {/* Email */}
            <View className="mb-4">
                <CustomInput
                    label="Email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>

            {/* Password */}
            <View className="mb-4">
                <CustomInput
                    label="Password"
                    placeholder="Enter password"
                    secureTextEntry
                    value={form.password}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>

            {/* Owner Name */}
            <View className="mb-4">
                <CustomInput
                    label="Owner Name"
                    placeholder="Enter owner's full name"
                    value={form.ownerName}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, ownerName: text }))}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>

            {/* Restaurant Name */}
            <View className="mb-4">
                <CustomInput
                    label="Restaurant Name"
                    placeholder="Enter your restaurant name"
                    value={form.restaurantName}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, restaurantName: text }))}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>

            {/* Description */}
            <View className="mb-4">
                <CustomInput
                    label="Description"
                    placeholder="Describe your restaurant"
                    multiline
                    value={form.description}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>

            {/* Submit button */}
            <CustomButton
                title="Submit"
                isLoading={isSubmitting}
                onPress={submit}
                style="bg-red-700"
            />

            {/* Go back / Return */}
            <View className="items-center mt-6">
                <Text className="text-gray-700 text-base">already have an account?</Text>
                <Link
                    href="../(signup-choice)/sign-up-choice"
                    className="text-red-700 font-semibold mt-1"
                >
                    Return
                </Link>
            </View>

        </View>
    );
};

export default OwnerSignUp;
