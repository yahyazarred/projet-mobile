// lib/menuService.ts
console.log("🔵 MenuItemsManagement mounted");

import { Alert } from "react-native";
import { ID } from "react-native-appwrite";
import { appwriteConfig, databases } from "@/lib/appwrite";
import { deleteImageFromStorage } from "./imageService";

const DB_ID = appwriteConfig.databaseId;
const MENU_ID = appwriteConfig.menuCollectionId;

export interface MenuItemData {
    name: string;
    description: string;
    price: number;
    categories: string;
    restaurantId: string;
    image_url: string;
    calories: number;
    protein: number;
    rating: number;
}

export const createMenuItem = async (data: MenuItemData): Promise<void> => {
    try {
        console.log("🟩 Sending to Appwrite (createMenuItem):", JSON.stringify(data, null, 2));

        const res = await databases.createDocument(DB_ID, MENU_ID, ID.unique(), data);

        console.log("🟩 Appwrite response:", JSON.stringify(res, null, 2));

        Alert.alert("Success", "Item created!");
    } catch (err: any) {
        console.log("❌ Create menu item error (RAW):", err);
        console.log("❌ Create menu item error (DETAILS):", JSON.stringify(err, null, 2));

        Alert.alert("Error", err.message || "Unknown error");
        throw err;
    }
};


export const updateMenuItem = async (itemId: string, data: MenuItemData): Promise<void> => {
    try {
        console.log("🟨 Updating menu item:", itemId);
        console.log("🟨 Payload:", JSON.stringify(data, null, 2));

        const res = await databases.updateDocument(DB_ID, MENU_ID, itemId, data);

        console.log("🟨 Appwrite update response:", JSON.stringify(res, null, 2));

        Alert.alert("Success", "Item updated!");
    } catch (err: any) {
        console.log("❌ Update menu item error:", JSON.stringify(err, null, 2));
        Alert.alert("Error", err.message || "Unknown error");
        throw err;
    }
};

export const deleteMenuItem = async (itemId: string, imageUrl?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
            { text: "Cancel", style: "cancel", onPress: () => reject(new Error("Cancelled")) },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await databases.deleteDocument(DB_ID, MENU_ID, itemId);

                        if (imageUrl) {
                            await deleteImageFromStorage(imageUrl);
                        }

                        Alert.alert("Success", "Item deleted");
                        resolve();
                    } catch (err) {
                        console.error("Delete error:", err);
                        Alert.alert("Error", (err as Error).message);
                        reject(err);
                    }
                },
            },
        ]);
    });
};