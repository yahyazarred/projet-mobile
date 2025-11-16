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
            // Clear existing session
            await logout().catch(() => null);

            // Sign in
            await signIn({ email, password });

            // Get user info to check role
            const user = await getCurrentUser();

            if (!user) throw new Error("User not found");

            // Redirect based on role
            if (user.role === "restaurant_owner") {
                router.replace("../(tabs2)/restaurant-profile");
            } else {
                router.replace("/"); // same as before
            }

        } catch (error: any) {
            Alert.alert("Error", error.message);
            console.error("SignIn error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="gap-10 bg-white rounded-lg p-5 mt-5">
            <CustomInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                label="Email"
                keyboardType="email-address"
            />
            <CustomInput
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                label="Password"
                secureTextEntry
            />

            <CustomButton title="Sign In" isLoading={isSubmitting} onPress={submit} />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">
                    Don't have an account?
                </Text>
                <Link href="../(signup-choice)/sign-up-choice" className="base-bold text-primary">
                    Sign Up
                </Link>
            </View>
        </View>
    );
};

export default SignIn;
