/**
 * CustomInput Component
 *
 * A reusable text input component with consistent styling and behavior.
 * Used throughout the app for forms (login, signup, menu creation, etc.)
 *
 * Features:
 * - Label above input field
 * - Focus state indication (border color changes)
 * - Secure text entry (for passwords)
 * - Different keyboard types (email, numeric, etc.)
 * - Placeholder text
 * - Consistent styling across the app
 *
 * Benefits of a custom input component:
 * - Consistent look and feel across all forms
 * - Single place to update styling
 * - Reusable across multiple screens
 * - Built-in accessibility features
 */

import {View, Text, TextInput} from 'react-native'
import {CustomInputProps} from "@/type";
import {useState} from "react";
// Import clsx as 'cn' for conditional class name merging
import cn from "clsx";

/**
 * CustomInput Component
 *
 * A controlled input component (value and onChange are managed by parent).
 *
 * Usage Example:
 * ```typescript
 * const [email, setEmail] = useState('');
 *
 * <CustomInput
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 * />
 * ```
 *
 * @param placeholder - Text shown when input is empty
 * @param value - Current value of the input (controlled by parent)
 * @param onChangeText - Function called when text changes
 * @param label - Label text displayed above the input
 * @param secureTextEntry - If true, hides text (for passwords)
 * @param keyboardType - Type of keyboard to show (default, email-address, numeric, etc.)
 */
const CustomInput = ({
                         placeholder = 'Enter text',      // Default placeholder text
                         value,                            // Current input value (from parent state)
                         onChangeText,                     // Function to update parent state
                         label,                            // Label text above input
                         secureTextEntry = false,          // Default: show text (not password)
                         keyboardType="default"            // Default: standard keyboard
                     }: CustomInputProps) => {
    // =====================================================
    // LOCAL STATE - FOCUS TRACKING
    // =====================================================

    /**
     * Track Focus State
     *
     * Used to change border color when input is focused.
     * Provides visual feedback to user about which field they're editing.
     *
     * States:
     * - isFocused = true → Orange/primary border (active)
     * - isFocused = false → Gray border (inactive)
     */
    const [isFocused, setIsFocused] = useState(false);

    return (
        // =====================================================
        // CONTAINER
        // =====================================================
        // Full width container for label + input
        <View className="w-full">

            {/* =====================================================
                LABEL
                ===================================================== */}
            {/* Label text displayed above the input field */}
            {/* Uses 'label' className for consistent styling across app */}
            <Text className="label">{label}</Text>

            {/* =====================================================
                TEXT INPUT
                ===================================================== */}
            <TextInput
                // =====================================================
                // AUTO-CORRECT/CAPITALIZE SETTINGS
                // =====================================================

                /**
                 * autoCapitalize="none"
                 * 
                 * Prevents automatic capitalization of first letter.
                 * Important for:
                 * - Email addresses (user@example.com, not User@example.com)
                 * - Passwords (case-sensitive)
                 * - Usernames
                 * 
                 * If you want capitalization (like for names), use "words" or "sentences"
                 */
                autoCapitalize="none"

                /**
                 * autoCorrect={false}
                 * 
                 * Disables auto-correction/spell-check.
                 * Important for:
                 * - Email addresses (prevents "correcting" to real words)
                 * - Passwords
                 * - Technical terms
                 * 
                 * Can enable (true) for free-text fields like descriptions
                 */
                autoCorrect={false}

                // =====================================================
                // CONTROLLED INPUT PATTERN
                // =====================================================

                /**
                 * value={value}
                 * 
                 * Current value of the input.
                 * This makes it a "controlled component" - React controls the value.
                 * 
                 * Flow:
                 * 1. User types "a"
                 * 2. onChangeText is called with "a"
                 * 3. Parent updates state
                 * 4. Component re-renders with new value
                 * 5. Input displays "a"
                 * 
                 * Benefits:
                 * - Single source of truth (React state)
                 * - Easy to validate/format input
                 * - Can programmatically set value
                 */
                value={value}

                /**
                 * onChangeText={onChangeText}
                 * 
                 * Callback function called when text changes.
                 * Receives the new text as parameter.
                 * 
                 * Typically used with useState:
                 * const [text, setText] = useState('');
                 * <CustomInput value={text} onChangeText={setText} />
                 */
                onChangeText={onChangeText}

                // =====================================================
                // SECURITY & KEYBOARD TYPE
                // =====================================================

                /**
                 * secureTextEntry={secureTextEntry}
                 * 
                 * If true, masks the text (shows dots/asterisks).
                 * Used for password fields.
                 * 
                 * Example:
                 * User types: "password123"
                 * Display shows: "•••••••••••"
                 */
                secureTextEntry={secureTextEntry}

                /**
                 * keyboardType={keyboardType}
                 * 
                 * Determines which keyboard layout to show on mobile.
                 * 
                 * Common values:
                 * - "default": Standard keyboard
                 * - "email-address": Includes @ and .com
                 * - "numeric": Numbers only
                 * - "phone-pad": Phone number pad
                 * - "decimal-pad": Numbers with decimal point
                 * 
                 * Improves UX by showing relevant keyboard for the field type.
                 */
                keyboardType={keyboardType}

                // =====================================================
                // FOCUS EVENT HANDLERS
                // =====================================================

                /**
                 * onFocus Handler
                 * 
                 * Called when user taps on the input (gives it focus).
                 * Sets isFocused to true, which triggers border color change.
                 * 
                 * Visual feedback: Border turns orange/primary color
                 */
                onFocus={() => setIsFocused(true)}

                /**
                 * onBlur Handler
                 * 
                 * Called when user taps outside the input (loses focus).
                 * Sets isFocused to false, which resets border color.
                 * 
                 * "Blur" is the opposite of "focus" in web/mobile terminology.
                 */
                onBlur={() => setIsFocused(false)}

                // =====================================================
                // PLACEHOLDER
                // =====================================================

                /**
                 * placeholder={placeholder}
                 * 
                 * Hint text shown when input is empty.
                 * Disappears when user starts typing.
                 * 
                 * Good placeholders are:
                 * - Descriptive: "Enter your email address"
                 * - Examples: "john@example.com"
                 * - NOT used as labels (use actual label prop)
                 */
                placeholder={placeholder}

                /**
                 * placeholderTextColor="#888"
                 * 
                 * Color of the placeholder text.
                 * #888 is a medium gray (not too light, not too dark).
                 * 
                 * Should be distinguishable from actual input text
                 * but clearly indicate it's just a placeholder.
                 */
                placeholderTextColor="#888"

                // =====================================================
                // DYNAMIC STYLING
                // =====================================================

                /**
                 * className with Conditional Border Color
                 * 
                 * cn() (clsx) merges multiple class names.
                 * Ternary operator chooses border color based on focus state:
                 * 
                 * - Focused: 'border-primary' (orange/brand color)
                 * - Not focused: 'border-gray-300' (light gray)
                 * 
                 * This provides visual feedback showing which field is active.
                 * 
                 * How cn() works:
                 * cn('input', 'border-primary') → "input border-primary"
                 * cn('input', false && 'hidden') → "input" (false values ignored)
                 */
                className={cn(
                    'input',  // Base input styling (defined in global styles)
                    isFocused ? 'border-primary' : 'border-gray-300'  // Dynamic border color
                )}
            />
        </View>
    )
}

// Export the component for use throughout the app
export default CustomInput