// Import necessary components from React Native and Expo
import { Tabs } from "expo-router"; // Expo Router's tab navigation component
import { Image, Text, View, ImageSourcePropType, StyleSheet } from "react-native"; // Core React Native components
import { LinearGradient } from 'expo-linear-gradient'; // For gradient effects on active tab
import { BlurView } from 'expo-blur'; // For glassmorphism/blur effects (imported but not used in current code)
import { images } from "@/constants"; // Import image assets from constants folder

// Define color constants for consistent styling throughout the component
const ACTIVE_COLOR = "#f97316"; // Orange color for active/selected tab
const INACTIVE_COLOR = "#64748b"; // Gray color for inactive/unselected tabs

// TypeScript interface to define the props (properties) for TabBarIcon component
interface TabBarIconProps {
    focused: boolean; // Whether the tab is currently selected
    icon: ImageSourcePropType; // The icon image source
    title: string; // The text label for the tab
}

// Custom component to render each tab's icon with styling based on active/inactive state
const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View style={styles.iconContainer}>
        {/* Conditional rendering: if tab is focused (active), show gradient version */}
        {focused ? (
            // Active tab styling with gradient background
            <LinearGradient
                colors={['#f97316', '#ea580c']} // Orange gradient colors (lighter to darker)
                start={{ x: 0, y: 0 }} // Gradient starts from top-left
                end={{ x: 1, y: 1 }} // Gradient ends at bottom-right (diagonal)
                style={styles.activeIconWrapper} // Styling for active icon container
            >
                {/* The actual icon image with white tint */}
                <Image
                    source={icon}
                    style={[styles.icon, { tintColor: '#ffffff' }]} // White color for active icon
                />
                {/* Glowing effect layer behind the icon for emphasis */}
                <View style={styles.glowEffect} />
            </LinearGradient>
        ) : (
            // Inactive tab styling with simple background
            <View style={styles.inactiveIconWrapper}>
                {/* The icon image with gray tint */}
                <Image
                    source={icon}
                    style={[styles.icon, { tintColor: INACTIVE_COLOR }]} // Gray color for inactive icon
                />
            </View>
        )}

        {/* Only show the label text and indicator dot when tab is active */}
        {focused && (
            <View style={styles.labelContainer}>
                {/* Tab title text (e.g., "Menu", "Orders", "Profile") */}
                <Text style={styles.activeLabel}>{title}</Text>
                {/* Small orange dot indicator below the text */}
                <View style={styles.indicatorDot} />
            </View>
        )}
    </View>
);

// Main component that creates the tab navigation layout for the owner/restaurant side
export default function OwnerTabLayout() {
    return (
        <Tabs
            // Global configuration options for all tabs
            screenOptions={{
                headerShown: false, // Hide the header at the top of each screen
                tabBarShowLabel: false, // Hide default labels (we use custom icons instead)

                // Styling for the tab bar container
                tabBarStyle: {
                    position: "absolute", // Position tab bar absolutely (floating)
                    bottom: 25, // 25 pixels from bottom of screen
                    left: 20, // 20 pixels from left edge
                    right: 20, // 20 pixels from right edge (centers the tab bar)
                    height: 70, // Fixed height of tab bar
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Dark blue with 95% opacity
                    borderRadius: 25, // Rounded corners (pill shape)
                    borderWidth: 1, // Thin border
                    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle white border (10% opacity)

                    // Shadow effects for iOS
                    shadowColor: "#f97316", // Orange shadow color
                    shadowOffset: { width: 0, height: 10 }, // Shadow below the tab bar
                    shadowOpacity: 0.3, // Shadow transparency
                    shadowRadius: 20, // How blurred the shadow is

                    elevation: 15, // Shadow for Android (higher = more prominent)

                    // Layout properties
                    flexDirection: "row", // Arrange tabs horizontally
                    justifyContent: "space-around", // Evenly space tabs
                    alignItems: "center", // Center tabs vertically
                    paddingHorizontal: 10, // Horizontal padding inside tab bar
                    paddingVertical: 8, // Vertical padding inside tab bar
                },

                // Custom background component for the tab bar (glassmorphism effect)
                tabBarBackground: () => (
                    <View style={StyleSheet.absoluteFill}>
                        {/* Main background layer with dark blue color */}
                        <View
                            style={{
                                ...StyleSheet.absoluteFillObject, // Fill entire parent
                                backgroundColor: 'rgba(15, 23, 42, 0.95)', // Same dark blue as tabBarStyle
                                borderRadius: 25, // Match tab bar border radius
                            }}
                        />
                        {/* Gradient border glow effect on top */}
                        <View
                            style={{
                                ...StyleSheet.absoluteFillObject, // Fill entire parent
                                borderRadius: 25, // Match tab bar border radius
                                borderWidth: 1, // Thin border
                                borderColor: 'rgba(249, 115, 22, 0.2)', // Orange border with 20% opacity
                            }}
                        />
                    </View>
                ),
            }}
        >
            {/* Define the three tabs using an array and map function */}
            {[
                { name: "menu", title: "Menu", icon: images.bag }, // First tab: Menu with bag icon
                { name: "orders", title: "Orders", icon: images.home }, // Second tab: Orders with home icon
                { name: "restaurant-profile", title: "Profile", icon: images.person }, // Third tab: Profile with person icon
            ].map((tab) => (
                // Create a Tab Screen for each item in the array
                <Tabs.Screen
                    key={tab.name} // Unique key for React's rendering (required in lists)
                    name={tab.name} // Route name that matches the file/folder structure
                    options={{
                        // Custom icon component for this tab
                        tabBarIcon: ({ focused }) => (
                            <View style={styles.tabContainer}>
                                {/* Render our custom TabBarIcon with the tab's properties */}
                                <TabBarIcon title={tab.title} icon={tab.icon} focused={focused} />
                            </View>
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}

// StyleSheet object containing all the styling for the component
const styles = StyleSheet.create({
    // Container for each individual tab
    tabContainer: {
        flex: 1, // Take up available space
        alignItems: "center", // Center horizontally
        justifyContent: "center", // Center vertically
        height: "100%", // Full height of tab bar
    },

    // Container for the icon and label
    iconContainer: {
        alignItems: "center", // Center horizontally
        justifyContent: "center", // Center vertically
        gap: 6, // 6 pixels space between icon and label
    },

    // Styling for the active (selected) tab icon wrapper
    activeIconWrapper: {
        width: 52, // Fixed width
        height: 52, // Fixed height (square)
        borderRadius: 16, // Rounded corners
        alignItems: "center", // Center icon horizontally
        justifyContent: "center", // Center icon vertically

        // Shadow effects for iOS
        shadowColor: "#f97316", // Orange shadow
        shadowOffset: { width: 0, height: 4 }, // Shadow below
        shadowOpacity: 0.5, // 50% opacity
        shadowRadius: 12, // Blur radius
        elevation: 8, // Shadow for Android
    },

    // Styling for inactive (unselected) tab icon wrapper
    inactiveIconWrapper: {
        width: 52, // Same size as active
        height: 52,
        borderRadius: 16, // Same rounded corners
        alignItems: "center", // Center icon
        justifyContent: "center",
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Very subtle white background (5% opacity)
    },

    // Styling for the icon image itself
    icon: {
        width: 26, // Icon width
        height: 26, // Icon height
        // tintColor is applied inline in the component
    },

    // Glowing effect layer for active tabs
    glowEffect: {
        position: 'absolute', // Position absolutely (behind icon)
        width: 52, // Same size as wrapper
        height: 52,
        borderRadius: 16, // Match wrapper
        backgroundColor: '#f97316', // Orange color
        opacity: 0.3, // 30% opacity for subtle glow
        transform: [{ scale: 1.2 }], // Make it 20% larger for glow effect
    },

    // Container for the label text and indicator dot
    labelContainer: {
        alignItems: 'center', // Center horizontally
        gap: 2, // 2 pixels space between text and dot
    },

    // Styling for the active tab label text
    activeLabel: {
        color: '#ffffff', // White text
        fontSize: 11, // Small font size
        fontWeight: '700', // Bold text
        letterSpacing: 0.5, // Slight spacing between letters
    },

    // Small dot indicator below active tab label
    indicatorDot: {
        width: 4, // Small width
        height: 4, // Small height (square)
        borderRadius: 2, // Make it circular (half of width/height)
        backgroundColor: '#f97316', // Orange color matching theme
    },
});