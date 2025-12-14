// Import React Native components for building the button UI
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native'
// Import React library
import React from 'react'
// Import TypeScript type definition for the button props to ensure type safety
import {CustomButtonProps} from "@/type";
// Import clsx library as 'cn' for conditional CSS class merging
// This allows combining multiple Tailwind classes dynamically
import cn from "clsx";

/**
 * CustomButton Component
 *
 * A reusable button component with customizable styling and loading state.
 * Features:
 * - Customizable text and styling
 * - Optional left icon
 * - Loading spinner that replaces text when isLoading is true
 * - Fully customizable appearance through style props
 *
 * @param onPress - Function to execute when button is pressed
 * @param title - Text displayed on the button (default: "Click Me")
 * @param style - Additional CSS classes for button container styling
 * @param textStyle - Additional CSS classes for button text styling
 * @param leftIcon - Optional icon component displayed on the left side of button
 * @param isLoading - Boolean to show loading spinner instead of text (default: false)
 */
const CustomButton = ({
                          onPress,              // Function that runs when button is clicked
                          title="Click Me",     // Button text with default value
                          style,                // Custom styles for the button container
                          textStyle,            // Custom styles for the button text
                          leftIcon,             // Optional icon to show before the text
                          isLoading = false     // Loading state with default value of false
                      }: CustomButtonProps) => {
    return (
        // TouchableOpacity makes the button pressable and provides visual feedback
        // cn() merges the base 'custom-btn' class with any custom styles passed in
        <TouchableOpacity className={cn('custom-btn', style)} onPress={onPress}>
            {/* Display the left icon if provided */}
            {/* The icon is rendered directly without any wrapper */}
            {leftIcon}

            {/* Container for button content (text or loading spinner) */}
            {/* flex-center centers content vertically and horizontally */}
            {/* flex-row arranges content horizontally */}
            <View className="flex-center flex-row">
                {/* Conditional rendering based on loading state */}
                {isLoading ? (
                    // LOADING STATE: Show a white spinning indicator
                    // size="small" makes it compact and suitable for button size
                    <ActivityIndicator size="small" color="white" />
                ): (
                    // NORMAL STATE: Show the button text
                    // cn() merges base text styles with any custom textStyle passed in
                    // text-white-100: White text color
                    // paragraph-semibold: Semi-bold font weight
                    <Text className={cn('text-white-100 paragraph-semibold', textStyle)}>
                        {title}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    )
}

// Export the component so it can be used throughout the app
export default CustomButton