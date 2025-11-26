// app/(tabs2)/menu.tsx
import { useState } from "react";
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
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

    const getCategoryInfo = (categoryId: string) => {
        return categories.find(cat => cat.$id === categoryId);
    };

    if (loading && menuItems.length === 0) {
        return (
            <View className="flex-1 bg-slate-950">
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#334155']}
                    className="flex-1 justify-center items-center"
                >
                    <View className="bg-white/10 rounded-full p-8 mb-4">
                        <ActivityIndicator size="large" color="#f97316" />
                    </View>
                    <Text className="text-white text-lg font-semibold">Preparing your menu...</Text>
                    <Text className="text-slate-400 text-sm mt-2">Just a moment</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#1e293b']}
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    <FlatList
                        data={menuItems}
                        keyExtractor={(item) => item.$id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        numColumns={2}
                        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
                        ListHeaderComponent={
                            <View className="px-6 pt-6 pb-8">
                                {/* Hero Header */}
                                <View className="mb-8">
                                    <View className="flex-row items-center mb-3">
                                        <View className="w-1 h-8 bg-orange-500 rounded-full mr-3" />
                                        <Text className="text-orange-500 text-xs font-bold tracking-widest uppercase">
                                            Culinary Excellence
                                        </Text>
                                    </View>
                                    <Text className="text-white text-4xl font-bold leading-tight mb-2">
                                        Menu
                                    </Text>
                                    <Text className="text-white text-4xl font-bold leading-tight mb-3">
                                        Collection
                                    </Text>
                                    <Text className="text-slate-400 text-base leading-relaxed">
                                        Craft your signature dishes and delight your guests
                                    </Text>
                                </View>

                                {/* Stats Bar */}
                                <View className="flex-row bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                                    <View className="flex-1 items-center">
                                        <Text className="text-white text-2xl font-bold">
                                            {menuItems.length}
                                        </Text>
                                        <Text className="text-slate-400 text-xs mt-1">Dishes</Text>
                                    </View>
                                    <View className="w-px bg-white/10" />
                                    <View className="flex-1 items-center">
                                        <Text className="text-white text-2xl font-bold">
                                            {categories.length}
                                        </Text>
                                        <Text className="text-slate-400 text-xs mt-1">Categories</Text>
                                    </View>
                                    <View className="w-px bg-white/10" />
                                    <View className="flex-1 items-center">
                                        <View className="flex-row items-center">
                                            <Ionicons name="star" size={16} color="#f97316" />
                                            <Text className="text-white text-2xl font-bold ml-1">4.8</Text>
                                        </View>
                                        <Text className="text-slate-400 text-xs mt-1">Avg Rating</Text>
                                    </View>
                                </View>

                                {/* Action Header */}
                                <View className="flex-row justify-between items-center mb-4">
                                    <View>
                                        <Text className="text-white text-xl font-bold">Your Creations</Text>
                                        <Text className="text-slate-400 text-sm mt-1">
                                            {menuItems.length > 0
                                                ? `${menuItems.length} signature ${menuItems.length === 1 ? 'dish' : 'dishes'}`
                                                : 'Start building your menu'
                                            }
                                        </Text>
                                    </View>

                                    {/* Floating Add Button */}
                                    <Pressable
                                        onPress={openAddModal}
                                        className="active:scale-95"
                                    >
                                        <LinearGradient
                                            colors={['#f97316', '#ea580c']}
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
                        ListEmptyComponent={
                            <View className="items-center justify-center px-6 py-20">
                                <View className="bg-white/5 rounded-full p-8 mb-6 border border-white/10">
                                    <Ionicons name="restaurant-outline" size={64} color="#64748b" />
                                </View>
                                <Text className="text-white text-2xl font-bold mb-2">
                                    Your Canvas Awaits
                                </Text>
                                <Text className="text-slate-400 text-center text-base mb-6 leading-relaxed px-8">
                                    Begin your culinary journey by adding your first signature dish
                                </Text>
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
                        renderItem={({ item }) => {
                            const category = getCategoryInfo(item.categories);

                            return (
                                <View className="flex-1 mb-4">
                                    {/* Recipe Card Design */}
                                    <Pressable
                                        onPress={() => openEditModal(item)}
                                        className="bg-amber-50 rounded-3xl overflow-hidden"
                                        style={{
                                            shadowColor: '#f97316',
                                            shadowOffset: { width: 0, height: 8 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 16,
                                            elevation: 8,
                                        }}
                                    >
                                        {/* Food Image Container with Clip Art Style */}
                                        <View className="relative">
                                            <Image
                                                source={{ uri: item.image_url }}
                                                className="w-full h-36 bg-gray-200"
                                                resizeMode="cover"
                                            />
                                            {/* Decorative Top Corner */}
                                            <View className="absolute top-0 right-0 w-16 h-16">
                                                <View className="absolute top-0 right-0 w-0 h-0 border-t-[60px] border-r-[60px] border-t-orange-500/90 border-r-transparent" />
                                            </View>

                                            {/* Rating Badge */}
                                            <View className="absolute top-2 left-2 bg-white/95 px-2 py-1 rounded-full flex-row items-center">
                                                <Ionicons name="star" size={12} color="#f97316" />
                                                <Text className="text-xs font-bold text-gray-900 ml-1">
                                                    {item.rating || 4.5}
                                                </Text>
                                            </View>

                                            {/* Price Tag - Hanging Style */}
                                            <View className="absolute top-2 right-2">
                                                <View className="bg-red-500 px-3 py-1.5 rounded-lg rotate-6">
                                                    <Text className="text-white text-xs font-black">
                                                        ${item.price}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Recipe Card Content */}
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

                                            {/* Description */}
                                            <Text className="text-gray-600 text-xs leading-relaxed mb-3" numberOfLines={2}>
                                                {item.description}
                                            </Text>

                                            {/* Divider Line */}
                                            <View className="border-t border-dashed border-gray-300 mb-3" />

                                            {/* Nutrition Info */}
                                            <View className="flex-row justify-between mb-3">
                                                <View className="flex-row items-center">
                                                    <Ionicons name="flame" size={14} color="#f97316" />
                                                    <Text className="text-gray-700 text-xs font-semibold ml-1">
                                                        {item.calories || 0} cal
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <Ionicons name="fitness" size={14} color="#10b981" />
                                                    <Text className="text-gray-700 text-xs font-semibold ml-1">
                                                        {item.protein || 0}g protein
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Action Buttons */}
                                            <View className="flex-row gap-2">
                                                <Pressable
                                                    onPress={() => openEditModal(item)}
                                                    className="flex-1 bg-orange-500 py-2 rounded-xl flex-row items-center justify-center"
                                                >
                                                    <Ionicons name="create-outline" size={16} color="white" />
                                                    <Text className="text-white text-xs font-bold ml-1">
                                                        Edit
                                                    </Text>
                                                </Pressable>
                                                <Pressable
                                                    onPress={() => {
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

                                        {/* Decorative Bottom Scalloped Edge */}
                                        <View className="h-4 bg-amber-50 flex-row">
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
        </View>
    );
}