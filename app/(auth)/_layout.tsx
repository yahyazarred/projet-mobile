import {View, Text, KeyboardAvoidingView, Platform, ScrollView, Dimensions, ImageBackground, Image} from 'react-native'
import {Redirect, Slot} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {images} from "@/constants";
import useAuthStore from "@/store/auth.store";

export default function AuthLayout() {
    const { isAuthenticated } = useAuthStore();

    if(isAuthenticated) return <Redirect href="/" />

    return (
        <SafeAreaView
            className="flex-1 bg-amber-50"
            edges={['left', 'right', 'bottom']}
        >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView className="h-full" keyboardShouldPersistTaps="handled">
                    <View
                        className="w-full relative"
                        style={{ height: Dimensions.get('screen').height / 2.25 }}
                    >
                        <ImageBackground
                            source={images.loginGraphic}
                            className="size-full rounded-b-lg"
                            resizeMode="stretch"
                        />
                        <Image
                            source={images.logo}
                            className="self-center size-60 absolute -bottom-20 z-10"
                        />
                    </View>
                    <Slot />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
