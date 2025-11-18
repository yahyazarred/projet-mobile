import { View, Text, Alert, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { createUser, logout } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";

const SignUpDriver = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { fetchAuthenticatedUser } = useAuthStore();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        vehicleType: "",
        licensePlate: "",
        role: "driver", // Set role to driver
    });

    const submit = async () => {
        const { name, email, password, phone, vehicleType, licensePlate, role } = form;

        if (!name || !email || !password) {
            return Alert.alert("Error", "Please enter valid name, email & password.");
        }

        if (!phone || !vehicleType || !licensePlate) {
            return Alert.alert("Error", "Please fill in all driver information.");
        }

        setIsSubmitting(true);

        try {
            // Silently logout any existing session (ignore errors if no session exists)
            try {
                await logout();
            } catch (logoutError) {
                // Ignore logout errors - user might not be logged in
                console.log("No active session to logout");
            }

            // Create user with driver role
            const newUser = await createUser({
                name,
                email,
                password,
                role,
                phone,
                vehicleType,
                licensePlate
            });

            console.log("Driver account created:", newUser);

            // Fetch the authenticated user to update the store
            await fetchAuthenticatedUser();

            // Small delay to ensure state is updated, then redirect
            setTimeout(() => {
                router.replace("/(tab3)/deliveries");
            }, 500);

        } catch (error: any) {
            const errorMessage = error.message || "An error occurred during registration";
            Alert.alert("Error", errorMessage);
            console.error("SignUp Driver error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="gap-6 bg-amber-50 rounded-lg p-5 mt-5">
                <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                    Driver Registration
                </Text>
                <Text className="text-gray-600 text-center mb-4">
                    Join our delivery team
                </Text>

                {/* Personal Information */}
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
                        placeholder="Enter your phone number"
                        value={form.phone}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
                        label="Phone Number"
                        keyboardType="phone-pad"
                    />
                </View>

                <View className="mb-6">
                    <CustomInput
                        placeholder="Enter your password"
                        value={form.password}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                        label="Password"
                        secureTextEntry
                    />
                </View>

                {/* Vehicle Information */}
                <View className="border-t border-gray-300 pt-4 mb-4">
                    <Text className="text-lg font-semibold text-gray-800 mb-3">
                        Vehicle Information
                    </Text>

                    <View className="mb-4">
                        <CustomInput
                            placeholder="e.g., Motorcycle, Car, Scooter"
                            value={form.vehicleType}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, vehicleType: text }))}
                            label="Vehicle Type"
                        />
                    </View>

                    <View className="mb-4">
                        <CustomInput
                            placeholder="Enter license plate number"
                            value={form.licensePlate}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, licensePlate: text.toUpperCase() }))}
                            label="License Plate"
                        />
                    </View>
                </View>

                <CustomButton
                    title="Register as Driver"
                    isLoading={isSubmitting}
                    onPress={submit}
                    style="bg-red-700"
                />

                <View className="flex justify-center mt-5 flex-col items-center">
                    <Text className="text-gray-700">
                        Already have an account?
                    </Text>
                    <Link href="../(signup-choice)/sign-up-choice" className="text-red-700 font-semibold mt-1">
                        Return
                    </Link>
                </View>
            </View>
        </ScrollView>
    );
};

export default SignUpDriver;