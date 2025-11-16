export const unstable_noLayout = true;

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5, MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import { router } from "expo-router";

const SignUpTypeSelector = () => {
    const types = [
        {
            name: "Customer",
            icon: <FontAwesome5 name="user" size={32} color="#fff" />,
            route: "/sign-up",
        },
        {
            name: "Restaurant Owner",
            icon: <MaterialCommunityIcons name="silverware-fork-knife" size={32} color="#fff" />,
            route: "/owner-sign-in",
        },
        {
            name: "Delivery Driver",
            icon: <Entypo name="truck" size={32} color="#fff" />,
            route: "/sign-up-driver",
        },
    ];

    return (
        <View style={styles.container}>
            {types.map((type, index) => {
                const isEven = index % 2 === 0;
                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.section,
                            { flexDirection: isEven ? "row-reverse" : "row" },
                        ]}
                        onPress={() => router.push(type.route)}
                    >
                        <View style={styles.iconContainer}>{type.icon}</View>
                        <View style={styles.textContainer}>
                            <Text style={styles.sectionText}>{type.name}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default SignUpTypeSelector;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#DF5A0C", // main background color
        justifyContent: "space-around", // evenly space the 3 sections vertically
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    section: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)", // slightly transparent overlay
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        marginVertical: 10,
    },
    iconContainer: {
        width: 60,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    sectionText: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginHorizontal: 10,
    },
});
