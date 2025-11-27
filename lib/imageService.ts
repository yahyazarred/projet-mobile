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
        console.log("Uploading image:", uri);

        const filename = `menu-${Date.now()}.jpg`;
        const fileId = ID.unique();

        // Convert to blob
        const response = await fetch(uri);
        const blob = await response.blob();

        console.log("Blob converted:", blob.size, "bytes");

        // Build FormData manually
        const formData = new FormData();
        formData.append("fileId", fileId);
        formData.append("file", {
            uri,
            type: blob.type || "image/jpeg",
            name: filename
        } as any);

        console.log("Uploading to Appwrite via REST...");

        const uploadRes = await fetch(
            `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files`,
            {
                method: "POST",
                headers: {
                    "X-Appwrite-Project": appwriteConfig.projectId,

                },
                body: formData
            }
        );

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error("Upload error:", errorText);
            throw new Error("Upload failed: " + uploadRes.status);
        }

        const uploadedFile = await uploadRes.json();

        console.log("Upload success:", uploadedFile);

        const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}&mode=public`;


        return fileUrl;

    } catch (error: any) {
        console.error("Upload failed:", error);
        throw new Error(error.message);
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