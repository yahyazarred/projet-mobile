import {View, Text, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image} from 'react-native'
import {Redirect, Slot} from "expo-router";
import {images} from "@/constants";
import useAuthStore from "@/store/auth.store";
import LottieView from 'lottie-react-native';

export default function AuthLayout() {
    const { isAuthenticated } = useAuthStore();

    if(isAuthenticated) return <Redirect href="/" />

    return (
        <View className="flex-1 bg-amber-50">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView className="h-full" keyboardShouldPersistTaps="handled">



                    <Slot />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}
