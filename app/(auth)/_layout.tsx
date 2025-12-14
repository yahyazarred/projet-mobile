import {View, Text, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image} from 'react-native'
import {Redirect, Slot} from "expo-router";
//A Slot is just a space where another screen will appear.
//redirect Automatically navigates the user to another route
import useAuthStore from "@/store/auth.store";

export default function AuthLayout() {
    const { isAuthenticated } = useAuthStore();// gets data from the auth store (login state)

    if(isAuthenticated) return <Redirect href="/" />

    return (
        <View className="flex-1 bg-amber-50">
            // Use padding on iOS, height adjustment on Android
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                // Allows tapping inputs/buttons while keyboard is open
                <ScrollView className="h-full" keyboardShouldPersistTaps="handled">
                    <Slot />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}
