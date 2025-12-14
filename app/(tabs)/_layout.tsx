// ==================== IMPORTS ====================
import { Redirect, Tabs } from "expo-router";
//redirect Automatically navigates the user to another route
import useAuthStore from "@/store/auth.store";// gets data from the auth store (login state)
import { TabBarIconProps } from "@/type";
import { Image, Text, View } from "react-native";
import { images } from "@/constants";

// ==================== CONSTANTS ====================
const ACTIVE_COLOR = "#df5a0c";    // Orange color when tab is selected
const INACTIVE_COLOR = "#999";     // Gray color when tab is not selected

// ==================== TAB BAR ICON COMPONENT ====================
// Props: focused (boolean), icon (image source), title (string)
const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Tab icon image */}
        <Image
            source={icon}
            style={{
                width: 26,
                height: 26,
                tintColor: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
                // tintColor: Changes the color of PNG images
                // Ternary operator: if focused is true, use active color, else use inactive
                marginBottom: 2,  // Small space between icon and text
            }}
        />
        {/* Tab label text */}
        <Text
            style={{
                color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
                fontSize: 9,
                fontWeight: focused ? "600" : "400",
                // fontWeight changes: bold (600) when active, normal (400) when inactive
            }}
        >
            {title}
        </Text>
    </View>
);

// ==================== TAB LAYOUT COMPONENT ====================
// Main layout component that creates the bottom tab navigation
export default function TabLayout() {
    const { isAuthenticated } = useAuthStore();// Get authentication status from global store

    const DEV_BYPASS_AUTH = true;    // Allows testing tabs without logging in for dev

    // ==================== AUTHENTICATION GUARD ====================
    // If user is not authenticated and bypass is disabled, redirect to sign-in
    if (!DEV_BYPASS_AUTH && !isAuthenticated) return <Redirect href="/sign-in" />;

    // ==================== TAB NAVIGATION SETUP ====================
    return (
        <Tabs
            // screenOptions: Configuration applied to ALL tabs in ur phone
            screenOptions={{
                headerShown: false,        // Hide the header bar at the top
                tabBarShowLabel: false,    // Hide default labels

                // Custom tab bar styling
                tabBarStyle: {
                    position: "absolute",  // Float above content (not pushed up)
                    bottom: 20,            // 20px from bottom of screen
                    left: 20,              // 20px from left edge
                    right: 20,             // 20px from right edge
                    height: 60,            // Tab bar height
                    backgroundColor: "#fff",
                    borderRadius: 30,      // Fully rounded corners (pill shape)

                    // Shadow for iOS
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 5 },  // Shadow drops down 5px
                    shadowOpacity: 0.1,    // 10% opacity
                    shadowRadius: 10,      // Blur radius

                    // Shadow for Android (elevation property)
                    elevation: 8,

                    // Layout
                    flexDirection: "row",           // Icons in horizontal row
                    justifyContent: "space-around", // Evenly spaced
                    alignItems: "center",           // Vertically centered
                    paddingHorizontal: 0,           // No extra horizontal padding
                },
            }}
        >
            {/* ==================== TAB SCREENS CONFIGURATION ==================== */}
            {/* Array of tab objects - each represents one tab */}
            {[
                { name: "index", title: "Home", icon: images.home },//name gets from the file
                { name: "search", title: "Search", icon: images.search },
                { name: "cart", title: "Cart", icon: images.bag },
                { name: "profile", title: "Profile", icon: images.person },
                { name: "map", title: "Map", icon: images.map },
            ].map((tab) => (
                // Tabs.Screen: Individual tab configuration
                <Tabs.Screen
                    key={tab.name}              // React key for list rendering
                    name={tab.name}             // Must match the filename (e.g., index.tsx)
                    options={{
                        // tabBarIcon: Function that returns the icon component
                        // Receives { focused } prop automatically from React Navigation
                        tabBarIcon: ({ focused }) => (
                            <View
                                style={{
                                    flex: 1,                // Takes equal space in tab bar
                                    alignItems: "center",   // Center horizontally
                                    justifyContent: "center", // Center vertically
                                    height: "100%",         // Full height makes entire area clickable
                                }}
                            >
                                {/* Render custom TabBarIcon component */}
                                <TabBarIcon
                                    title={tab.title}
                                    icon={tab.icon}
                                    focused={focused}  // Pass focused state down
                                />
                            </View>
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}

