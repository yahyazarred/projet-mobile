import { View, Text, Alert } from "react-native";
import {Link, router} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { createUser, logout } from "@/lib/appwrite";

const SignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer", // fixed
    });

    const submit = async () => {
        const { name, email, password, role } = form;

        if (!name || !email || !password) {
            return Alert.alert("Error", "Please enter valid name, email & password.");
        }

        setIsSubmitting(true);

        try {
            await logout().catch(() => null);
            await createUser({ name, email, password, role });
            Alert.alert("Success", "customer account created!");
            router.replace("/sign-in");
        } catch (error: any) {
            Alert.alert("Error", error.message);
            console.error("SignUp error:", error);
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
                    style={{ backgroundColor: "transparent" }}
                />
            </View>

            <View className="mb-4">
                <CustomInput
                    placeholder="Enter your email"
                    value={form.email}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                    label="Email"
                    keyboardType="email-address"
                    style={{ backgroundColor: "transparent" }}
                />
            </View>

            <View className="mb-6">
                <CustomInput
                    placeholder="Enter your password"
                    value={form.password}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                    label="Password"
                    secureTextEntry
                    style={{ backgroundColor: "transparent" }}
                />
            </View>


            <CustomButton title="Sign Up" isLoading={isSubmitting} onPress={submit} style="bg-red-700"/>

            <View className="flex justify-center mt-5 flex-col items-center">
                <Text className="text-gray-700">
                    Already have an account?
                </Text>
                <Link href="../(signup-choice)/sign-up-choice" className="text-red-700 font-semibold mt-1">
                    Return
                </Link>
            </View>
        </View>
    );
};

export default SignUp;
