import { View, Text, Alert } from "react-native";
import { Link, router } from "expo-router";
import { useState } from "react";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { createUser, logout } from "@/lib/appwrite";

const DRIVER_SECRET_CODE = "pizza4life";

const SignUpDriver = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        secretCode: "",
        role: "driver",
    });

    const submit = async () => {
        const { name, email, password, secretCode, role } = form;

        if (!name || !email || !password || !secretCode) {
            return Alert.alert("Error", "Please fill in all fields.");
        }

        if (secretCode !== DRIVER_SECRET_CODE) {
            return Alert.alert("Access Denied", "Secret code is incorrect.");
        }

        setIsSubmitting(true);

        try {
            // In case the user was logged in before
            await logout().catch(() => null);

            // Create driver account
            await createUser({ name, email, password, role });
            Alert.alert("Success", "driver account created!");
            //REDIRECT AFTER SUCCESS
            router.replace("/sign-in");

        } catch (err: any) {
            Alert.alert("Error", err.message || "Something went wrong");
            console.error("Driver SignUp error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="gap-6 bg-amber-50 rounded-lg p-5 mt-5">

            <View className="mb-4">
                <CustomInput
                    placeholder="Enter your full name"
                    value={form.name}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
                    label="Full name"
                />
            </View>

            <View className="mb-4">
                <CustomInput
                    placeholder="Enter your email"
                    value={form.email}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                    label="Email"
                    keyboardType="email-address"
                />
            </View>

            <View className="mb-4">
                <CustomInput
                    placeholder="Enter your password"
                    value={form.password}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                    label="Password"
                    secureTextEntry
                />
            </View>

            <View className="mb-6">
                <CustomInput
                    placeholder="Secret driver code"
                    value={form.secretCode}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, secretCode: text }))}
                    label="Driver secret code"
                    secureTextEntry
                />
            </View>

            <CustomButton
                title="Sign Up as Driver"
                isLoading={isSubmitting}
                onPress={submit}
                style="bg-red-700"
            />

            <View className="flex justify-center mt-5 flex-col items-center">
                <Text className="text-gray-700">Already have an account?</Text>
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

export default SignUpDriver;
