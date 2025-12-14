// components/MenuItemCard.tsx

/**
 * MenuItemCard Component
 *
 * Card displaying a menu item in the restaurant owner's management view.
 * Shows item details and provides Edit/Delete actions.
 */

import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MenuItem, Category } from "@/lib/menuTypes";

interface MenuItemCardProps {
    item: MenuItem;                                      // Menu item to display
    categories: Category[];                              // All categories (for lookup)
    onEdit: (item: MenuItem) => void;                   // Edit callback
    onDelete: (itemId: string, imageUrl: string) => void; // Delete callback (needs imageUrl for cleanup)
}

export const MenuItemCard = ({ item, categories, onEdit, onDelete }: MenuItemCardProps) => {
    // Find category name by ID
    // Uses optional chaining (?.) and nullish coalescing (??) for safe access
    const categoryName = categories.find((c) => c.$id === item.categories)?.name || "N/A";

    return (
        <View className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden">
            {/* =====================================================
                MAIN CONTENT - IMAGE & DETAILS
                ===================================================== */}

            <View className="flex-row">
                {/* Food image on left */}
                <Image
                    source={{ uri: item.image_url }}
                    className="w-28 h-28"
                    resizeMode="cover"
                />

                {/* Item details on right */}
                <View className="flex-1 p-3 justify-between">
                    <View>
                        {/* Item name - truncates to 1 line */}
                        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                            {item.name}
                        </Text>

                        {/* Description - truncates to 2 lines */}
                        <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                            {item.description}
                        </Text>

                        {/* Category name in primary color */}
                        <Text className="text-xs text-primary mt-1">{categoryName}</Text>
                    </View>

                    {/* Price - formatted to 2 decimal places */}
                    <Text className="text-lg font-bold text-primary">${item.price.toFixed(2)}</Text>
                </View>
            </View>

            {/* =====================================================
                ACTION BUTTONS - EDIT & DELETE
                ===================================================== */}

            <View className="flex-row border-t border-gray-100">
                {/* Edit Button */}
                <Pressable
                    onPress={() => onEdit(item)}
                    className="flex-1 py-3 items-center flex-row justify-center"
                >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                    <Text className="ml-2 text-blue-600 font-semibold">Edit</Text>
                </Pressable>

                {/* Vertical divider between buttons */}
                <View className="w-px bg-gray-100" />

                {/* Delete Button */}
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