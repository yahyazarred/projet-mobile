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

            // 1️⃣ Create a user with role = restaurant_owner
            await createUser({
                email,
                password,
                name: ownerName,
                role: "restaurant_owner",
            });

            // 2️⃣ Fetch the user profile to get accountId
            const user = await getCurrentUser();
            if (!user) throw new Error("User creation failed");

            // 3️⃣ Create the restaurant and link to user
            await createRestaurant({
                ownerId: user.accountId,
                name: restaurantName,
                description,
            });

            Alert.alert("Success", "Restaurant created!");
            router.replace("..//(tabs2)/restaurant-profile");

        } catch (error: any) {
            console.error("OwnerSignUp error:", error);
            Alert.alert("Error", error.message || "Failed to create restaurant");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="gap-5 bg-white rounded-lg p-5 mt-5">

            <CustomInput
                label="Email"
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
            />

            <CustomInput
                label="Password"
                placeholder="Enter password"
                secureTextEntry
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
            />

            <CustomInput
                label="Owner Name"
                placeholder="Enter owner's full name"
                value={form.ownerName}
                onChangeText={(text) => setForm((prev) => ({ ...prev, ownerName: text }))}
            />

            <CustomInput
                label="Restaurant Name"
                placeholder="Enter your restaurant name"
                value={form.restaurantName}
                onChangeText={(text) => setForm((prev) => ({ ...prev, restaurantName: text }))}
            />

            <CustomInput
                label="Description"
                placeholder="Describe your restaurant"
                multiline
                value={form.description}
                onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
            />

            <CustomButton
                title="Submit"
                isLoading={isSubmitting}
                onPress={submit}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">Go back?</Text>
                <Link href="../(signup-choice)/sign-up-choice.tsx" className="base-bold text-primary">
                    Return
                </Link>
            </View>

        </View>
    );
};

export default OwnerSignUp;
