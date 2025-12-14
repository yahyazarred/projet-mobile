// lib/imageService.ts

// Import React Native Alert for displaying messages to the user
import { Alert } from "react-native";
// Import Expo ImagePicker for accessing device photo library
import * as ImagePicker from "expo-image-picker";
// Import ID generator from Appwrite SDK
import { ID } from "react-native-appwrite";
// Import Appwrite configuration and storage service
import { appwriteConfig, storage } from "@/lib/appwrite";

/**
 * Image Service Module
 *
 * This module handles all image operations for the food ordering app:
 * 1. Picking images from device photo library
 * 2. Uploading images to Appwrite storage
 * 3. Deleting images from storage
 *
 * Used primarily for menu item photos and restaurant images
 */

// Get the bucket ID from configuration
// A "bucket" in Appwrite is like a folder for storing files
const BUCKET_ID = appwriteConfig.bucketId;

/**
 * Pick an Image from Device Photo Library
 *
 * This function:
 * 1. Requests permission to access photos
 * 2. Opens the device's photo picker
 * 3. Lets user select and optionally edit an image
 * 4. Returns the local URI of the selected image
 *
 * @returns The local file URI of the selected image, or null if cancelled/failed
 */
export const pickImage = async (): Promise<string | null> => {
    // Step 1: Request permission to access photo library
    // On iOS/Android, apps must explicitly ask for permission to access photos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Check if permission was granted
    if (status !== 'granted') {
        // Show alert explaining why permission is needed
        Alert.alert(
            'Permission Required',
            'We need access to your photos to upload menu images.'
        );
        return null; // Exit early if permission denied
    }

    // Step 2: Launch the image picker (opens photo library UI)
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Only allow images (not videos)
        allowsEditing: true, // Let user crop/edit the image before selecting
        aspect: [4, 3], // Set crop aspect ratio to 4:3 (standard photo ratio)
        quality: 0.8, // Compress to 80% quality (reduces file size for faster uploads)
        base64: false, // Don't convert to base64 (we need file URI for upload)
    });

    // Step 3: Check if user actually selected an image (didn't cancel)
    if (!result.canceled && result.assets[0]) {
        // Extract the URI (file path) of the selected image
        const selectedUri = result.assets[0].uri;
        console.log("Image selected:", selectedUri);

        // Safety check: Warn if image is in base64 format
        // base64 images start with "data:" and can cause upload issues on some platforms
        if (selectedUri.startsWith('data:')) {
            Alert.alert(
                'Warning',
                'Base64 image detected. This may not work on all platforms. Please test on a real device if upload fails.'
            );
        }

        return selectedUri; // Return the file URI for uploading
    }

    // If user cancelled or no image selected, return null
    return null;
};

/**
 * Upload Image to Appwrite Storage
 *
 * This function:
 * 1. Converts the local image file to a blob (binary data)
 * 2. Creates FormData for multipart upload
 * 3. Sends the image to Appwrite storage via REST API
 * 4. Returns the public URL to access the uploaded image
 *
 * Why use REST API instead of SDK?
 * - React Native has compatibility issues with Appwrite SDK's file upload
 * - REST API provides more control and better compatibility
 *
 * @param uri - Local file URI of the image to upload
 * @returns Public URL of the uploaded image
 */
export const uploadImage = async (uri: string): Promise<string> => {
    try {
        console.log("Uploading image:", uri);

        // Generate a unique filename using timestamp
        // Example: "menu-1234567890123.jpg"
        const filename = `menu-${Date.now()}.jpg`;

        // Generate a unique file ID for Appwrite storage
        const fileId = ID.unique();

        // Step 1: Convert image URI to blob (binary large object)
        // fetch() can read local files on mobile devices
        const response = await fetch(uri);
        // blob() converts the response to binary data
        const blob = await response.blob();

        console.log("Blob converted:", blob.size, "bytes");

        // Step 2: Build FormData for multipart/form-data upload
        // FormData is the standard way to upload files in web/mobile apps
        const formData = new FormData();

        // Add the file ID (required by Appwrite)
        formData.append("fileId", fileId);

        // Add the actual file data
        // The "as any" is needed because TypeScript doesn't recognize React Native's file format
        formData.append("file", {
            uri, // Local file path
            type: blob.type || "image/jpeg", // MIME type (fallback to jpeg)
            name: filename // Filename to save as
        } as any);

        console.log("Uploading to Appwrite via REST...");

        // Step 3: Send POST request to Appwrite storage endpoint
        // Using REST API directly instead of SDK for better compatibility
        const uploadRes = await fetch(
            // Construct the full API endpoint URL
            `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files`,
            {
                method: "POST", // POST method for creating new resources
                headers: {
                    // X-Appwrite-Project header is required for authentication
                    "X-Appwrite-Project": appwriteConfig.projectId,
                    // Note: Content-Type is automatically set by FormData
                },
                body: formData // Send the FormData containing the file
            }
        );

        // Step 4: Check if upload was successful
        if (!uploadRes.ok) {
            // If upload failed, get error details
            const errorText = await uploadRes.text();
            console.error("Upload error:", errorText);
            throw new Error("Upload failed: " + uploadRes.status);
        }

        // Parse the successful response as JSON
        const uploadedFile = await uploadRes.json();

        console.log("Upload success:", uploadedFile);

        // Step 5: Construct the public URL to access the uploaded image
        // This URL format allows anyone to view the image (public access)
        // Format: {endpoint}/storage/buckets/{bucketId}/files/{fileId}/view?project={projectId}&mode=public
        const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}&mode=public`;

        // Return the public URL (save this in database to display image later)
        return fileUrl;

    } catch (error: any) {
        console.error("Upload failed:", error);
        // Re-throw with clearer error message
        throw new Error(error.message);
    }
};

/**
 * Delete Image from Appwrite Storage
 *
 * Removes an image file from storage when it's no longer needed.
 * Used when:
 * - Deleting a menu item
 * - Replacing an old image with a new one
 * - Cleaning up unused images
 *
 * The function extracts the file ID from the image URL and deletes it.
 *
 * @param imageUrl - The full public URL of the image to delete
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
    try {
        // Step 1: Extract file ID from the URL using regex
        // URL format: .../files/{fileId}/view?...
        // The regex captures the ID between "files/" and the next "/"
        const fileIdMatch = imageUrl.match(/files\/([^\/]+)\//);

        // Check if we successfully extracted the file ID
        if (fileIdMatch && fileIdMatch[1]) {
            // fileIdMatch[1] contains the captured file ID
            // Use Appwrite SDK to delete the file
            await storage.deleteFile(BUCKET_ID, fileIdMatch[1]);
            console.log("Image file deleted from storage");
        }
    } catch (storageError) {
        // Don't throw error - just log warning
        // Deletion failures shouldn't crash the app
        // (Image might already be deleted, or permissions might have changed)
        console.warn("Could not delete image from storage:", storageError);
    }
};