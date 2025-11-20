import { View, Text, Alert } from "react-native";
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { signIn, logout, getCurrentUser } from "@/lib/appwrite";

const SignIn = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });

    const submit = async () => {
        const { email, password } = form;

        if (!email || !password) {
            return Alert.alert("Error", "Please enter valid email address & password.");
        }

        setIsSubmitting(true);

        try {
            await logout().catch(() => null);
            await signIn({ email, password });

            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            // ---------------- ROLE-BASED NAVIGATION ----------------
            if (user.role === "restaurant_owner") {
                router.replace("../(tabs2)/restaurant-profile"); // unchanged
            } else if (user.role === "driver") {
                router.replace("../(tabs3)/driver-profile"); // <-- placeholder, replace with your driver home screen path
            } else {
                router.replace("/"); // customer path unchanged
            }

        } catch (error: any) {
            Alert.alert("Error", error.message);
            console.error("SignIn error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="gap-10 bg-amber-50 rounded-lg p-5 mt-5">
            <CustomInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                label="Email"
                keyboardType="email-address"
                className="bg-transparent"
            />

            <CustomInput
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                label="Password"
                secureTextEntry
                className="bg-transparent"
            />

            <CustomButton title="Sign In" isLoading={isSubmitting} onPress={submit} style="bg-red-700"/>

            <View className="flex justify-center mt-5 flex-col items-center">
                <Text className="text-gray-700">
                    Don't have an account?
                </Text>

                <Link
                    href="../(signup-choice)/sign-up-choice"
                    className="text-red-700 font-semibold mt-1"
                >
                    Sign Up
                </Link>
            </View>

        </View>
    );
};

export default SignIn;
