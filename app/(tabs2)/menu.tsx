// app/(tabs2)/menu.tsx
import { useState } from "react";
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMenuItems } from "@/lib/useMenuItems";
import { pickImage, uploadImage } from "@/lib/imageService";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/menuService";
import { MenuItem, MenuFormData } from "@/lib/menuTypes";
import { MenuItemCard } from "@/components/MenuItemCard";
import { MenuFormModal } from "@/components/MenuFormModal";

export default function MenuItemsManagement() {
    const {
        menuItems,
        categories,
        loading,
        currentRestaurantId,
        setLoading,
        loadData,
    } = useMenuItems();

    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);

    const [formData, setFormData] = useState<MenuFormData>({
        name: "",
        description: "",
        price: "",
        category: "",
        calories: "",
        protein: "",
        imageUri: "",
    });

    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri) {
            setFormData((prev) => ({ ...prev, imageUri: uri }));
        }
    };

    const handleFormChange = (field: keyof MenuFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // Validate required fields
        if (!formData.name || !formData.description || !formData.price) {
            return Alert.alert("Error", "Please fill in name, description, and price");
        }

        if (!formData.category) {
            return Alert.alert("Error", "Please select a category. Create a category first if none exist.");
        }

        if (!formData.imageUri) {
            return Alert.alert("Error", "Please select an image for the menu item");
        }

        try {
            setLoading(true);

            let imageUrl = currentItem?.image_url || "";

            // Upload new image if changed
            if (formData.imageUri && formData.imageUri !== currentItem?.image_url) {
                console.log("Uploading new image...");
                imageUrl = await uploadImage(formData.imageUri);
                console.log("Image uploaded successfully:", imageUrl);
            }

            const data = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                categories: formData.category,
                restaurantId: currentRestaurantId,
                image_url: imageUrl,
                calories: formData.calories ? parseInt(formData.calories) : 0,
                protein: formData.protein ? parseInt(formData.protein) : 0,
                rating: currentItem?.rating || 3,
            };

            console.log("Saving menu item:", data);

            if (editMode && currentItem) {
                await updateMenuItem(currentItem.$id, data);
            } else {
                await createMenuItem(data);
            }

            closeModal();
            await loadData();
        } catch (err) {
            console.error("Save error:", err);
            Alert.alert("Error", `Failed to save: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId: string, imageUrl: string) => {
        try {
            setLoading(true);
            await deleteMenuItem(itemId, imageUrl);
            await loadData();
        } catch (err) {
            // Error already handled in deleteMenuItem
            if ((err as Error).message !== "Cancelled") {
                console.error("Delete error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        if (categories.length === 0) {
            return Alert.alert(
                "No Categories",
                "Please create at least one category before adding menu items. Would you like to go to the categories page?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "OK", onPress: () => console.log("Navigate to categories") }
                ]
            );
        }

        setEditMode(false);
        setCurrentItem(null);
        setFormData({
            name: "",
            description: "",
            price: "",
            category: categories[0]?.$id || "",
            calories: "",
            protein: "",
            imageUri: "",
        });
        setModalVisible(true);
    };

    const openEditModal = (item: MenuItem) => {
        setEditMode(true);
        setCurrentItem(item);
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            category: item.categories,
            calories: item.calories?.toString() || "",
            protein: item.protein?.toString() || "",
            imageUri: item.image_url,
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditMode(false);
        setCurrentItem(null);
    };

    if (loading && menuItems.length === 0) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#df5a0c" />
                <Text className="mt-3 text-gray-600">Loading menu...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-amber-50">
            <FlatList
                data={menuItems}
                keyExtractor={(item) => item.$id}
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
                ListHeaderComponent={
                    <View className="flex-row justify-between items-center my-5">
                        <View>
                            <Text className="text-xs font-semibold text-primary">MENU ITEMS</Text>
                            <Text className="text-2xl font-bold text-gray-900 mt-1">
                                Manage Your Menu
                            </Text>
                        </View>
                        <Pressable
                            onPress={openAddModal}
                            className="bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
                        >
                            <Ionicons name="add" size={28} color="white" />
                        </Pressable>
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="fast-food-outline" size={64} color="#ccc" />
                        <Text className="text-gray-500 mt-4">No menu items yet</Text>
                        <Text className="text-gray-400 text-sm">Add your first item!</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <MenuItemCard
                        item={item}
                        categories={categories}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                    />
                )}
            />

            <MenuFormModal
                visible={modalVisible}
                editMode={editMode}
                formData={formData}
                categories={categories}
                loading={loading}
                onClose={closeModal}
                onSave={handleSave}
                onPickImage={handlePickImage}
                onFormChange={handleFormChange}
            />
        </SafeAreaView>
    );
}