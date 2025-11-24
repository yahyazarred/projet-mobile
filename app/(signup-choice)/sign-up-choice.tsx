export const unstable_noLayout = true;

import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const SignUpTypeSelector = () => {
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

    const screenWidth = Dimensions.get("window").width;
    const slideAnim = useRef(types.map(() => new Animated.Value(-screenWidth))).current;

    useEffect(() => {
        const animations = types.map((_, index) =>
            Animated.timing(slideAnim[index], {
                toValue: 0,
                duration: 600, // slower so it's noticeable
                useNativeDriver: true,
                delay: index * 100, // slight stagger
            })
        );

        Animated.stagger(100, animations).start();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-amber-50">
            <View className="flex-1 px-5 py-20">
                {/* Header */}
                <View className="items-center mt-16 mb-10">
                    <View className="bg-red-700 w-20 h-20 rounded-full items-center justify-center mb-4">
                        <Ionicons name="restaurant" size={40} color="white" />
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 mb-2">
                        Join Us
                    </Text>
                    <Text className="text-base text-gray-600 text-center">
                        Choose how you want to get started
                    </Text>
                </View>

                {/* Options */}
                <View className="flex-1 justify-center gap-4">
                    {types.map((type, index) => (
                        <Animated.View
                            key={index}
                            style={{ transform: [{ translateX: slideAnim[index] }] }}
                        >
                            <TouchableOpacity
                                className={`${type.gradient} rounded-3xl p-6 shadow-lg`}
                                onPress={() => router.push(type.route)}
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
                                        <Ionicons name={type.icon} size={32} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white text-xl font-bold mb-1">
                                            {type.name}
                                        </Text>
                                        <Text className="text-white/80 text-sm">
                                            {type.description}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="white" />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Footer */}
                <View className="items-center mt-5">
                    <Text className="text-gray-600 text-sm">
                        Already have an account?
                    </Text>
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
