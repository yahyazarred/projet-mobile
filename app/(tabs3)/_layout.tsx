// Driver Tab Navigation Layout
// This creates the bottom tab navigation bar for delivery drivers
// Allows drivers to switch between Deliveries, History, and Profile screens

// Import necessary components from Expo Router and React Native
import { Tabs } from "expo-router"; // Expo Router's tab navigation component
import { Image, Text, View, ImageSourcePropType } from "react-native"; // Core React Native components
import { images } from "@/constants"; // Import image assets from constants folder

// ===== COLOR CONSTANTS =====
// Define colors for consistent styling across the tab bar
const ACTIVE_COLOR = "#3B82F6";   // Blue color for selected/active tab (driver theme)
const INACTIVE_COLOR = "#999";     // Gray color for unselected/inactive tabs

// ===== TYPESCRIPT INTERFACE =====
// Define the structure for TabBarIcon component props (properties)
interface TabBarIconProps {
    focused: boolean;              // Boolean indicating if this tab is currently active/selected
    icon: ImageSourcePropType;     // The image source for the tab icon
    title: string;                 // The text label to display below the icon
}

// ===== CUSTOM TAB ICON COMPONENT =====
// Reusable component that renders each individual tab's icon and label
// Takes in focused state, icon image, and title text as props
const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    // Container for icon and label, centered vertically and horizontally
    <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Tab Icon Image */}
        <Image
            source={icon} // The icon image to display
            style={{
                width: 26,    // Fixed width of icon
                height: 26,   // Fixed height of icon (square icon)
                // tintColor changes the icon color based on active/inactive state
                tintColor: focused ? ACTIVE_COLOR : INACTIVE_COLOR, // Blue if active, gray if inactive
                marginBottom: 2, // Small space between icon and text label
            }}
        />
        {/* Tab Label Text */}
        <Text
            style={{
                // Text color matches icon color (blue if active, gray if inactive)
                color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
                fontSize: 9,  // Small font size for compact design
                // Bold text when active, regular weight when inactive
                fontWeight: focused ? "600" : "400",
            }}
        >
            {title}
        </Text>
    </View>
);

// ===== MAIN DRIVER TAB LAYOUT COMPONENT =====
// Creates the entire tab navigation structure for the driver side of the app
export default function DriverTabLayout() {
    return (
        <Tabs
            // Global configuration options that apply to all tabs
            screenOptions={{
                headerShown: false,      // Hide the header at the top of each screen
                tabBarShowLabel: false,  // Hide default labels (we're using custom TabBarIcon instead)

                // ===== TAB BAR STYLING =====
                // Defines the appearance and layout of the tab bar container
                tabBarStyle: {
                    position: "absolute",     // Position the tab bar absolutely (floating above content)
                    bottom: 20,               // 20 pixels from the bottom of the screen
                    left: 20,                 // 20 pixels from the left edge
                    right: 20,                // 20 pixels from the right edge (centers the tab bar)
                    height: 60,               // Fixed height of the tab bar
                    backgroundColor: "#fff",  // White background color
                    borderRadius: 30,         // Rounded corners (pill-shaped)

                    // Shadow effects for iOS
                    shadowColor: "#000",      // Black shadow
                    shadowOffset: { width: 0, height: 5 }, // Shadow positioned below the tab bar
                    shadowOpacity: 0.1,       // 10% opacity (subtle shadow)
                    shadowRadius: 10,         // How blurred the shadow is

                    elevation: 8,             // Shadow for Android (higher = more prominent)

                    // Layout properties
                    flexDirection: "row",     // Arrange tabs horizontally
                    justifyContent: "space-around", // Evenly space tabs across the bar
                    alignItems: "center",     // Center tabs vertically
                    paddingHorizontal: 0,     // No horizontal padding (tabs use full width)
                },
            }}
        >
            {/* ===== DEFINE TABS USING ARRAY AND MAP ===== */}
            {/* Create an array of tab configurations and map over them to generate Tab.Screen components */}
            {[
                // Tab 1: Deliveries screen - shows active/available deliveries
                {
                    name: "deliveries",        // Route name (must match file/folder name in app directory)
                    title: "Deliveries",       // Display name shown to user
                    icon: images.home          // Icon image (using home icon as placeholder)
                },
                // Tab 2: History screen - shows past completed deliveries
                {
                    name: "history",
                    title: "History",
                    icon: images.bag           // Icon image (using bag icon)
                },
                // Tab 3: Driver Profile screen - shows driver's account info
                {
                    name: "driver-profile",    // Route name with hyphen (matches file naming convention)
                    title: "Profile",
                    icon: images.person        // Icon image (person icon)
                },
            ].map((tab) => (
                // Create a Tab.Screen component for each item in the array
                <Tabs.Screen
                    key={tab.name}             // Unique key for React's rendering optimization (required in lists)
                    name={tab.name}            // Route name that matches the file/folder structure in app directory
                    options={{
                        // Custom icon component for this specific tab
                        // The tabBarIcon function receives a 'focused' prop indicating if tab is active
                        tabBarIcon: ({ focused }) => (
                            // Container view for the tab icon
                            // Takes up available space and centers the icon
                            <View
                                style={{
                                    flex: 1,              // Take up equal space with other tabs
                                    alignItems: "center", // Center icon horizontally
                                    justifyContent: "center", // Center icon vertically
                                    height: "100%",       // Full height of tab bar
                                }}
                            >
                                {/* Render our custom TabBarIcon component */}
                                {/* Pass the tab's title, icon, and focused state as props */}
                                <TabBarIcon
                                    title={tab.title}     // Tab label text
                                    icon={tab.icon}       // Tab icon image
                                    focused={focused}     // Whether this tab is currently selected
                                />
                            </View>
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}