import { View, Text, Alert, KeyboardAvoidingView, Platform, Dimensions, Animated, Image, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { createUser, createRestaurant, logout, getCurrentUser} from "@/lib/appwrite";
import { uploadImage } from "@/lib/imageService";
import LottieView from "lottie-react-native";

const OwnerSignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        email: "",
        password: "",
        ownerName: "",
        restaurantName: "",
        description: "",
    });

    // added an extra slot for the image picker -> total 8 animation entries now
    const animations = useRef([
        new Animated.Value(50), // image picker
        new Animated.Value(50), // email
        new Animated.Value(50), // password
        new Animated.Value(50), // ownerName
        new Animated.Value(50), // restaurantName
        new Animated.Value(50), // description
        new Animated.Value(50), // submit button
        new Animated.Value(50), // return link
    ]).current;

    const opacityValues = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    useEffect(() => {
        // request gallery permission on mount
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission required", "Please allow gallery access to upload a restaurant photo.");
            }
        })();

        const animatedSequence = animations.map((anim, i) =>
            Animated.parallel([
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValues[i], {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.stagger(150, animatedSequence).start();
    }, []);

    const [restaurantImage, setRestaurantImage] = useState<string | null>(null);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.7,
            });

            if (result.canceled) {
                return;
            }

            // For modern expo-image-picker result.assets[0].uri
            setRestaurantImage(result.assets[0].uri);
        } catch (err) {
            console.error("Image pick error:", err);
            Alert.alert("Error", "Could not pick image. Try again.");
        }
    };

    const submit = async () => {
        const { email, password, ownerName, restaurantName, description } = form;

        if (!email || !password || !ownerName || !restaurantName || !description) {
            return Alert.alert("Error", "Please fill in all fields.");
        }

        if (!restaurantImage) {
            return Alert.alert("Error", "Please select a restaurant photo.");
        }

        setIsSubmitting(true);

        try {
            await logout().catch(() => null);

            // 1 - create user
            await createUser({
                email,
                password,
                name: ownerName,
                role: "restaurant_owner",
            });

            const user = await getCurrentUser();
            if (!user) throw new Error("User creation failed");

            // 2 - upload restaurant image (uses your existing uploadImage function)
            const uploadedPhotoUrl = await uploadImage(restaurantImage);

            // 3 - create restaurant with photo url
            await createRestaurant({
                ownerId: user.accountId,
                name: restaurantName,
                description,
                photo: uploadedPhotoUrl,
            });

            Alert.alert("Success", "Restaurant created!");
            router.replace("/sign-in");
        } catch (error: any) {
            console.error("OwnerSignUp error:", error);
            Alert.alert("Error", error.message || "Failed to create restaurant");
        } finally {
            setIsSubmitting(false);
        }
    };

    const screenHeight = Dimensions.get("screen").height;
    const screenWidth = Dimensions.get("screen").width;

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-amber-50"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ justifyContent: "center", paddingHorizontal: 16 }}
        >
            {/* --- TOP LOTTIE ANIMATION --- */}
            <View
                style={{
                    height: screenHeight / 3.8,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 1,
                    marginTop: 65,
                }}
            >
                <LottieView
                    source={require("@/assets/animations/Restaurant-animation.json")}
                    autoPlay
                    loop
                    style={{
                        width: screenWidth * 0.7,
                        height: screenHeight / 3.8,
                    }}
                />
            </View>

            {/* --- FORM WITH STAGGERED ANIMATION --- */}
            <View className="gap-3 bg-amber-50 rounded-lg">
                {/* --- RESTAURANT IMAGE PICKER --- */}
                <Animated.View style={{ transform: [{ translateY: animations[0] }], opacity: opacityValues[0], marginBottom: 10 }}>
                    <TouchableOpacity
                        onPress={pickImage}
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 10,
                            backgroundColor: "#f5d7a1",
                            justifyContent: "center",
                            alignItems: "center",
                            alignSelf: "center",
                            overflow: "hidden",
                        }}
                    >
                        {restaurantImage ? (
                            <Image
                                source={{ uri: restaurantImage }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={{ color: "#9a6110", fontWeight: "bold" }}>Add Photo</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ translateY: animations[1] }], opacity: opacityValues[1] }}>
                    <CustomInput
                        label="Email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                    />
                </Animated.View>

                <Animated.View style={{ transform: [{ translateY: animations[2] }], opacity: opacityValues[2] }}>
                    <CustomInput
                        label="Password"
                        placeholder="Enter password"
                        secureTextEntry
                        value={form.password}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                    />
                </Animated.View>

                <Animated.View style={{ transform: [{ translateY: animations[3] }], opacity: opacityValues[3] }}>
                    <CustomInput
                        label="Owner Name"
                        placeholder="Enter owner's full name"
                        value={form.ownerName}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, ownerName: text }))}
                    />
                </Animated.View>

                <Animated.View style={{ transform: [{ translateY: animations[4] }], opacity: opacityValues[4] }}>
                    <CustomInput
                        label="Restaurant Name"
                        placeholder="Enter your restaurant name"
                        value={form.restaurantName}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, restaurantName: text }))}
                    />
                </Animated.View>

                <Animated.View style={{ transform: [{ translateY: animations[5] }], opacity: opacityValues[5] }}>
                    <CustomInput
                        label="Description"
                        placeholder="Describe your restaurant"
                        multiline
                        value={form.description}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
                    />
                </Animated.View>

                <Animated.View style={{ transform: [{ translateY: animations[6] }], opacity: opacityValues[6] }}>
                    <CustomButton
                        title="Sign up as restaurant owner"
                        isLoading={isSubmitting}
                        onPress={submit}
                        style="bg-orange-700"
                    />
                </Animated.View>

                <Animated.View style={{ transform: [{ translateY: animations[7] }], opacity: opacityValues[7] }}>
                    <View className="items-center mt-3">
                        <Text className="text-gray-700 text-sm">Already have an account?</Text>
                        <Link href="../(signup-choice)/sign-up-choice">
                            <Text className="text-orange-700 font-semibold mt-1">Return</Text>
                        </Link>
                    </View>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default OwnerSignUp;
