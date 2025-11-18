// lib/useMenuItems.ts
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { Query } from "react-native-appwrite";
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";
import { MenuItem, Category } from "@/lib/menuTypes";

export const useMenuItems = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentRestaurantId, setCurrentRestaurantId] = useState("");

    const DB_ID = appwriteConfig.databaseId;
    const MENU_ID = appwriteConfig.menuCollectionId;
    const CATEGORIES_ID = appwriteConfig.categoriesCollectionId;
    const RESTAURANTS_ID = appwriteConfig.restaurantCollectionId;

    const fetchRestaurant = async (accountId: string) => {
        const result = await databases.listDocuments(DB_ID, RESTAURANTS_ID, [
            Query.equal("ownerId", accountId),
        ]);
        return result.documents[0] ?? null;
    };

    const fetchCategories = async (restaurantId: string) => {
        const result = await databases.listDocuments(DB_ID, CATEGORIES_ID, [
            Query.equal("restaurantId", restaurantId),
        ]);
        return result.documents as unknown as Category[];
    };

    const fetchMenuItems = async (restaurantId: string) => {
        const result = await databases.listDocuments(DB_ID, MENU_ID, [
            Query.equal("restaurantId", restaurantId),
        ]);
        return result.documents as unknown as MenuItem[];
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            const restaurant = await fetchRestaurant(user.accountId);
            if (!restaurant) throw new Error("No restaurant found");

            setCurrentRestaurantId(restaurant.$id);

            const [cats, items] = await Promise.all([
                fetchCategories(restaurant.$id),
                fetchMenuItems(restaurant.$id),
            ]);

            setCategories(cats);
            setMenuItems(items);
        } catch (err) {
            console.error("Load error:", err);
            Alert.alert("Error", (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return {
        menuItems,
        categories,
        loading,
        currentRestaurantId,
        setLoading,
        loadData,
    };
};