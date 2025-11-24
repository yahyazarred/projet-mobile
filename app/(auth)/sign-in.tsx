import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image, Animated } from "react-native";
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState, useRef, useEffect } from "react";
import { signIn, logout, getCurrentUser } from "@/lib/appwrite";
import LottieView from "lottie-react-native";
import { images } from "@/constants";

const SignIn = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });

    // Animated values for staggered form animation
    const animations = useRef([
        new Animated.Value(50), // email input
        new Animated.Value(50), // password input
        new Animated.Value(50), // sign in button
        new Animated.Value(50), // sign up link
    ]).current;

    const opacityValues = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    useEffect(() => {
        // Animate elements with stagger
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

            if (user.role === "restaurant_owner") router.replace("../(tabs2)/restaurant-profile");
            else if (user.role === "driver") router.replace("../(tabs3)/driver-profile");
            else router.replace("/");

        } catch (error: any) {
            Alert.alert("Error", error.message);
            console.error("SignIn error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-amber-50">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView className="h-full" keyboardShouldPersistTaps="handled">

                    {/* --- TOP LOTTIE ANIMATION SECTION --- */}
                    <View
                        className="w-full relative"
                        style={{ height: Dimensions.get("screen").height / 2.25 }}
                    >
                        <LottieView
                            source={require("@/assets/animations/Food & Beverage.json")}
                            autoPlay
                            loop={false}
                            style={{ width: "100%", height: "100%" }}
                        />
                        <Image
                            source={images.logo}
                            className="self-center size-60 absolute -bottom-20 z-10"
                        />
                    </View>

                    {/* --- SIGN-IN FORM WITH STAGGERED ANIMATION --- */}
                    <View className="gap-5 bg-amber-50 rounded-lg p-5 mt-5">

                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[0] }],
                                opacity: opacityValues[0],
                            }}
                        >
                            <CustomInput
                                placeholder="Enter your email"
                                value={form.email}
                                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                                label="Email"
                                keyboardType="email-address"
                                className="bg-transparent"
                            />
                        </Animated.View>

                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[1] }],
                                opacity: opacityValues[1],
                            }}
                        >
                            <CustomInput
                                placeholder="Enter your password"
                                value={form.password}
                                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                                label="Password"
                                secureTextEntry
                                className="bg-transparent"
                            />
                        </Animated.View>

                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[2] }],
                                opacity: opacityValues[2],
                            }}
                        >
                            <CustomButton
                                title="Login"
                                isLoading={isSubmitting}
                                onPress={submit}
                                style="bg-red-700"
                            />
                        </Animated.View>

                        <Animated.View
                            style={{
                                transform: [{ translateY: animations[3] }],
                                opacity: opacityValues[3],
                            }}
                        >
                            <View className="flex justify-center flex-col items-center">
                                <Text className="text-gray-700">Don't have an account?</Text>
                                <Link href="../(signup-choice)/sign-up-choice">
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
