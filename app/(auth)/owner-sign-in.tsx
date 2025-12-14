// ==================== IMPORTS SECTION ====================
import {
    View,
    Text,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Animated,
    Image,
    TouchableOpacity   // Touchable button component
} from "react-native";

// Expo Router for navigation between screens
import { Link, router } from "expo-router";

// React hooks for state management and side effects
import { useState, useRef, useEffect } from "react";
//useState :Stores and updates data inside a component/useRef:Keeps a value without re-rendering/useEffect:Runs code after maj

// Library for picking images from the device gallery
import * as ImagePicker from "expo-image-picker";

// Custom reusable components we created
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";

// Backend functions from Appwrite
import {
    createUser,
    createRestaurant,
    logout,
    getCurrentUser
} from "@/lib/appwrite";

// Image upload service function
import { uploadImage } from "@/lib/imageService";

// Lottie library for playing JSON-based animations
import LottieView from "lottie-react-native";

// ==================== MAIN COMPONENT ====================
const OwnerSignUp = () => {

    // ==================== STATE MANAGEMENT ====================
    // State to track if the form is currently being submitted
    const [isSubmitting, setIsSubmitting] = useState(false);//useState is used to remember a value and change it.

    const [form, setForm] = useState({//form :an object that stores form data /setForm :update the form


        email: "",
        password: "",
        ownerName: "",
        restaurantName: "",
        description: "",
    });


    // ==================== ANIMATION SETUP ====================
    const animations = useRef([
        new Animated.Value(50), // [0] - Image picker animation
        new Animated.Value(50), // [1] - Email field animation
        new Animated.Value(50), // [2] - Password field animation
        new Animated.Value(50), // [3] - Owner name field animation
        new Animated.Value(50), // [4] - Restaurant name field animation
        new Animated.Value(50), // [5] - Description field animation
        new Animated.Value(50), // [6] - Submit button animation
        new Animated.Value(50), // [7] - Return link animation
    ]).current; // .current extracts the actual array from the ref

    // opacityValues: Controls the transparency of each element
    // Each starts at 0 (invisible) and will animate to 1 (fully visible)
    const opacityValues = useRef([
        new Animated.Value(0), // [0] - Image picker opacity
        new Animated.Value(0), // [1] - Email field opacity
        new Animated.Value(0), // [2] - Password field opacity
        new Animated.Value(0), // [3] - Owner name field opacity
        new Animated.Value(0), // [4] - Restaurant name field opacity
        new Animated.Value(0), // [5] - Description field opacity
        new Animated.Value(0), // [6] - Submit button opacity
        new Animated.Value(0), // [7] - Return link opacity
    ]).current;

    // ==================== useEffect ====================
    // useEffect runs after the component mounts (appears on screen)
    // The empty [] dependency array means this only runs ONCE when component loads
    useEffect(() => {
        (async () => {//Create a function and run it now.
            // Ask the OS for gallery access permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            //await:wait for the user’s answer /status: permission result /

            // If permission not granted, show an alert to the user
            if (status !== "granted") {
                Alert.alert(
                    "Permission required",
                    "Please allow gallery access to upload a restaurant photo."
                );
            }
        })();

        // Create staggered entrance animation for all form elements
        // .map() transforms each animation value into a parallel animation object
        const animatedSequence = animations.map((anim, i) =>
            // Animated.parallel runs multiple animations at the same time
            Animated.parallel([
                // First animation: Move element from 50px down to 0 (slide up)
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,         // Use native code for better performance
                }),
                // Second animation: Fade element from invisible to visible
                Animated.timing(opacityValues[i], {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,         // Performance optimization
                }),
            ])
        );

        // Animated.stagger delays each animation by 150ms

        Animated.stagger(150, animatedSequence).start();
    }, []);


    // ==================== IMAGE PICKER STATE ====================
    // State to store the selected restaurant image URI (file path)
    // string = the image path, null = no image selected yet
    const [restaurantImage, setRestaurantImage] = useState<string | null>(null);


    // ==================== IMAGE PICKER FUNCTION ====================
    // Async function to open the device gallery and let user pick an image
    const pickImage = async () => {//create a fct and run it now
        try {
            // Launch the image picker UI
            const result = await ImagePicker.launchImageLibraryAsync({//wait for the user answ
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only show images (no videos)
                allowsEditing: true,   // Let user crop/edit the image before selecting
                quality: 0.7,          // Compress image to 70% quality (saves storage/bandwidth)
            });

            // If user pressed "Cancel" in the picker, do nothing
            if (result.canceled) {
                return;
            }

            // result.assets is an array; we take the first selected image
            // result.assets[0].uri is the file path to the image on the device
            setRestaurantImage(result.assets[0].uri);
        } catch (err) {
            // If anything goes wrong, log the error to console
            console.error("Image pick error:", err);
            // Show user-friendly error message
            Alert.alert("Error", "Could not pick image. Try again.");
        }
    };

    // ==================== FORM SUBMISSION FUNCTION ====================
    // Async function that runs when user presses the "Sign up" button
    const submit = async () => {
        // Destructure (extract) all form values for easier access
        const { email, password, ownerName, restaurantName, description } = form;

        // ===== VALIDATION =====
        // Check if any required field is empty
        // The || (OR operator) means if ANY field is empty, show error
        if (!email || !password || !ownerName || !restaurantName || !description) {
            return Alert.alert("Error", "Please fill in all fields.");
        }

        // Check if user selected a restaurant photo
        if (!restaurantImage) {
            return Alert.alert("Error", "Please select a restaurant photo.");
        }

        // Set loading state to true (shows spinner, disables button)
        setIsSubmitting(true);

        try {
            // ===== STEP 0: LOGOUT ANY EXISTING USER =====
            // .catch(() => null) means if logout fails, ignore the error
            // This ensures we start fresh (no leftover sessions)
            await logout().catch(() => null);

            // ===== STEP 1: CREATE USER ACCOUNT =====
            await createUser({
                email,
                password,
                name: ownerName,
                role: "restaurant_owner",
            });

            // ===== STEP 2: GET THE CREATED USER =====
            // Retrieve the user object we just created
            const user = await getCurrentUser();

            // If user creation somehow failed, throw an error
            if (!user) throw new Error("User creation failed");

            // ===== STEP 3: UPLOAD RESTAURANT IMAGE =====
            // Upload the selected image to cloud storage
            // Returns a public URL where the image can be accessed
            const uploadedPhotoUrl = await uploadImage(restaurantImage);

            // ===== STEP 4: CREATE RESTAURANT IN DATABASE =====
            // Create a restaurant document linked to this user
            await createRestaurant({
                ownerId: user.accountId,
                name: restaurantName,
                description,
                photo: uploadedPhotoUrl,
            });

            // ===== SUCCESS =====
            // Show success message to user
            Alert.alert("Success", "Restaurant created!");

            // Navigate to sign-in screen
            // .replace() removes this screen from navigation stack
            // (user can't go back to sign-up after successful registration)
            router.replace("/sign-in");

        } catch (error: any) {
            // ===== ERROR HANDLING =====
            // Log detailed error to console for debugging
            console.error("OwnerSignUp error:", error);

            // Show user-friendly error message
            // error.message provides specific error details
            Alert.alert("Error", error.message || "Failed to create restaurant");

        } finally {
            // ===== CLEANUP =====
            // Always runs whether success or error
            // Reset loading state so button is clickable again
            setIsSubmitting(false);
        }
    };


    // ==================== SCREEN DIMENSIONS ====================
    // Get the device's screen dimensions for responsive sizing
    const screenHeight = Dimensions.get("screen").height; // Total height in pixels
    const screenWidth = Dimensions.get("screen").width;   // Total width in pixels


    // ==================== RENDER (UI) ====================
    return (
        // KeyboardAvoidingView automatically adjusts layout when keyboard appears
        // Prevents keyboard from covering input fields
        <KeyboardAvoidingView
            className="flex-1 bg-amber-50"  // Tailwind: full height, light amber background
            behavior={Platform.OS === "ios" ? "padding" : "height"}  // iOS uses padding, Android uses height
            style={{ justifyContent: "center", paddingHorizontal: 16 }}  // Center content, 16px side padding
        >

            {/* ==================== TOP LOTTIE ANIMATION ==================== */}
            <View
                style={{
                    height: screenHeight / 3.8,        // Takes up ~26% of screen height
                    justifyContent: "center",          // Center vertically
                    alignItems: "center",              // Center horizontally
                    marginBottom: 1,                   // 1px space below
                    marginTop: 65,                     // 65px space above (account for status bar)
                }}
            >
                {/* LottieView plays animated JSON files */}
                <LottieView
                    source={require("@/assets/animations/Restaurant-animation.json")} // Path to animation file
                    autoPlay     // Start playing automatically
                    loop         // Repeat forever
                    style={{
                        width: screenWidth * 0.7,      // 70% of screen width
                        height: screenHeight / 3.8,    // Match container height
                    }}
                />
            </View>


            {/* ==================== FORM SECTION ==================== */}
            <View className="gap-3 bg-amber-50 rounded-lg">  {/* gap-3 = 12px space between children */}

                {/* --- RESTAURANT IMAGE PICKER --- */}
                {/* Animated.View applies the slide-up and fade-in animation */}
                <Animated.View style={{
                    transform: [{ translateY: animations[0] }],  // Vertical position animation
                    opacity: opacityValues[0],                    // Opacity animation
                    marginBottom: 10                              // 10px space below
                }}>
                    {/* TouchableOpacity = pressable component with opacity feedback */}
                    <TouchableOpacity
                        onPress={pickImage}  // Calls pickImage function when pressed
                        style={{
                            width: 120,                     // 120px wide
                            height: 120,                    // 120px tall (square)
                            borderRadius: 10,               // 10px rounded corners
                            backgroundColor: "#f5d7a1",     // Light tan color
                            justifyContent: "center",       // Center content vertically
                            alignItems: "center",           // Center content horizontally
                            alignSelf: "center",            // Center this box itself on screen
                            overflow: "hidden",             // Clip image to rounded corners
                        }}
                    >
                        {/* Conditional rendering: show image if selected, else show "Add Photo" text */}
                        {restaurantImage ? (
                            // If image is selected, display it
                            <Image
                                source={{ uri: restaurantImage }}  // Image file path
                                style={{ width: "100%", height: "100%" }}  // Fill the container
                                resizeMode="cover"  // Crop to fill, maintaining aspect ratio
                            />
                        ) : (
                            // If no image, show placeholder text
                            <Text style={{ color: "#9a6110", fontWeight: "bold" }}>
                                Add Photo
                            </Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>


                {/* --- EMAIL INPUT --- */}
                <Animated.View style={{
                    transform: [{ translateY: animations[1] }],  // Apply position animation
                    opacity: opacityValues[1]                     // Apply opacity animation
                }}>
                    <CustomInput
                        label="Email"                            // Label text above input
                        placeholder="Enter your email"           // Hint text inside input
                        value={form.email}                       // Current value from state

                    />
                </Animated.View>


                {/* --- PASSWORD INPUT --- */}
                <Animated.View style={{
                    transform: [{ translateY: animations[2] }],
                    opacity: opacityValues[2]
                }}>
                    <CustomInput
                        label="Password"
                        placeholder="Enter password"
                        secureTextEntry  // Hides password characters (shows dots)
                        value={form.password}

                    />
                </Animated.View>


                {/* --- OWNER NAME INPUT --- */}
                <Animated.View style={{
                    transform: [{ translateY: animations[3] }],
                    opacity: opacityValues[3]
                }}>
                    <CustomInput
                        label="Owner Name"
                        placeholder="Enter owner's full name"
                        value={form.ownerName}

                    />
                </Animated.View>


                {/* --- RESTAURANT NAME INPUT --- */}
                <Animated.View style={{
                    transform: [{ translateY: animations[4] }],
                    opacity: opacityValues[4]
                }}>
                    <CustomInput
                        label="Restaurant Name"
                        placeholder="Enter your restaurant name"
                        value={form.restaurantName}

                    />
                </Animated.View>


                {/* --- DESCRIPTION INPUT --- */}
                <Animated.View style={{
                    transform: [{ translateY: animations[5] }],
                    opacity: opacityValues[5]
                }}>
                    <CustomInput
                        label="Description"
                        placeholder="Describe your restaurant"
                        multiline  // Allows multiple lines of text (textarea)
                        value={form.description}

                    />
                </Animated.View>


                {/* --- SUBMIT BUTTON --- */}
                <Animated.View style={{
                    transform: [{ translateY: animations[6] }],
                    opacity: opacityValues[6]
                }}>
                    <CustomButton
                        title="Sign up as restaurant owner"  // Button text
                        isLoading={isSubmitting}              // Shows spinner when true
                        onPress={submit}                      // Calls submit function when pressed
                        style="bg-orange-700"                 // Tailwind: orange background
                    />
                </Animated.View>


                {/* --- RETURN LINK --- */}
                <Animated.View style={{
                    transform: [{ translateY: animations[7] }],
                    opacity: opacityValues[7]
                }}>
                    <View className="items-center mt-3">  {/* Center horizontally, 12px margin top */}
                        <Text className="text-gray-700 text-sm">
                            Already have an account?
                        </Text>
                        {/* Link component for navigation */}
                        <Link href="../(signup-choice)/sign-up-choice">
                            <Text className="text-orange-700 font-semibold mt-1">
                                Return
                            </Text>
                        </Link>
                    </View>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
};

// Export the component so it can be used in other files
export default OwnerSignUp;