// lib/menuTypes.ts
import { Models } from "react-native-appwrite";

export interface MenuItem extends Models.Document {//interface:object/Models.Document;from the DB
    name: string;
    description: string;
    price: number;
    image_url: string;
    rating?: number;
    calories?: number;
    protein?: number;
    categories: string;
    restaurantId: string;
}

export interface Category extends Models.Document {
    name: string;
    description?: string;
    restaurantId?: string;
}

export interface MenuFormData {
    name: string;
    description: string;
    price: string;
    category: string;
    calories: string;
    protein: string;
    imageUri: string;
}