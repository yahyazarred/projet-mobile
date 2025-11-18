// lib/imageService.ts
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ID } from "react-native-appwrite";
import { appwriteConfig, storage } from "@/lib/appwrite";

const BUCKET_ID = appwriteConfig.bucketId;

export const pickImage = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload menu images.');
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
    });

    if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        console.log("Image selected:", selectedUri);

        if (selectedUri.startsWith('data:')) {
            Alert.alert(
                'Warning',
                'Base64 image detected. This may not work on all platforms. Please test on a real device if upload fails.'
            );
        }

        return selectedUri;
    }

    return null;
};

export const uploadImage = async (uri: string): Promise<string> => {
    try {
        console.log("Uploading image from URI:", uri);

        const filename = `menu-${Date.now()}.jpg`;
        let file: any;

        // Check if it's a base64 data URI (Web platform)
        if (uri.startsWith('data:')) {
            console.log("Base64 data URI detected - converting to Blob for web upload");

            const response = await fetch(uri);
            const blob = await response.blob();

            file = new File([blob], filename, { type: 'image/jpeg' });
            console.log("Converted to File object:", file.size, "bytes");
        } else {
            // For React Native mobile (file:// or content:// URIs)
            file = {
                uri: uri,
                name: filename,
                type: 'image/jpeg',
            };
            console.log("Using native file URI");
        }

        console.log("Creating file in storage...");

        const uploadedFile = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
        );

        if (!uploadedFile || !uploadedFile.$id) {
            throw new Error("File upload failed - no file ID returned from server");
        }

        console.log("File uploaded successfully with ID:", uploadedFile.$id);

        const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;

        console.log("File URL:", fileUrl);
        return fileUrl;
    } catch (error: any) {
        console.error("Upload image error:", error);

        if (error.message?.includes('404')) {
            throw new Error("Storage bucket not found. Please check your Appwrite configuration.");
        } else if (error.message?.includes('401')) {
            throw new Error("Unauthorized. Please check your Appwrite permissions.");
        } else if (error.message?.includes('413')) {
            throw new Error("File too large. Please select a smaller image.");
        } else {
            throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
        }
    }
};

export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
    try {
        const fileIdMatch = imageUrl.match(/files\/([^\/]+)\//);
        if (fileIdMatch && fileIdMatch[1]) {
            await storage.deleteFile(BUCKET_ID, fileIdMatch[1]);
            console.log("Image file deleted from storage");
        }
    } catch (storageError) {
        console.warn("Could not delete image from storage:", storageError);
    }
};