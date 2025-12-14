// ==================== IMPORTS ====================
import { View, Text, Alert, KeyboardAvoidingView, Platform, Dimensions, Animated } from "react-native";
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState, useRef, useEffect } from "react";
import { createUser, logout } from "@/lib/appwrite";
import LottieView from "lottie-react-native";


// ==================== CUSTOMER SIGN-UP COMPONENT ====================
const SignUp = () => {
    // Form submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
//form :an object that stores form data /setForm :update the form
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer",
    });

    // Animation arrays for 5 form elements
    const animations = useRef([
        new Animated.Value(50),
        new Animated.Value(50),
        new Animated.Value(50),
        new Animated.Value(50),
        new Animated.Value(50),
    ]).current;

    const opacityValues = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    // Staggered entrance animation on mount
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

    // Handle customer account creation
    const submit = async () => {
        const { name, email, password, role } = form;

        // Validate required fields
        if (!name || !email || !password) {
            return Alert.alert("Error", "Please enter valid name, email & password.");
        }

        setIsSubmitting(true);

        try {
            // Clear any existing session
            await logout().catch(() => null);

            // Create new customer account
            await createUser({ name, email, password, role });

            Alert.alert("Success", "Customer account created!");

            // Navigate to sign-in screen
            router.replace("/sign-in");

        } catch (error: any) {
            Alert.alert("Error", error.message);
            console.error("SignUp error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Responsive sizing
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
                    marginBottom: 40,
                    marginTop: 85,
                }}
            >
                <LottieView
                    source={require("@/assets/animations/Online food order.json")}
                    autoPlay
                    loop
                    style={{
                        width: screenWidth * 0.75,
                        height: screenHeight / 3.5,
                        marginLeft: -20, // Slight offset for visual balance
                    }}
                />
            </View>

            {/* ==================== SIGN-UP FORM ==================== */}
            <View className="gap-5 bg-amber-50 rounded-lg">

                {/* Name input */}
                <Animated.View
                    style={{
                        transform: [{ translateY: animations[0] }],
                        opacity: opacityValues[0],
                    }}
                >
                    <CustomInput
                        placeholder="Enter your full name"
                        value={form.name}
                        label="Full name"
                    />
                </Animated.View>

                {/* Email input */}
                <Animated.View
                    style={{
                        transform: [{ translateY: animations[1] }],
                        opacity: opacityValues[1],
                    }}
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
                    style={{
                        transform: [{ translateY: animations[2] }],
                        opacity: opacityValues[2],
                    }}
                >
                    <CustomInput
                        placeholder="Enter your password"
                        value={form.password}
                        label="Password"
                        secureTextEntry//so taht the pass don't appear
                    />
                </Animated.View>

                {/* Submit button */}
                <Animated.View
                    style={{
                        transform: [{ translateY: animations[3] }],
                        opacity: opacityValues[3],
                    }}
                >
                    <CustomButton
                        title="Sign up as customer"
                        isLoading={isSubmitting}
                        onPress={submit}
                        style="bg-yellow-700"
                    />
                </Animated.View>

                {/* Return link */}
                <Animated.View
                    style={{
                        transform: [{ translateY: animations[4] }],
                        opacity: opacityValues[4],
                    }}
                >
                    <View className="flex justify-center flex-col items-center mt-4">
                        <Text className="text-gray-700 text-sm">
                            Already have an account?
                        </Text>
                        <Link href="../(signup-choice)/sign-up-choice">
                            <Text className="text-yellow-700 font-semibold mt-1">Return</Text>
                        </Link>
                    </View>
                </Animated.View>

            </View>
        </KeyboardAvoidingView>
    );
};

export default SignUp;