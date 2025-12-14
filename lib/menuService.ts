// lib/menuService.ts

/**
 * Menu Service Module
 *
 * This module handles CRUD (Create, Read, Update, Delete) operations for menu items.
 * Used by restaurant owners to manage their menu.
 *
 * Operations:
 * - Create new menu items
 * - Update existing menu items
 * - Delete menu items (with confirmation dialog)
 */

// Debug log to verify this module loads correctly
console.log("🔵 MenuItemsManagement mounted");

// Import React Native Alert for user notifications
import { Alert } from "react-native";
// Import ID generator from Appwrite SDK
import { ID } from "react-native-appwrite";
// Import Appwrite configuration and database service
import { appwriteConfig, databases } from "@/lib/appwrite";
// Import image deletion function to clean up storage when deleting menu items
import { deleteImageFromStorage } from "./imageService";

// Store frequently used IDs in constants for easier access
const DB_ID = appwriteConfig.databaseId;
const MENU_ID = appwriteConfig.menuCollectionId;

/**
 * MenuItemData Interface
 *
 * TypeScript interface defining the structure of a menu item.
 * This ensures type safety when creating/updating menu items.
 *
 * All fields are required for a complete menu item.
 */
export interface MenuItemData {
    name: string;           // Menu item name (e.g., "Margherita Pizza")
    description: string;    // Detailed description of the dish
    price: number;          // Price in dollars (e.g., 12.99)
    categories: string;     // Category ID this item belongs to
    restaurantId: string;   // Restaurant that owns this menu item
    image_url: string;      // Public URL of the item's image
    calories: number;       // Nutritional info: total calories
    protein: number;        // Nutritional info: protein in grams
    rating: number;         // Average customer rating (e.g., 4.5)
}

/**
 * Create a New Menu Item
 *
 * Adds a new menu item to the database for a restaurant.
 * This function:
 * 1. Validates the data structure
 * 2. Sends it to Appwrite database
 * 3. Shows success/error alert to user
 *
 * @param data - Complete menu item data conforming to MenuItemData interface
 * @throws Error if creation fails (network issue, validation error, etc.)
 */
export const createMenuItem = async (data: MenuItemData): Promise<void> => {
    try {
        // Log the data being sent for debugging
        // JSON.stringify with (null, 2) creates pretty-printed JSON with 2-space indentation
        console.log("🟩 Sending to Appwrite (createMenuItem):", JSON.stringify(data, null, 2));

        // Send create request to Appwrite database
        // ID.unique() generates a new unique document ID automatically
        const res = await databases.createDocument(
            DB_ID,      // Which database
            MENU_ID,    // Which collection (table)
            ID.unique(), // Generate new unique document ID
            data        // The menu item data
        );

        // Log the response from Appwrite for debugging
        console.log("🟩 Appwrite response:", JSON.stringify(res, null, 2));

        // Show success message to user
        Alert.alert("Success", "Item created!");
    } catch (err: any) {
        // Comprehensive error logging for debugging
        // Log both the raw error object and its JSON representation
        console.log("❌ Create menu item error (RAW):", err);
        console.log("❌ Create menu item error (DETAILS):", JSON.stringify(err, null, 2));

        // Show error message to user
        // Use err.message if available, otherwise show generic message
        Alert.alert("Error", err.message || "Unknown error");

        // Re-throw the error so calling code can handle it
        // (e.g., to stop form submission, show loading spinner, etc.)
        throw err;
    }
};

/**
 * Update an Existing Menu Item
 *
 * Modifies an existing menu item in the database.
 * Can update any fields (name, price, image, etc.)
 *
 * Common use cases:
 * - Change price
 * - Update description
 * - Replace image
 * - Modify nutritional info
 *
 * @param itemId - The document ID of the menu item to update
 * @param data - Updated menu item data (must include ALL fields, not just changed ones)
 * @throws Error if update fails
 */
export const updateMenuItem = async (itemId: string, data: MenuItemData): Promise<void> => {
    try {
        // Debug logs to track what's being updated
        console.log("🟨 Updating menu item:", itemId);
        console.log("🟨 Payload:", JSON.stringify(data, null, 2));

        // Send update request to Appwrite
        // Note: This replaces ALL fields, not just the ones that changed
        const res = await databases.updateDocument(
            DB_ID,   // Which database
            MENU_ID, // Which collection
            itemId,  // Which specific document to update
            data     // The complete updated data
        );

        // Log the response for debugging
        console.log("🟨 Appwrite update response:", JSON.stringify(res, null, 2));

        // Show success message to user
        Alert.alert("Success", "Item updated!");
    } catch (err: any) {
        // Log error details for debugging
        console.log("❌ Update menu item error:", JSON.stringify(err, null, 2));

        // Show error message to user
        Alert.alert("Error", err.message || "Unknown error");

        // Re-throw error for calling code to handle
        throw err;
    }
};

/**
 * Delete a Menu Item
 *
 * Removes a menu item from the database AND deletes its image from storage.
 *
 * Important features:
 * 1. Shows confirmation dialog (prevent accidental deletions)
 * 2. Deletes database record
 * 3. Deletes associated image file
 * 4. Uses Promise pattern for async confirmation dialog
 *
 * Why return a Promise?
 * - Alert.alert is not async by default
 * - We wrap it in a Promise to make it awaitable
 * - This lets calling code wait for user's decision
 *
 * @param itemId - Document ID of the menu item to delete
 * @param imageUrl - Optional URL of the item's image (for cleanup)
 * @returns Promise that resolves if deleted, rejects if cancelled or error
 */
export const deleteMenuItem = async (itemId: string, imageUrl?: string): Promise<void> => {
    // Return a new Promise that resolves/rejects based on user action
    return new Promise((resolve, reject) => {
        // Show confirmation dialog with two buttons
        Alert.alert(
            "Delete Item",                                      // Dialog title
            "Are you sure you want to delete this item?",       // Dialog message
            [
                // CANCEL BUTTON
                {
                    text: "Cancel",           // Button text
                    style: "cancel",          // iOS styling (cancel style)
                    onPress: () => reject(new Error("Cancelled")) // Reject promise if cancelled
                },

                // DELETE BUTTON
                {
                    text: "Delete",           // Button text
                    style: "destructive",     // iOS styling (red/destructive style)
                    onPress: async () => {    // Async function to handle deletion
                        try {
                            // Step 1: Delete the menu item document from database
                            await databases.deleteDocument(
                                DB_ID,   // Database ID
                                MENU_ID, // Collection ID
                                itemId   // Document ID to delete
                            );

                            // Step 2: Delete the associated image from storage (if exists)
                            if (imageUrl) {
                                // Clean up the image file to free storage space
                                await deleteImageFromStorage(imageUrl);
                            }

                            // Show success message
                            Alert.alert("Success", "Item deleted");

                            // Resolve the promise (indicates success)
                            resolve();
                        } catch (err) {
                            // Log error for debugging
                            console.error("Delete error:", err);

                            // Show error message to user
                            Alert.alert("Error", (err as Error).message);

                            // Reject the promise with the error
                            reject(err);
                        }
                    },
                },
            ]
        );
    });
};