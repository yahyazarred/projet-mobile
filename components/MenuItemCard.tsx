// components/MenuItemCard.tsx
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MenuItem, Category } from "@/lib/menuTypes";

interface MenuItemCardProps {
    item: MenuItem;
    categories: Category[];
    onEdit: (item: MenuItem) => void;
    onDelete: (itemId: string, imageUrl: string) => void;
}

export const MenuItemCard = ({ item, categories, onEdit, onDelete }: MenuItemCardProps) => {
    const categoryName = categories.find((c) => c.$id === item.categories)?.name || "N/A";

    return (
        <View className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden">
            <View className="flex-row">
                <Image
                    source={{ uri: item.image_url }}
                    className="w-28 h-28"
                    resizeMode="cover"
                />
                <View className="flex-1 p-3 justify-between">
                    <View>
                        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                            {item.description}
                        </Text>
                        <Text className="text-xs text-primary mt-1">{categoryName}</Text>
                    </View>
                    <Text className="text-lg font-bold text-primary">${item.price.toFixed(2)}</Text>
                </View>
            </View>

            <View className="flex-row border-t border-gray-100">
                <Pressable
                    onPress={() => onEdit(item)}
                    className="flex-1 py-3 items-center flex-row justify-center"
                >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                    <Text className="ml-2 text-blue-600 font-semibold">Edit</Text>
                </Pressable>
                <View className="w-px bg-gray-100" />
                <Pressable
                    onPress={() => onDelete(item.$id, item.image_url)}
                    className="flex-1 py-3 items-center flex-row justify-center"
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text className="ml-2 text-red-600 font-semibold">Delete</Text>
                </Pressable>
            </View>
        </View>
    );
};