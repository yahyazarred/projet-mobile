// ==================== IMPORTS ====================
import {
    View, Text, Alert, KeyboardAvoidingView, Platform,
    ScrollView, Dimensions, Image, Animated
} from "react-native";
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState, useRef, useEffect } from "react";
//useState :Stores and updates data inside a component/useRef:Keeps a value without re-rendering/useEffect:Runs code after maj
import { signIn, logout, getCurrentUser } from "@/lib/appwrite";
import LottieView from "lottie-react-native";
import { images } from "@/constants";


// ==================== SIGN-IN COMPONENT ====================
const SignIn = () => {
    // State for form submission loading
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for email and password inputs
    const [form, setForm] = useState({ email: "", password: "" });

    // Animation values for vertical position (translateY)
    const animations = useRef([
        new Animated.Value(50), // email - starts 50px below
        new Animated.Value(50), // password
        new Animated.Value(50), // button
        new Animated.Value(50), // sign up link
    ]).current;

    // Animation values for opacity (fade in)
    const opacityValues = useRef([
        new Animated.Value(0), // starts invisible
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    // Run entrance animations on component mount
    useEffect(() => {
        // Create parallel animations (slide + fade) for each element
        const animatedSequence = animations.map((anim, i) =>
            Animated.parallel([
                Animated.timing(anim, {
                    toValue: 0,                // slide to original position
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValues[i], {
                    toValue: 1,                // fade to fully visible
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );

        // Stagger animations every 150 bel wa7da bel wa7da
        Animated.stagger(150, animatedSequence).start();
    }, []);

    // Handle form submission
    const submit = async () => {//Create a function and run it now.
        const { email, password } = form;

        // Validate inputs
        if (!email || !password) {
            return Alert.alert("Error", "Please enter valid email address & password.");
        }

        setIsSubmitting(true);
        try {
            // Clear any existing session
            await logout().catch(() => null);

            // Sign in user
            await signIn({ email, password });

            // Get user data to determine role
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            // Role-based navigation
            // Restaurant owners → tabs2 (restaurant management interface)
            if (user.role === "restaurant_owner") {
                router.replace("/(tabs2)/restaurant-profile");
            }
            // Drivers → tabs3 (delivery interface)
            else if (user.role === "driver") {
                router.replace("/(tabs3)/driver-profile");
            }
            // Regular customers → tabs (customer interface)
            else {
                router.replace("/(tabs)/profile");
            }

        } catch (error: any) {
            Alert.alert("Error", error.message);
            console.error("SignIn error:", error?.message || String(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-amber-50">
            {/* Keyboard handling wrapper */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView className="h-full" keyboardShouldPersistTaps="handled">

                    {/* ==================== HEADER ANIMATION ==================== */}
                    <View
                        className="w-full relative"
                        style={{ height: Dimensions.get("screen").height / 2.25 }}
                    >
                        {/* Food animation (plays once) */}
                        <LottieView
                            source={require("@/assets/animations/Food & Beverage.json")}
                            autoPlay
                            loop={false}  // plays only once
                            style={{ width: "100%", height: "100%" }}
                        />
                        {/* Logo positioned at bottom center */}
                        <Image
                            source={images.logo}
                            className="self-center size-60 absolute -bottom-20 z-10"
                        />
                    </View>

                    {/* ==================== SIGN-IN FORM ==================== */}
                    <View className="gap-5 bg-amber-50 rounded-lg p-5 mt-5">

                        {/* Email input with animation */}
                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[0] }],
                                opacity: opacityValues[0],
                            }}
                        >
                            <CustomInput
                                placeholder="Enter your email"
                                value={form.email}
                                label="Email"
                                keyboardType="email-address"  // shows email keyboard
                                className="bg-transparent"
                            />
                        </Animated.View>

                        {/* Password input with animation */}
                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[1] }],
                                opacity: opacityValues[1],
                            }}
                        >
                            <CustomInput
                                placeholder="Enter your password"
                                value={form.password}
                                label="Password"
                                secureTextEntry  // hides password characters
                                className="bg-transparent"
                            />
                        </Animated.View>

                        {/* Login button with animation */}
                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[2] }],
                                opacity: opacityValues[2],
                            }}
                        >
                            <CustomButton
                                title="Login"
                                isLoading={isSubmitting}  // shows spinner when submitting
                                onPress={submit}
                                style="bg-red-700"
                            />
                        </Animated.View>

                        {/* Sign up link with animation */}
                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[3] }],
                                opacity: opacityValues[3],
                            }}
                        >
                            <View className="flex justify-center flex-col items-center">
                                <Text className="text-gray-700">Don't have an account?</Text>
                                <Link href="/(signup-choice)/sign-up-choice">
                                    <Text className="text-red-700 font-semibold mt-1">Sign Up</Text>
                                </Link>
                            </View>
                        </Animated.View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default SignIn;