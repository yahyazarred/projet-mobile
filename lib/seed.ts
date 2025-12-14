/**
 * Database Seeding Script
 *
 * This script populates the database with initial test/demo data.
 * Used for:
 * - Development/testing (reset database to known state)
 * - Demo purposes (show app with sample data)
 * - Initial app setup (populate categories and sample menu items)
 *
 * WARNING: This script DELETES all existing data before seeding!
 * Never run this on a production database with real customer data.
 *
 * Process:
 * 1. Clear all existing data (database collections and storage files)
 * 2. Create categories (e.g., Pizza, Burgers, Desserts)
 * 3. Create customizations (e.g., Extra Cheese, Large Size)
 * 4. Create menu items with images
 * 5. Link menu items to their available customizations
 */

// @ts-ignore - Ignores TypeScript errors for this import (if dummy data doesn't have types)

// Import Appwrite ID generator
import { ID } from "react-native-appwrite";
// Import Appwrite services and configuration
import { appwriteConfig, databases, storage } from "./appwrite";
// Import dummy data (sample menu items, categories, etc.)
import dummyData from "./data";

/**
 * Category Interface
 * Defines the structure of a food category
 */
interface Category {
    name: string;        // Category name (e.g., "Pizza", "Burgers")
    description: string; // Category description
}

/**
 * Customization Interface
 * Defines the structure of a menu item customization option
 */
interface Customization {
    name: string;   // Customization name (e.g., "Extra Cheese", "Large")
    price: number;  // Additional price for this customization
    type: "topping" | "side" | "size" | "crust" | string; // Type of customization
}

/**
 * MenuItem Interface
 * Defines the structure of a menu item in the dummy data
 */
interface MenuItem {
    name: string;               // Item name (e.g., "Margherita Pizza")
    description: string;        // Item description
    image_url: string;          // URL of item image (can be local or remote)
    price: number;              // Base price
    rating: number;             // Average rating (e.g., 4.5)
    calories: number;           // Nutritional info
    protein: number;            // Nutritional info
    category_name: string;      // Name of category (will be converted to ID)
    customizations: string[];   // Array of customization names (will be converted to IDs)
}

/**
 * DummyData Interface
 * Defines the complete structure of the seed data file
 */
interface DummyData {
    categories: Category[];       // Array of all categories
    customizations: Customization[]; // Array of all customizations
    menu: MenuItem[];             // Array of all menu items
}

// Cast dummyData to DummyData type for type safety
const data = dummyData as DummyData;

/**
 * Clear All Documents from a Collection
 *
 * Deletes every document in a specified collection.
 * Used to reset collections before seeding with fresh data.
 *
 * Process:
 * 1. List all documents in the collection
 * 2. Delete each document using Promise.all (parallel execution)
 *
 * @param collectionId - The ID of the collection to clear
 */
async function clearAll(collectionId: string): Promise<void> {
    // Step 1: Get all documents from the collection
    const list = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId
    );

    // Step 2: Delete all documents in parallel
    // Promise.all waits for all deletions to complete
    // map creates an array of delete promises
    await Promise.all(
        list.documents.map((doc) =>
            databases.deleteDocument(
                appwriteConfig.databaseId,
                collectionId,
                doc.$id // Document ID to delete
            )
        )
    );
}

/**
 * Clear All Files from Storage
 *
 * Deletes every file in the storage bucket.
 * Used to remove old images before uploading new ones.
 *
 * Process:
 * 1. List all files in the bucket
 * 2. Delete each file using Promise.all (parallel execution)
 */
async function clearStorage(): Promise<void> {
    // Step 1: Get all files from the storage bucket
    const list = await storage.listFiles(appwriteConfig.bucketId);

    // Step 2: Delete all files in parallel
    await Promise.all(
        list.files.map((file: { $id: any; }) =>
            storage.deleteFile(
                appwriteConfig.bucketId,
                file.$id // File ID to delete
            )
        )
    );
}

/**
 * Upload Image to Appwrite Storage
 *
 * Downloads an image from a URL and uploads it to Appwrite storage.
 * Used during seeding to upload menu item images.
 *
 * Process:
 * 1. Fetch the image from the URL
 * 2. Convert response to blob (binary data)
 * 3. Create file object with metadata
 * 4. Upload to Appwrite storage
 * 5. Return the public URL for accessing the uploaded file
 *
 * @param imageUrl - URL of the image to upload (can be local or remote)
 * @returns Public URL of the uploaded image
 */
async function uploadImageToStorage(imageUrl: string) {
    // Step 1: Fetch the image from the URL
    const response = await fetch(imageUrl);

    // Step 2: Convert to blob (binary large object)
    const blob = await response.blob();

    // Step 3: Create file object with required metadata
    const fileObj = {
        // Extract filename from URL, or generate one with timestamp
        name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
        type: blob.type,    // MIME type (e.g., "image/jpeg")
        size: blob.size,    // File size in bytes
        uri: imageUrl,      // Source URI
    };

    // Step 4: Upload file to Appwrite storage
    const file = await storage.createFile(
        appwriteConfig.bucketId, // Which storage bucket
        ID.unique(),              // Generate unique file ID
        fileObj                   // File data and metadata
    );

    // Step 5: Generate and return public URL for the uploaded file
    // This URL can be used to display the image in the app
    return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
}

/**
 * Main Seeding Function
 *
 * Populates the database with complete sample data.
 * This is the orchestrator function that calls all other helper functions
 * in the correct order.
 *
 * Steps:
 * 1. Clear all existing data (database + storage)
 * 2. Create categories and map names to IDs
 * 3. Create customizations and map names to IDs
 * 4. Create menu items with uploaded images
 * 5. Link menu items to their customizations
 *
 * Why create maps?
 * - Dummy data uses names ("Pizza", "Extra Cheese")
 * - Database uses IDs ("abc123", "def456")
 * - Maps allow us to convert names → IDs when creating relationships
 */
async function seed(): Promise<void> {
    // =====================================================
    // STEP 1: CLEAR ALL EXISTING DATA
    // =====================================================
    console.log("🧹 Clearing existing data...");

    // Clear all database collections
    await clearAll(appwriteConfig.categoriesCollectionId);
    await clearAll(appwriteConfig.customizationsCollectionId);
    await clearAll(appwriteConfig.menuCollectionId);
    await clearAll(appwriteConfig.menuCustomizationsCollectionId);

    // Clear all storage files
    await clearStorage();

    // =====================================================
    // STEP 2: CREATE CATEGORIES
    // =====================================================
    console.log("📁 Creating categories...");

    // Create a map to store category name → ID mappings
    // This allows us to reference categories by name later
    const categoryMap: Record<string, string> = {};

    // Loop through each category in dummy data
    for (const cat of data.categories) {
        // Create category document in database
        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
            ID.unique(), // Generate unique ID
            cat          // Category data (name, description)
        );

        // Store mapping: category name → document ID
        // Example: categoryMap["Pizza"] = "abc123"
        categoryMap[cat.name] = doc.$id;
    }

    // =====================================================
    // STEP 3: CREATE CUSTOMIZATIONS
    // =====================================================
    console.log("🎨 Creating customizations...");

    // Create a map to store customization name → ID mappings
    const customizationMap: Record<string, string> = {};

    // Loop through each customization in dummy data
    for (const cus of data.customizations) {
        // Create customization document in database
        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsCollectionId,
            ID.unique(),
            {
                name: cus.name,   // Customization name
                price: cus.price, // Additional price
                type: cus.type,   // Type (topping, size, etc.)
            }
        );

        // Store mapping: customization name → document ID
        // Example: customizationMap["Extra Cheese"] = "def456"
        customizationMap[cus.name] = doc.$id;
    }

    // =====================================================
    // STEP 4: CREATE MENU ITEMS
    // =====================================================
    console.log("🍕 Creating menu items...");

    // Create a map to store menu item name → ID mappings
    const menuMap: Record<string, string> = {};

    // Loop through each menu item in dummy data
    for (const item of data.menu) {
        // Step 4a: Upload image to storage
        // This downloads the image and uploads it to Appwrite
        const uploadedImage = await uploadImageToStorage(item.image_url);

        // Step 4b: Create menu item document
        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            ID.unique(),
            {
                name: item.name,
                description: item.description,
                image_url: uploadedImage,  // Use the uploaded image URL
                price: item.price,
                rating: item.rating,
                calories: item.calories,
                protein: item.protein,
                // Convert category name to ID using our map
                // Example: "Pizza" → "abc123"
                categories: categoryMap[item.category_name],
            }
        );

        // Store mapping: menu item name → document ID
        menuMap[item.name] = doc.$id;

        // =====================================================
        // STEP 5: LINK MENU ITEMS TO CUSTOMIZATIONS
        // =====================================================
        // Create many-to-many relationship between menu items and customizations
        // A menu item can have multiple customizations
        // A customization can be used by multiple menu items

        // Loop through each customization name for this menu item
        for (const cusName of item.customizations) {
            // Create a link document in the junction table
            await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCustomizationsCollectionId,
                ID.unique(),
                {
                    // Link the menu item ID
                    menu: doc.$id,
                    // Link the customization ID (converted from name using map)
                    customizations: customizationMap[cusName],
                }
            );
        }
    }

    console.log("✅ Seeding complete.");
    console.log(`📊 Created:
    - ${data.categories.length} categories
    - ${data.customizations.length} customizations
    - ${data.menu.length} menu items`);
}

// Export the seed function so it can be called from other files
export default seed;