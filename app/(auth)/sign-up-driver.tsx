// ==================== IMPORTS ====================
import { View, Text, Alert, KeyboardAvoidingView, Platform, Dimensions, Animated } from "react-native";
import { Link, router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { createUser, logout } from "@/lib/appwrite";
import LottieView from "lottie-react-native";

// Secret code required for driver registration (access control)
const DRIVER_SECRET_CODE = "pizza4life";


// ==================== DRIVER SIGN-UP COMPONENT ====================
const SignUpDriver = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

//form :an object that stores form data /setForm :update the form
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        secretCode: "",
        role: "driver",
    });

    // Animation arrays for 6 form elements
    const animations = useRef([
        new Animated.Value(50), // name
        new Animated.Value(50), // email
        new Animated.Value(50), // password
        new Animated.Value(50), // secret code
        new Animated.Value(50), // button
        new Animated.Value(50), // link
    ]).current;

    const opacityValues = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    // Staggered entrance animation
    useEffect(() => {
        const animatedSequence = animations.map((anim, i) =>
            Animated.parallel([
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValues[i], {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.stagger(150, animatedSequence).start();
    }, []);

    // Handle driver account creation
    const submit = async () => {
        const { name, email, password, secretCode, role } = form;

        // Validate all fields are filled
        if (!name || !email || !password || !secretCode) {
            return Alert.alert("Error", "Please fill in all fields.");
        }

        // Verify secret code matches - prevents unauthorized driver registration
        if (secretCode !== DRIVER_SECRET_CODE) {
            return Alert.alert("Access Denied", "Secret code is incorrect.");
        }

        setIsSubmitting(true);

        try {
            // Clear existing session
            await logout().catch(() => null);

            // Create driver account
            await createUser({ name, email, password, role });

            Alert.alert("Success", "Driver account created!");
            router.replace("/sign-in");

        } catch (err: any) {
            Alert.alert("Error", err.message || "Something went wrong");
            console.error("Driver SignUp error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const screenHeight = Dimensions.get("screen").height;
    const screenWidth = Dimensions.get("screen").width;

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-amber-50"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ justifyContent: "center", paddingHorizontal: 16 }}
        >

            {/* ==================== HEADER ANIMATION ==================== */}
            <View
                style={{
                    height: screenHeight / 4.5,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                    marginTop: 85,
                }}
            >
                {/* Food courier/delivery animation */}
                <LottieView
                    source={require("@/assets/animations/Food Courier.json")}
                    autoPlay
                    loop
                    style={{
                        width: screenWidth * 0.75,
                        height: screenHeight / 3.5,
                    }}
                />
            </View>

            {/* ==================== SIGN-UP FORM ==================== */}
            <View className="gap-5 bg-amber-50 rounded-lg">

                {/* Name input */}
                <Animated.View
                    style={{ transform: [{ translateY: animations[0] }], opacity: opacityValues[0] }}
                >
                    <CustomInput
                        placeholder="Enter your full name"
                        value={form.name}
                        label="Full name"
                    />
                </Animated.View>

                {/* Email input */}
                <Animated.View
                    style={{ transform: [{ translateY: animations[1] }], opacity: opacityValues[1] }}
                >
                    <CustomInput
                        placeholder="Enter your email"
                        value={form.email}
                        label="Email"
                        keyboardType="email-address"
                    />
                </Animated.View>

                {/* Password input */}
                <Animated.View
                    style={{ transform: [{ translateY: animations[2] }], opacity: opacityValues[2] }}
                >
                    <CustomInput
                        placeholder="Enter your password"
                        value={form.password}
                        label="Password"
                        secureTextEntry
                    />
                </Animated.View>

                {/* Secret code input - unique to driver signup */}
                <Animated.View
                    style={{ transform: [{ translateY: animations[3] }], opacity: opacityValues[3] }}
                >
                    <CustomInput
                        placeholder="Secret driver code"
                        value={form.secretCode}
                        label="Driver secret code"
                        secureTextEntry  // Hide code input
                    />
                </Animated.View>

                {/* Submit button */}
                <Animated.View
                    style={{ transform: [{ translateY: animations[4] }], opacity: opacityValues[4] }}
                >
                    <CustomButton
                        title="Sign Up as Driver"
                        isLoading={isSubmitting}
                        onPress={submit}
                        style="bg-red-700"
                    />
                </Animated.View>

                {/* Return link */}
                <Animated.View
                    style={{ transform: [{ translateY: animations[5] }], opacity: opacityValues[5] }}
                >
                    <View className="flex justify-center flex-col items-center">
                        <Text className="text-gray-700 text-sm">Already have an account?</Text>
                        <Link href="../(signup-choice)/sign-up-choice">
                            <Text className="text-red-700 font-semibold mt-1">Return</Text>
                        </Link>
                    </View>
                </Animated.View>

            </View>
        </KeyboardAvoidingView>
    );
};

export default SignUpDriver;