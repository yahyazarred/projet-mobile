// components/MenuFormModal.tsx

/**
 * MenuFormModal Component
 *
 * Complex modal for creating/editing menu items with nested category creation.
 * Used by restaurant owners to manage their menu.
 */

import { useState } from "react";
import {
    View,
    Text,
    Modal,
    TextInput,
    Pressable,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Category, MenuFormData } from "@/lib/menuTypes";

// Props interface defines all required data and callbacks
interface MenuFormModalProps {
    visible: boolean;           // Controls modal visibility
    editMode: boolean;          // true = editing, false = creating
    formData: MenuFormData;     // Current form values
    categories: Category[];     // Available categories
    loading: boolean;           // Save operation in progress
    currentRestaurantId: string;
    onClose: () => void;
    onSave: () => void;
    onPickImage: () => void;
    onFormChange: (field: keyof MenuFormData, value: string) => void;
    onCategoryCreated: () => void;  // Callback to refresh categories
}

export const MenuFormModal = ({
                                  visible,
                                  editMode,
                                  formData,
                                  categories,
                                  loading,
                                  currentRestaurantId,
                                  onClose,
                                  onSave,
                                  onPickImage,
                                  onFormChange,
                                  onCategoryCreated,
                              }: MenuFormModalProps) => {
    // =====================================================
    // LOCAL STATE - CATEGORY CREATION
    // =====================================================

    // Controls nested category creation modal
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDescription, setNewCategoryDescription] = useState("");
    const [creatingCategory, setCreatingCategory] = useState(false);

    /**
     * Create New Category
     *
     * Dynamic import used to avoid circular dependencies.
     * Called from nested modal when user creates a new category.
     */
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            return Alert.alert("Error", "Please enter a category name");
        }

        try {
            setCreatingCategory(true);
            // Dynamic import - only loads when needed
            const { createCategory } = await import("@/lib/appwrite");

            await createCategory({
                name: newCategoryName.trim(),
                description: newCategoryDescription.trim(),
                restaurantId: currentRestaurantId,
            });

            // Reset form and close modal
            setNewCategoryName("");
            setNewCategoryDescription("");
            setShowCategoryModal(false);

            // Notify parent to refresh category list
            onCategoryCreated();
            Alert.alert("Success", "Category created successfully!");
        } catch (err) {
            console.error("Create category error:", err);
            Alert.alert("Error", "Failed to create category");
        } finally {
            setCreatingCategory(false);
        }
    };

    return (
        <>
            {/* =====================================================
                MAIN MENU ITEM FORM MODAL
                ===================================================== */}

            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                {/* Dark overlay background */}
                <View className="flex-1 bg-black/60">
                    <View className="flex-1 mt-20">
                        {/* Gradient background for recipe card aesthetic */}
                        <LinearGradient
                            colors={['#fff7ed', '#fef3c7', '#fde68a']}
                            className="flex-1 rounded-t-[40px] overflow-hidden"
                        >
                            {/* Header Section */}
                            <View className="bg-orange-500 px-6 py-6 relative">
                                {/* Decorative corner triangle */}
                                <View className="absolute top-0 right-0 w-24 h-24">
                                    <View className="absolute top-0 right-0 w-0 h-0 border-t-[90px] border-r-[90px] border-t-orange-600 border-r-transparent opacity-50" />
                                </View>

                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2">
                                            <View className="w-1 h-6 bg-white rounded-full mr-2" />
                                            <Text className="text-white/90 text-xs font-bold tracking-widest uppercase">
                                                {editMode ? "Update Recipe" : "New Recipe"}
                                            </Text>
                                        </View>
                                        <Text className="text-white text-3xl font-bold">
                                            {editMode ? "Edit Dish" : "Create Dish"}
                                        </Text>
                                        <Text className="text-white/80 text-sm mt-1">
                                            Craft your signature creation
                                        </Text>
                                    </View>

                                    {/* Close button */}
                                    <Pressable
                                        onPress={onClose}
                                        className="bg-white/20 w-10 h-10 rounded-full items-center justify-center active:scale-95"
                                    >
                                        <Ionicons name="close" size={24} color="white" />
                                    </Pressable>
                                </View>
                            </View>

                            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                                <View className="p-6 space-y-5">
                                    {/* =====================================================
                                        IMAGE UPLOAD SECTION
                                        ===================================================== */}

                                    <View>
                                        <Text className="text-gray-900 text-sm font-bold mb-3 uppercase tracking-wide">
                                            📸 Dish Photo
                                        </Text>
                                        <Pressable
                                            onPress={onPickImage}
                                            className="bg-white rounded-3xl overflow-hidden border-2 border-dashed border-orange-300 active:scale-[0.98]"
                                            style={{
                                                shadowColor: '#f97316',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.15,
                                                shadowRadius: 12,
                                                elevation: 5,
                                            }}
                                        >
                                            {formData.imageUri ? (
                                                // Show selected image with overlay
                                                <View className="relative">
                                                    <Image
                                                        source={{ uri: formData.imageUri }}
                                                        className="w-full h-48"
                                                        resizeMode="cover"
                                                    />
                                                    <View className="absolute inset-0 bg-black/40 items-center justify-center">
                                                        <View className="bg-white/90 rounded-full p-3 mb-2">
                                                            <Ionicons name="camera" size={28} color="#f97316" />
                                                        </View>
                                                        <Text className="text-white font-bold">Tap to change photo</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                // Empty state - prompt to add image
                                                <View className="h-48 items-center justify-center">
                                                    <View className="bg-orange-100 rounded-full p-4 mb-3">
                                                        <Ionicons name="camera" size={40} color="#f97316" />
                                                    </View>
                                                    <Text className="text-gray-900 font-bold text-base">Add Photo</Text>
                                                    <Text className="text-gray-500 text-sm mt-1">Showcase your dish</Text>
                                                </View>
                                            )}
                                        </Pressable>
                                    </View>

                                    {/* Dish Name Input */}
                                    <View>
                                        <Text className="text-gray-900 text-sm font-bold mb-2 uppercase tracking-wide">
                                            🍽️ Dish Name
                                        </Text>
                                        <View className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden">
                                            <TextInput
                                                value={formData.name}
                                                onChangeText={(val) => onFormChange("name", val)}
                                                placeholder="e.g., Grilled Salmon with Herbs"
                                                placeholderTextColor="#9ca3af"
                                                className="px-4 py-4 text-gray-900 text-base font-semibold"
                                            />
                                        </View>
                                    </View>

                                    {/* Description Input - multiline */}
                                    <View>
                                        <Text className="text-gray-900 text-sm font-bold mb-2 uppercase tracking-wide">
                                            📝 Description
                                        </Text>
                                        <View className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden">
                                            <TextInput
                                                value={formData.description}
                                                onChangeText={(val) => onFormChange("description", val)}
                                                placeholder="Describe your culinary masterpiece..."
                                                placeholderTextColor="#9ca3af"
                                                className="px-4 py-4 text-gray-900 text-base"
                                                multiline
                                                numberOfLines={3}
                                                textAlignVertical="top"
                                            />
                                        </View>
                                    </View>

                                    {/* Price Input with $ prefix */}
                                    <View>
                                        <Text className="text-gray-900 text-sm font-bold mb-2 uppercase tracking-wide">
                                            💰 Price
                                        </Text>
                                        <View className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden flex-row items-center">
                                            <Text className="pl-4 text-gray-900 text-lg font-bold">$</Text>
                                            <TextInput
                                                value={formData.price}
                                                onChangeText={(val) => onFormChange("price", val)}
                                                placeholder="0.00"
                                                placeholderTextColor="#9ca3af"
                                                keyboardType="decimal-pad"
                                                className="flex-1 px-2 py-4 text-gray-900 text-base font-semibold"
                                            />
                                        </View>
                                    </View>

                                    {/* =====================================================
                                        CATEGORY SELECTION
                                        ===================================================== */}

                                    <View>
                                        <View className="flex-row items-center justify-between mb-2">
                                            <Text className="text-gray-900 text-sm font-bold uppercase tracking-wide">
                                                🏷️ Category
                                            </Text>
                                            {/* Button to open nested category creation modal */}
                                            <Pressable
                                                onPress={() => setShowCategoryModal(true)}
                                                className="active:scale-95"
                                            >
                                                <View className="bg-orange-500 px-3 py-1.5 rounded-full flex-row items-center">
                                                    <Ionicons name="add" size={14} color="white" />
                                                    <Text className="text-white text-xs font-bold ml-1">New</Text>
                                                </View>
                                            </Pressable>
                                        </View>

                                        {/* Horizontal scrollable category chips */}
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            className="flex-row gap-2"
                                        >
                                            {categories.map((cat) => (
                                                <Pressable
                                                    key={cat.$id}
                                                    onPress={() => onFormChange("category", cat.$id)}
                                                    className="active:scale-95"
                                                >
                                                    {/* Conditional styling for selected category */}
                                                    <View className={`px-4 py-3 rounded-xl border-2 ${
                                                        formData.category === cat.$id
                                                            ? "bg-orange-500 border-orange-500"
                                                            : "bg-white border-orange-200"
                                                    }`}>
                                                        <Text className={`font-bold text-sm ${
                                                            formData.category === cat.$id
                                                                ? "text-white"
                                                                : "text-gray-700"
                                                        }`}>
                                                            {cat.name}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View className="border-t-2 border-dashed border-orange-300 my-2" />

                                    {/* =====================================================
                                        NUTRITION INPUTS
                                        ===================================================== */}

                                    <View>
                                        <Text className="text-gray-900 text-sm font-bold mb-3 uppercase tracking-wide">
                                            ⚡ Nutrition Facts
                                        </Text>
                                        {/* Two inputs side by side */}
                                        <View className="flex-row gap-3">
                                            {/* Calories */}
                                            <View className="flex-1">
                                                <View className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden">
                                                    <View className="flex-row items-center px-4 py-4">
                                                        <Ionicons name="flame" size={20} color="#f97316" />
                                                        <TextInput
                                                            value={formData.calories}
                                                            onChangeText={(val) => onFormChange("calories", val)}
                                                            placeholder="Calories"
                                                            placeholderTextColor="#9ca3af"
                                                            keyboardType="number-pad"
                                                            className="flex-1 ml-2 text-gray-900 text-base font-semibold"
                                                        />
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Protein */}
                                            <View className="flex-1">
                                                <View className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden">
                                                    <View className="flex-row items-center px-4 py-4">
                                                        <Ionicons name="fitness" size={20} color="#10b981" />
                                                        <TextInput
                                                            value={formData.protein}
                                                            onChangeText={(val) => onFormChange("protein", val)}
                                                            placeholder="Protein (g)"
                                                            placeholderTextColor="#9ca3af"
                                                            keyboardType="number-pad"
                                                            className="flex-1 ml-2 text-gray-900 text-base font-semibold"
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* =====================================================
                                        ACTION BUTTONS
                                        ===================================================== */}

                                    <View className="flex-row gap-3 pt-4 pb-6">
                                        {/* Cancel Button */}
                                        <Pressable
                                            onPress={onClose}
                                            className="flex-1 bg-gray-200 py-4 rounded-2xl active:scale-95"
                                        >
                                            <Text className="text-gray-700 text-center font-bold text-base">
                                                Cancel
                                            </Text>
                                        </Pressable>

                                        {/* Save Button with loading state */}
                                        <Pressable
                                            onPress={onSave}
                                            disabled={loading}
                                            className="flex-[2] active:scale-95"
                                        >
                                            <LinearGradient
                                                colors={['#f97316', '#ea580c']}
                                                className="py-4 rounded-2xl flex-row items-center justify-center"
                                                style={{
                                                    shadowColor: '#f97316',
                                                    shadowOffset: { width: 0, height: 6 },
                                                    shadowOpacity: 0.4,
                                                    shadowRadius: 12,
                                                    elevation: 8,
                                                }}
                                            >
                                                {loading ? (
                                                    <>
                                                        <ActivityIndicator color="white" size="small" />
                                                        <Text className="text-white font-bold text-base ml-2">
                                                            Saving...
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ionicons name="checkmark-circle" size={24} color="white" />
                                                        <Text className="text-white font-bold text-base ml-2">
                                                            {editMode ? "Update Dish" : "Create Dish"}
                                                        </Text>
                                                    </>
                                                )}
                                            </LinearGradient>
                                        </Pressable>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Decorative scalloped bottom edge */}
                            <View className="h-5 bg-amber-100 flex-row">
                                {[...Array(12)].map((_, i) => (
                                    <View
                                        key={i}
                                        className="flex-1 bg-slate-950 rounded-t-full"
                                        style={{ marginHorizontal: 1 }}
                                    />
                                ))}
                            </View>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>

            {/* =====================================================
                NESTED CATEGORY CREATION MODAL
                ===================================================== */}

            <Modal
                visible={showCategoryModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View className="flex-1 bg-black/70 items-center justify-center px-6">
                    <View className="bg-amber-50 rounded-3xl overflow-hidden w-full max-w-md"
                          style={{
                              shadowColor: '#f97316',
                              shadowOffset: { width: 0, height: 8 },
                              shadowOpacity: 0.3,
                              shadowRadius: 16,
                              elevation: 10,
                          }}
                    >
                        {/* Header */}
                        <View className="bg-orange-500 px-6 py-5">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-white text-2xl font-bold">New Category</Text>
                                    <Text className="text-white/80 text-sm mt-1">Add a menu section</Text>
                                </View>
                                <Pressable
                                    onPress={() => setShowCategoryModal(false)}
                                    className="bg-white/20 w-9 h-9 rounded-full items-center justify-center active:scale-95"
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </Pressable>
                            </View>
                        </View>

                        {/* Form */}
                        <View className="p-6 space-y-4">
                            <View>
                                <Text className="text-gray-900 text-sm font-bold mb-2 uppercase tracking-wide">
                                    🏷️ Category Name
                                </Text>
                                <View className="bg-white rounded-xl border-2 border-orange-200">
                                    <TextInput
                                        value={newCategoryName}
                                        onChangeText={setNewCategoryName}
                                        placeholder="e.g., Appetizers, Main Course"
                                        placeholderTextColor="#9ca3af"
                                        className="px-4 py-3 text-gray-900 text-base font-semibold"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-900 text-sm font-bold mb-2 uppercase tracking-wide">
                                    📝 Description (Optional)
                                </Text>
                                <View className="bg-white rounded-xl border-2 border-orange-200">
                                    <TextInput
                                        value={newCategoryDescription}
                                        onChangeText={setNewCategoryDescription}
                                        placeholder="Brief description..."
                                        placeholderTextColor="#9ca3af"
                                        className="px-4 py-3 text-gray-900 text-base"
                                        multiline
                                        numberOfLines={2}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>

                            {/* Buttons */}
                            <View className="flex-row gap-3 pt-2">
                                <Pressable
                                    onPress={() => setShowCategoryModal(false)}
                                    className="flex-1 bg-gray-200 py-3 rounded-xl active:scale-95"
                                >
                                    <Text className="text-gray-700 text-center font-bold">Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleCreateCategory}
                                    disabled={creatingCategory}
                                    className="flex-1 active:scale-95"
                                >
                                    <LinearGradient
                                        colors={['#f97316', '#ea580c']}
                                        className="py-3 rounded-xl items-center justify-center"
                                    >
                                        {creatingCategory ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text className="text-white font-bold">Create</Text>
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};