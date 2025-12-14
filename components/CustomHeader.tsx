// Import the router hook from Expo Router for navigation between screens
import { useRouter } from "expo-router";
// Import React Native components for building the header UI
import { Image, Text, TouchableOpacity, View } from "react-native";

// Import TypeScript type definition for header props to ensure type safety
import { CustomHeaderProps } from "@/type";
// Import image assets (back arrow and search icon)
import {images} from "@/constants";

/**
 * CustomHeader Component
 *
 * A reusable header component displayed at the top of screens.
 * Layout: [Back Button] [Title] [Search Icon]
 *
 * Features:
 * - Back button on the left that navigates to previous screen
 * - Optional centered title text
 * - Search icon on the right (currently non-functional, just visual)
 *
 * @param title - Optional text to display in the center of the header
 */
const CustomHeader = ({ title }: CustomHeaderProps) => {
    // useRouter hook provides navigation functions
    // router.back() navigates to the previous screen in the navigation stack
    const router = useRouter();

    return (
        // Main container for the header with custom styling
        // Typically uses flexbox to arrange items horizontally (left, center, right)
        <View className="custom-header">
            {/* LEFT SECTION: Back button */}
            {/* TouchableOpacity makes the back arrow clickable */}
            <TouchableOpacity onPress={() => router.back()}>
                {/* Back arrow icon */}
                {/* size-5 makes it a small, consistent size (20px in Tailwind) */}
                {/* resizeMode="contain" ensures the icon fits without distortion */}
                <Image
                    source={images.arrowBack}
                    className="size-5"
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {/* CENTER SECTION: Optional title text */}
            {/* The && operator is a conditional render shorthand */}
            {/* If title exists (is not null/undefined/empty), render the Text component */}
            {/* If title doesn't exist, nothing is rendered in the center */}
            {title && <Text className="base-semibold text-dark-100">{title}</Text>}

            {/* RIGHT SECTION: Search icon */}
            {/* Currently just a visual element (no onPress handler) */}
            {/* Could be made functional by wrapping in TouchableOpacity and adding onPress */}
            <Image source={images.search} className="size-5" resizeMode="contain" />
        </View>
    );
};

// Export the component so it can be used on multiple screens
export default CustomHeader;