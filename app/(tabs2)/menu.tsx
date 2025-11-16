import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Pressable, Image, Text, View, Modal, TextInput, Alert } from "react-native";
import cn from "clsx";

import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";
import { Query, ID } from "react-native-appwrite"; // 🔥 Import ID here
import { images } from "@/constants";

interface Category {
    $id: string;
    name: string;
    description: string;
    color?: string;
    restaurantId?: string;
}

// Use IDs from appwriteConfig
const DB_ID = appwriteConfig.databaseId;
const RESTAURANTS_ID = appwriteConfig.restaurantCollectionId;
const CATEGORIES_ID = appwriteConfig.categoriesCollectionId;

export default function MenuCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: "", description: "" });
    const [currentRestaurantId, setCurrentRestaurantId] = useState<string>("");

    // Fetch restaurant of this owner using accountId
    const fetchRestaurant = async (accountId: string) => {
        const result = await databases.listDocuments(DB_ID, RESTAURANTS_ID, [
            Query.equal("ownerId", accountId)
        ]);

        return result.documents[0] ?? null;
    };

    // Fetch categories for this restaurant
    const fetchCategories = async (restaurantId: string) => {
        const result = await databases.listDocuments(DB_ID, CATEGORIES_ID, [
            Query.equal("restaurantId", restaurantId)
        ]);

        return result.documents as Category[];
    };

    useEffect(() => {
        const load = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) throw new Error("User not found");

                // 🔥 Use user.accountId here, not user.$id
                const restaurant = await fetchRestaurant(user.accountId);
                if (!restaurant) {
                    throw new Error("No restaurant associated with this owner");
                }

                setCurrentRestaurantId(restaurant.$id);

                // Load restaurant categories
                const data = await fetchCategories(restaurant.$id);
                setCategories(data);
            } catch (err) {
                console.log("Failed to load categories:", err);
                Alert.alert("Error", (err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleAddCategory = async () => {
        if (!newCategory.name || !newCategory.description) {
            return Alert.alert("Error", "Please fill in all fields");
        }

        try {
            await databases.createDocument(DB_ID, CATEGORIES_ID, ID.unique(), {
                name: newCategory.name,
                description: newCategory.description,
                restaurantId: currentRestaurantId,
            });

            Alert.alert("Success", "Category created!");
            setModalVisible(false);
            setNewCategory({ name: "", description: "" });

            // Reload categories
            const data = await fetchCategories(currentRestaurantId);
            setCategories(data);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", (err as Error).message);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-white">
                <Text className="text-lg text-gray-600">Loading categories…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <FlatList
                data={categories}
                keyExtractor={(item) => item.$id}
                contentContainerClassName="pb-40 px-5"
                ListHeaderComponent={() => (
                    <View className="flex-row justify-between w-full my-5 items-center">
                        <View>
                            <Text className="small-bold text-primary">MENU</Text>
                            <Text className="paragraph-bold text-dark-100 mt-0.5">
                                Browse Categories
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => setModalVisible(true)}
                            className="bg-primary w-12 h-12 rounded-full items-center justify-center"
                        >
                            <Text className="text-white text-2xl">+</Text>
                        </Pressable>
                    </View>
                )}
                renderItem={({ item, index }) => {
                    const isEven = index % 2 === 0;
                    return (
                        <View className="my-3">
                            <Pressable
                                onPress={() => console.log("Category clicked:", item.name)}
                                className={cn("offer-card", isEven ? "flex-row-reverse" : "flex-row")}
                                style={{ backgroundColor: item.color || "#df5a0c" }}
                            >
                                <View className="h-full w-1/2 flex items-center justify-center">
                                    <Image
                                        source={images.burgerTwo}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                </View>

                                <View className={cn("offer-card__info", isEven ? "pl-10" : "pr-10")}>
                                    <Text className="h1-bold text-white leading-tight">{item.name}</Text>
                                    <Text className="text-white mt-1 opacity-80">{item.description}</Text>
                                </View>
                            </Pressable>
                        </View>
                    );
                }}
            />

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white w-4/5 p-5 rounded-lg">
                        <Text className="text-lg font-bold mb-3">New Category</Text>

                        <TextInput
                            placeholder="Category Name"
                            value={newCategory.name}
                            onChangeText={(text) => setNewCategory((prev) => ({ ...prev, name: text }))}
                            className="border border-gray-300 p-3 rounded mb-3"
                        />
                        <TextInput
                            placeholder="Category Description"
                            value={newCategory.description}
                            onChangeText={(text) =>
                                setNewCategory((prev) => ({ ...prev, description: text }))
                            }
                            className="border border-gray-300 p-3 rounded mb-3"
                        />

                        <View className="flex-row justify-end gap-3 mt-3">
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Text className="text-gray-500">Cancel</Text>
                            </Pressable>
                            <Pressable onPress={handleAddCategory}>
                                <Text className="text-primary font-bold">Create</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
