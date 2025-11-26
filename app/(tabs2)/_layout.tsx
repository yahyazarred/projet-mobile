import { Tabs } from "expo-router";
import { Image, Text, View, ImageSourcePropType, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { images } from "@/constants";

const ACTIVE_COLOR = "#f97316";
const INACTIVE_COLOR = "#64748b";

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View style={styles.iconContainer}>
        {focused ? (
            <LinearGradient
                colors={['#f97316', '#ea580c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeIconWrapper}
            >
                <Image
                    source={icon}
                    style={[styles.icon, { tintColor: '#ffffff' }]}
                />
                {/* Glowing effect */}
                <View style={styles.glowEffect} />
            </LinearGradient>
        ) : (
            <View style={styles.inactiveIconWrapper}>
                <Image
                    source={icon}
                    style={[styles.icon, { tintColor: INACTIVE_COLOR }]}
                />
            </View>
        )}

        {focused && (
            <View style={styles.labelContainer}>
                <Text style={styles.activeLabel}>{title}</Text>
                {/* Indicator dot */}
                <View style={styles.indicatorDot} />
            </View>
        )}
    </View>
);

export default function OwnerTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: "absolute",
                    bottom: 25,
                    left: 20,
                    right: 20,
                    height: 70,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: 25,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    shadowColor: "#f97316",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 15,
                    flexDirection: "row",
                    justifyContent: "space-around",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                },
                tabBarBackground: () => (
                    <View style={StyleSheet.absoluteFill}>
                        {/* Glassmorphism effect */}
                        <View
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                borderRadius: 25,
                            }}
                        />
                        {/* Gradient border glow */}
                        <View
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                borderRadius: 25,
                                borderWidth: 1,
                                borderColor: 'rgba(249, 115, 22, 0.2)',
                            }}
                        />
                    </View>
                ),
            }}
        >
            {[
                { name: "menu", title: "Menu", icon: images.bag },
                { name: "orders", title: "Orders", icon: images.home },
                { name: "restaurant-profile", title: "Profile", icon: images.person },
            ].map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <View style={styles.tabContainer}>
                                <TabBarIcon title={tab.title} icon={tab.icon} focused={focused} />
                            </View>
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
    },
    iconContainer: {
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    activeIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    inactiveIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    icon: {
        width: 26,
        height: 26,
    },
    glowEffect: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#f97316',
        opacity: 0.3,
        transform: [{ scale: 1.2 }],
    },
    labelContainer: {
        alignItems: 'center',
        gap: 2,
    },
    activeLabel: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    indicatorDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#f97316',
    },
});