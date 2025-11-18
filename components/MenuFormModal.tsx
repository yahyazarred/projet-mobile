// components/MenuFormModal.tsx
import { View, Text, Modal, Pressable, TextInput, Image, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category, MenuFormData } from "@/lib/menuTypes";

interface MenuFormModalProps {
    visible: boolean;
    editMode: boolean;
    formData: MenuFormData;
    categories: Category[];
    loading: boolean;
    onClose: () => void;
    onSave: () => void;
    onPickImage: () => void;
    onFormChange: (field: keyof MenuFormData, value: string) => void;
}

export const MenuFormModal = ({
                                  visible,
                                  editMode,
                                  formData,
                                  categories,
                                  loading,
                                  onClose,
                                  onSave,
                                  onPickImage,
                                  onFormChange,
                              }: MenuFormModalProps) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl max-h-[90%]">
                    <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                        <Text className="text-xl font-bold text-gray-900">
                            {editMode ? "Edit Item" : "Add New Item"}
                        </Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={28} color="#666" />
                        </Pressable>
                    </View>

                    <ScrollView className="p-5">
                        <Pressable
                            onPress={onPickImage}
                            className="bg-gray-100 h-40 rounded-xl items-center justify-center mb-4"
                        >
                            {formData.imageUri ? (
                                <Image source={{ uri: formData.imageUri }} className="w-full h-full rounded-xl" />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="image-outline" size={48} color="#ccc" />
                                    <Text className="text-gray-500 mt-2">Tap to select image</Text>
                                </View>
                            )}
                        </Pressable>

                        <TextInput
                            placeholder="Item Name *"
                            value={formData.name}
                            onChangeText={(text) => onFormChange('name', text)}
                            className="border border-gray-300 rounded-xl p-4 mb-3 text-base"
                        />

                        <TextInput
                            placeholder="Description *"
                            value={formData.description}
                            onChangeText={(text) => onFormChange('description', text)}
                            className="border border-gray-300 rounded-xl p-4 mb-3 text-base h-24"
                            multiline
                            textAlignVertical="top"
                        />

                        <TextInput
                            placeholder="Price *"
                            value={formData.price}
                            onChangeText={(text) => onFormChange('price', text)}
                            keyboardType="decimal-pad"
                            className="border border-gray-300 rounded-xl p-4 mb-3 text-base"
                        />

                        <View className="border border-gray-300 rounded-xl mb-3 overflow-hidden">
                            <Text className="text-gray-500 text-xs px-4 pt-3 pb-1">Category *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3">
                                {categories.map((cat) => (
                                    <Pressable
                                        key={cat.$id}
                                        onPress={() => onFormChange('category', cat.$id)}
                                        className={`px-4 py-2 rounded-full mr-2 ${
                                            formData.category === cat.$id ? "bg-primary" : "bg-gray-100"
                                        }`}
                                    >
                                        <Text
                                            className={`font-semibold ${
                                                formData.category === cat.$id ? "text-white" : "text-gray-700"
                                            }`}
                                        >
                                            {cat.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        <View className="flex-row gap-3">
                            <TextInput
                                placeholder="Calories"
                                value={formData.calories}
                                onChangeText={(text) => onFormChange('calories', text)}
                                keyboardType="number-pad"
                                className="border border-gray-300 rounded-xl p-4 flex-1 text-base"
                            />
                            <TextInput
                                placeholder="Protein (g)"
                                value={formData.protein}
                                onChangeText={(text) => onFormChange('protein', text)}
                                keyboardType="number-pad"
                                className="border border-gray-300 rounded-xl p-4 flex-1 text-base"
                            />
                        </View>
                    </ScrollView>

                    <View className="p-5 border-t border-gray-100">
                        <Pressable
                            onPress={onSave}
                            disabled={loading}
                            className="bg-primary rounded-xl py-4 items-center"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-base">
                                    {editMode ? "Update Item" : "Create Item"}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};