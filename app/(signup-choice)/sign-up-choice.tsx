

// ==================== IMPORTS ====================
import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";  // Handles notch/status bar


// ==================== SIGN-UP TYPE SELECTOR COMPONENT ====================
//  users choose their account type (Customer, Owner, or Driver)
const SignUpTypeSelector = () => {

    // ==================== USER TYPE CONFIGURATION ====================

    const types = [
        {
            name: "Customer",
            description: "Order delicious food",
            icon: "person" as const,
            gradient: "bg-amber-500",
            route: "/sign-up" as const,
        },
        {
            name: "Restaurant Owner",
            description: "Manage your restaurant",
            icon: "restaurant" as const,
            gradient: "bg-orange-600",
            route: "/owner-sign-in" as const,
        },
        {
            name: "Delivery Driver",
            description: "Deliver orders & earn",
            icon: "bicycle" as const,
            gradient: "bg-red-700",
            route: "/sign-up-driver" as const,
        },
    ];

    // ==================== ANIMATION SETUP ====================
    const screenWidth = Dimensions.get("window").width;

    // Create array of Animated.Value objects - one per card
    // useRef prevents recreation on every render
    // .current extracts the actual array
    const slideAnim = useRef(types.map(() => new Animated.Value(-screenWidth))).current;

    // ==================== ENTRANCE ANIMATION ====================
    // useEffect runs once when component mounts
    useEffect(() => {
        // Create animation configuration for each card
        const animations = types.map((_, index) =>
            Animated.timing(slideAnim[index], {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,  //optimisation
                delay: index * 100,
            })
        );

        // Animated.stagger: Runs animations in sequence with 100ms between each start
        Animated.stagger(100, animations).start();
    }, []);

    // ==================== UI ====================
    return (
        // SafeAreaView: Automatically adds padding for iPhone notch, status bar, home indicator
        <SafeAreaView className="flex-1 bg-amber-50">
            <View className="flex-1 px-5 py-20">

                {/* ==================== HEADER SECTION ==================== */}
                <View className="items-center mt-16 mb-10">
                    {/* Circular icon container */}
                    <View className="bg-red-700 w-20 h-20 rounded-full items-center justify-center mb-4">
                        <Ionicons name="restaurant" size={40} color="white" />
                    </View>

                    {/* Main title */}
                    <Text className="text-3xl font-bold text-gray-900 mb-2">
                        Join Us
                    </Text>

                    {/* Subtitle/description */}
                    <Text className="text-base text-gray-600 text-center">
                        Choose how you want to get started
                    </Text>
                </View>

                {/* ==================== USER TYPE CARDS ==================== */}
                <View className="flex-1 justify-center gap-4">
                    {types.map((type, index) => (
                        // Animated.View: Wrapper that applies slide animation
                        <Animated.View
                            key={index}  // React key for list rendering
                            style={{ transform: [{ translateX: slideAnim[index] }] }}
                            // translateX: Horizontal position (starts at -screenWidth, animates to 0)
                        >
                            {/* TouchableOpacity: Pressable card with opacity feedback */}
                            <TouchableOpacity
                                onPress={() => router.push(type.route)}
                                // When pressed, navigate to the route defined in the types array
                                activeOpacity={0.8}
                            >
                                {/* Card content: horizontal layout */}
                                <View className="flex-row items-center">

                                    {/* Left: Icon container with semi-transparent white background */}
                                    <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
                                        {/* bg-white/20: white with 20% opacity */}
                                        <Ionicons name={type.icon} size={32} color="white" />
                                    </View>

                                    {/* Center: Text content (takes remaining space with flex-1) */}
                                    <View className="flex-1">
                                        {/* User type name (bold) */}
                                        <Text className="text-white text-xl font-bold mb-1">
                                            {type.name}
                                        </Text>
                                        {/* Description (slightly transparent) */}
                                        <Text className="text-white/80 text-sm">
                                            {type.description}
                                        </Text>
                                    </View>

                                    {/* Right: Chevron arrow (indicates clickability) */}
                                    <Ionicons name="chevron-forward" size={24} color="white" />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* ==================== FOOTER SECTION ==================== */}
                <View className="items-center mt-5">
                    {/* Text for existing users */}
                    <Text className="text-gray-600 text-sm">
                        Already have an account?
                    </Text>

                    {/* Login link button */}
                    <TouchableOpacity
                        onPress={() => router.push("/sign-in")}
                        className="mt-2"
                    >
                        <Text className="text-red-700 font-semibold text-base">
                            Login
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default SignUpTypeSelector;

