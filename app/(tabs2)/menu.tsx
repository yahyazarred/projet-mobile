// app/(tabs2)/menu.tsx
// This screen allows restaurant owners to manage their menu items (add, edit, delete)

// Import React hooks for managing component state and lifecycle
import { useState } from "react";

// Import React Native UI components
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator, Image } from "react-native";

// SafeAreaView ensures content doesn't overlap with device notches/status bars
import { SafeAreaView } from "react-native-safe-area-context";

// Ionicons provides vector icons (like add, edit, delete icons)
import { Ionicons } from "@expo/vector-icons";

// LinearGradient creates smooth color transitions for beautiful backgrounds
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks and services for data management
import { useMenuItems } from "@/lib/useMenuItems"; // Hook to fetch and manage menu items
import { pickImage, uploadImage } from "@/lib/imageService"; // Functions to handle image picking and uploading
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/menuService"; // API calls for CRUD operations
import { MenuItem, MenuFormData } from "@/lib/menuTypes"; // TypeScript types for type safety

// Custom components for reusable UI elements
import { MenuItemCard } from "@/components/MenuItemCard"; // (Not currently used in this code)
import { MenuFormModal } from "@/components/MenuFormModal"; // Modal dialog for adding/editing menu items

// Main component function - this is the entire menu management screen
export default function MenuItemsManagement() {
    // Destructure data and functions from the custom hook
    // This hook handles fetching menu items and categories from the backend
    const {
        menuItems,              // Array of all menu items for this restaurant
        categories,             // Array of available categories (e.g., "Appetizers", "Main Course")
        loading,                // Boolean indicating if data is being loaded
        currentRestaurantId,    // ID of the current restaurant
        setLoading,             // Function to manually set loading state
        loadData,               // Function to refresh/reload menu data from backend
    } = useMenuItems();

    // State to control the add/edit modal visibility
    const [modalVisible, setModalVisible] = useState(false);

    // State to track if we're editing an existing item (true) or adding new (false)
    const [editMode, setEditMode] = useState(false);

    // State to store the menu item being edited (null when adding new item)
    const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);

    // State to store the form input data
    // This holds all the fields the user fills in the form
    const [formData, setFormData] = useState<MenuFormData>({
        name: "",           // Dish name (e.g., "Grilled Salmon")
        description: "",    // Dish description
        price: "",          // Price as string (will be converted to number later)
        category: "",       // Category ID
        calories: "",       // Calorie count (optional)
        protein: "",        // Protein grams (optional)
        imageUri: "",       // URI of the selected image
    });

    // Function to open the image picker and let user select a photo
    const handlePickImage = async () => {
        const uri = await pickImage(); // Opens device gallery/camera
        if (uri) {
            // Update formData with the new image URI
            setFormData((prev) => ({ ...prev, imageUri: uri }));
        }
    };

    // Generic function to update any field in the form
    // field: which field to update (name, price, etc.)
    // value: the new value for that field
    const handleFormChange = (field: keyof MenuFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Function to save the menu item (either create new or update existing)
    const handleSave = async () => {
        // Validation: Check if required fields are filled
        if (!formData.name || !formData.description || !formData.price) {
            return Alert.alert("Error", "Please fill in name, description, and price");
        }

        // Validation: Make sure a category is selected
        if (!formData.category) {
            return Alert.alert("Error", "Please select a category. Create a category first if none exist.");
        }

        // Validation: Make sure an image is selected
        if (!formData.imageUri) {
            return Alert.alert("Error", "Please select an image for the menu item");
        }

        try {
            // Show loading indicator while saving
            setLoading(true);

            // Initialize imageUrl with existing image (for edit mode) or empty string
            let imageUrl = currentItem?.image_url || "";

            // Check if user selected a new image (different from existing one)
            if (formData.imageUri && formData.imageUri !== currentItem?.image_url) {
                console.log("Uploading new image...");
                // Upload the new image to cloud storage and get back the URL
                imageUrl = await uploadImage(formData.imageUri);
                console.log("Image uploaded successfully:", imageUrl);
            }

            // Prepare the data object to send to the backend
            const data = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),           // Convert string to number
                categories: formData.category,                // Category ID
                restaurantId: currentRestaurantId,            // Link to current restaurant
                image_url: imageUrl,                          // Uploaded image URL
                calories: formData.calories ? parseInt(formData.calories) : 0,  // Convert to number or default to 0
                protein: formData.protein ? parseInt(formData.protein) : 0,     // Convert to number or default to 0
                rating: currentItem?.rating || 3,             // Keep existing rating or default to 3
            };

            console.log("Saving menu item:", data);

            // Check if we're editing or creating
            if (editMode && currentItem) {
                // Update existing menu item
                await updateMenuItem(currentItem.$id, data);
            } else {
                // Create new menu item
                await createMenuItem(data);
            }

            // Close the modal after successful save
            closeModal();

            // Reload all menu data to show the updated list
            await loadData();
        } catch (err) {
            // If something goes wrong, show error message
            console.error("Save error:", err);
            Alert.alert("Error", `Failed to save: ${(err as Error).message}`);
        } finally {
            // Always hide loading indicator when done (success or error)
            setLoading(false);
        }
    };

    // Function to delete a menu item
    const handleDelete = async (itemId: string, imageUrl: string) => {
        try {
            setLoading(true);
            // Delete from backend (also deletes the image from storage)
            await deleteMenuItem(itemId, imageUrl);
            // Reload the menu to reflect the deletion
            await loadData();
        } catch (err) {
            // Only show error if it's not a cancellation (user pressed "Cancel" in confirm dialog)
            if ((err as Error).message !== "Cancelled") {
                console.error("Delete error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    // Callback function called when user creates a new category
    // This ensures the category dropdown is updated immediately
    const handleCategoryCreated = async () => {
        console.log("Category created, reloading categories...");
        await loadData(); // Reloads both menu items and categories
    };

    // Function to open the modal for adding a NEW menu item
    const openAddModal = () => {
        // First check if any categories exist
        if (categories.length === 0) {
            // Show alert asking user to create a category first
            return Alert.alert(
                "No Categories",
                "Please create at least one category before adding menu items. Would you like to go to the categories page?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "OK", onPress: () => console.log("Navigate to categories") }
                ]
            );
        }

        // Set to add mode (not edit mode)
        setEditMode(false);
        setCurrentItem(null);

        // Reset form with empty values
        setFormData({
            name: "",
            description: "",
            price: "",
            category: categories[0]?.$id || "",  // Pre-select first category
            calories: "",
            protein: "",
            imageUri: "",
        });

        // Show the modal
        setModalVisible(true);
    };

    // Function to open the modal for EDITING an existing menu item
    const openEditModal = (item: MenuItem) => {
        setEditMode(true);           // Set to edit mode
        setCurrentItem(item);        // Store the item being edited

        // Pre-fill the form with existing item data
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price.toString(),              // Convert number to string for TextInput
            category: item.categories,
            calories: item.calories?.toString() || "", // Use optional chaining in case it's null
            protein: item.protein?.toString() || "",
            imageUri: item.image_url,                  // Existing image URL
        });

        // Show the modal
        setModalVisible(true);
    };

    // Function to close the modal and reset all related state
    const closeModal = () => {
        setModalVisible(false);
        setEditMode(false);
        setCurrentItem(null);
    };

    // Helper function to get category details by ID
    // Used to display category name on menu item cards
    const getCategoryInfo = (categoryId: string) => {
        return categories.find(cat => cat.$id === categoryId);
    };

    // Show loading screen while initial data is being fetched
    // Only show this if we have no menu items yet
    if (loading && menuItems.length === 0) {
        return (
            <View className="flex-1 bg-slate-950">
                {/* Gradient background for visual appeal */}
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#334155']} // Dark blue gradient
                    className="flex-1 justify-center items-center"
                >
                    {/* Container with subtle background for the spinner */}
                    <View className="bg-white/10 rounded-full p-8 mb-4">
                        <ActivityIndicator size="large" color="#f97316" />
                    </View>
                    <Text className="text-white text-lg font-semibold">Preparing your menu...</Text>
                    <Text className="text-slate-400 text-sm mt-2">Just a moment</Text>
                </LinearGradient>
            </View>
        );
    }

    // Main screen render
    return (
        <View className="flex-1 bg-slate-950">
            {/* Background gradient covering entire screen */}
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#1e293b']} // Dark blue/purple gradient
                className="flex-1"
            >
                {/* Safe area ensures content doesn't overlap with status bar */}
                <SafeAreaView className="flex-1">
                    {/* FlatList efficiently renders a scrollable list of menu items */}
                    <FlatList
                        data={menuItems}                    // Array of items to render
                        keyExtractor={(item) => item.$id}   // Unique key for each item (required by React)
                        contentContainerStyle={{ paddingBottom: 100 }} // Extra space at bottom for tab bar
                        numColumns={2}                      // Display items in 2 columns (grid layout)
                        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }} // Spacing for grid

                        // Header component shown at the top of the list
                        ListHeaderComponent={
                            <View className="px-6 pt-6 pb-8">
                                {/* Hero Header Section */}
                                <View className="mb-8">
                                    {/* Decorative accent line and label */}
                                    <View className="flex-row items-center mb-3">
                                        <View className="w-1 h-8 bg-orange-500 rounded-full mr-3" />
                                        <Text className="text-orange-500 text-xs font-bold tracking-widest uppercase">
                                            Culinary Excellence
                                        </Text>
                                    </View>

                                    {/* Main title split into two lines for design effect */}
                                    <Text className="text-white text-4xl font-bold leading-tight mb-2">
                                        Menu
                                    </Text>
                                    <Text className="text-white text-4xl font-bold leading-tight mb-3">
                                        Collection
                                    </Text>

                                    {/* Subtitle/description */}
                                    <Text className="text-slate-400 text-base leading-relaxed">
                                        Craft your signature dishes and delight your guests
                                    </Text>
                                </View>

                                {/* Stats Bar - Shows quick statistics */}
                                <View className="flex-row bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                                    {/* Number of dishes */}
                                    <View className="flex-1 items-center">
                                        <Text className="text-white text-2xl font-bold">
                                            {menuItems.length}
                                        </Text>
                                        <Text className="text-slate-400 text-xs mt-1">Dishes</Text>
                                    </View>

                                    {/* Vertical divider */}
                                    <View className="w-px bg-white/10" />

                                    {/* Number of categories */}
                                    <View className="flex-1 items-center">
                                        <Text className="text-white text-2xl font-bold">
                                            {categories.length}
                                        </Text>
                                        <Text className="text-slate-400 text-xs mt-1">Categories</Text>
                                    </View>

                                    {/* Vertical divider */}
                                    <View className="w-px bg-white/10" />

                                    {/* Average rating (hardcoded for now) */}
                                    <View className="flex-1 items-center">
                                        <View className="flex-row items-center">
                                            <Ionicons name="star" size={16} color="#f97316" />
                                            <Text className="text-white text-2xl font-bold ml-1">4.8</Text>
                                        </View>
                                        <Text className="text-slate-400 text-xs mt-1">Avg Rating</Text>
                                    </View>
                                </View>

                                {/* Action Header - Title and Add Button */}
                                <View className="flex-row justify-between items-center mb-4">
                                    {/* Left side: Section title */}
                                    <View>
                                        <Text className="text-white text-xl font-bold">Your Creations</Text>
                                        <Text className="text-slate-400 text-sm mt-1">
                                            {/* Dynamic text based on number of items */}
                                            {menuItems.length > 0
                                                ? `${menuItems.length} signature ${menuItems.length === 1 ? 'dish' : 'dishes'}`
                                                : 'Start building your menu'
                                            }
                                        </Text>
                                    </View>

                                    {/* Right side: Floating Add Button */}
                                    <Pressable
                                        onPress={openAddModal}
                                        className="active:scale-95" // Shrink slightly when pressed for feedback
                                    >
                                        {/* Gradient button with shadow */}
                                        <LinearGradient
                                            colors={['#f97316', '#ea580c']} // Orange gradient
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            className="w-16 h-16 rounded-2xl items-center justify-center shadow-lg"
                                            style={{
                                                shadowColor: '#f97316',
                                                shadowOffset: { width: 0, height: 8 },
                                                shadowOpacity: 0.5,
                                                shadowRadius: 16,
                                            }}
                                        >
                                            <Ionicons name="add" size={32} color="white" />
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            </View>
                        }

                        // Component shown when menuItems array is empty
                        ListEmptyComponent={
                            <View className="items-center justify-center px-6 py-20">
                                {/* Large icon in a circle */}
                                <View className="bg-white/5 rounded-full p-8 mb-6 border border-white/10">
                                    <Ionicons name="restaurant-outline" size={64} color="#64748b" />
                                </View>

                                {/* Empty state title */}
                                <Text className="text-white text-2xl font-bold mb-2">
                                    Your Canvas Awaits
                                </Text>

                                {/* Empty state description */}
                                <Text className="text-slate-400 text-center text-base mb-6 leading-relaxed px-8">
                                    Begin your culinary journey by adding your first signature dish
                                </Text>

                                {/* Call-to-action button */}
                                <Pressable
                                    onPress={openAddModal}
                                    className="active:scale-95"
                                >
                                    <LinearGradient
                                        colors={['#f97316', '#ea580c']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="px-8 py-4 rounded-xl flex-row items-center"
                                    >
                                        <Ionicons name="add-circle-outline" size={24} color="white" />
                                        <Text className="text-white font-bold ml-2 text-base">
                                            Create First Dish
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        }

                        // Function that renders each individual menu item card
                        renderItem={({ item }) => {
                            // Get the category details for this item
                            const category = getCategoryInfo(item.categories);

                            return (
                                <View className="flex-1 mb-4">
                                    {/* Recipe Card Design - designed to look like a physical recipe card */}
                                    <Pressable
                                        onPress={() => openEditModal(item)} // Tap anywhere to edit
                                        className="bg-amber-50 rounded-3xl overflow-hidden"
                                        style={{
                                            // Shadow for depth effect
                                            shadowColor: '#f97316',
                                            shadowOffset: { width: 0, height: 8 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 16,
                                            elevation: 8, // Android shadow
                                        }}
                                    >
                                        {/* Food Image Container */}
                                        <View className="relative">
                                            {/* Main dish image */}
                                            <Image
                                                source={{ uri: item.image_url }}
                                                className="w-full h-36 bg-gray-200"
                                                resizeMode="cover" // Fill the space while maintaining aspect ratio
                                            />

                                            {/* Decorative Top Corner - orange triangle */}
                                            <View className="absolute top-0 right-0 w-16 h-16">
                                                <View className="absolute top-0 right-0 w-0 h-0 border-t-[60px] border-r-[60px] border-t-orange-500/90 border-r-transparent" />
                                            </View>

                                            {/* Rating Badge - top left corner */}
                                            <View className="absolute top-2 left-2 bg-white/95 px-2 py-1 rounded-full flex-row items-center">
                                                <Ionicons name="star" size={12} color="#f97316" />
                                                <Text className="text-xs font-bold text-gray-900 ml-1">
                                                    {item.rating || 4.5}
                                                </Text>
                                            </View>

                                            {/* Price Tag - top right corner with tilt effect */}
                                            <View className="absolute top-2 right-2">
                                                <View className="bg-red-500 px-3 py-1.5 rounded-lg rotate-6">
                                                    <Text className="text-white text-xs font-black">
                                                        ${item.price}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Recipe Card Content Section */}
                                        <View className="p-4">
                                            {/* Category Tag */}
                                            {category && (
                                                <View className="bg-orange-100 self-start px-2 py-1 rounded-md mb-2">
                                                    <Text className="text-orange-700 text-xs font-bold uppercase">
                                                        {category.name}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Dish Name */}
                                            <Text className="text-gray-900 text-base font-bold mb-1" numberOfLines={2}>
                                                {item.name}
                                            </Text>

                                            {/* Description - limited to 2 lines */}
                                            <Text className="text-gray-600 text-xs leading-relaxed mb-3" numberOfLines={2}>
                                                {item.description}
                                            </Text>

                                            {/* Divider Line - dashed for recipe card aesthetic */}
                                            <View className="border-t border-dashed border-gray-300 mb-3" />

                                            {/* Nutrition Info Row */}
                                            <View className="flex-row justify-between mb-3">
                                                {/* Calories */}
                                                <View className="flex-row items-center">
                                                    <Ionicons name="flame" size={14} color="#f97316" />
                                                    <Text className="text-gray-700 text-xs font-semibold ml-1">
                                                        {item.calories || 0} cal
                                                    </Text>
                                                </View>
                                                {/* Protein */}
                                                <View className="flex-row items-center">
                                                    <Ionicons name="fitness" size={14} color="#10b981" />
                                                    <Text className="text-gray-700 text-xs font-semibold ml-1">
                                                        {item.protein || 0}g protein
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Action Buttons */}
                                            <View className="flex-row gap-2">
                                                {/* Edit Button */}
                                                <Pressable
                                                    onPress={() => openEditModal(item)}
                                                    className="flex-1 bg-orange-500 py-2 rounded-xl flex-row items-center justify-center"
                                                >
                                                    <Ionicons name="create-outline" size={16} color="white" />
                                                    <Text className="text-white text-xs font-bold ml-1">
                                                        Edit
                                                    </Text>
                                                </Pressable>

                                                {/* Delete Button */}
                                                <Pressable
                                                    onPress={() => {
                                                        // Show confirmation dialog before deleting
                                                        Alert.alert(
                                                            "Delete Item",
                                                            `Delete "${item.name}"?`,
                                                            [
                                                                { text: "Cancel", style: "cancel" },
                                                                {
                                                                    text: "Delete",
                                                                    style: "destructive",
                                                                    onPress: () => handleDelete(item.$id, item.image_url),
                                                                },
                                                            ]
                                                        );
                                                    }}
                                                    className="bg-red-100 py-2 px-3 rounded-xl items-center justify-center"
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                                                </Pressable>
                                            </View>
                                        </View>

                                        {/* Decorative Bottom Scalloped Edge - creates wavy pattern */}
                                        <View className="h-4 bg-amber-50 flex-row">
                                            {/* Create 8 semicircles for scalloped effect */}
                                            {[...Array(8)].map((_, i) => (
                                                <View
                                                    key={i}
                                                    className="flex-1 bg-slate-950 rounded-t-full"
                                                    style={{ marginHorizontal: 1 }}
                                                />
                                            ))}
                                        </View>
                                    </Pressable>
                                </View>
                            );
                        }}
                    />
                </SafeAreaView>
            </LinearGradient>

            {/* Modal Dialog for adding/editing menu items */}
            {/* This is rendered outside the FlatList so it can overlay the entire screen */}
            <MenuFormModal
                visible={modalVisible}                          // Controls if modal is shown
                editMode={editMode}                             // Tells modal if we're editing or creating
                formData={formData}                             // Current form values
                categories={categories}                         // List of categories for dropdown
                loading={loading}                               // Shows loading spinner in modal
                currentRestaurantId={currentRestaurantId}       // Current restaurant ID
                onClose={closeModal}                            // Function to close modal
                onSave={handleSave}                             // Function to save the item
                onPickImage={handlePickImage}                   // Function to pick an image
                onFormChange={handleFormChange}                 // Function to update form fields
                onCategoryCreated={handleCategoryCreated}       // Function called when new category is created
            />
        </View>
    );
}