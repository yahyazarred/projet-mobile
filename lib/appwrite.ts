import {Account, Avatars, Client, Databases, ID, Models, Query, Storage} from "react-native-appwrite";
import {Category, GetMenuParams, MenuItem, SignInParams} from "@/type";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform: "com.jsm.foodordering",
    databaseId: "690eec0400324d34c0fd",
    bucketId: "690f2cab003a6a0c1732",
    userCollectionId: "690eecfa00230183b929",
    categoriesCollectionId: "690f01430038609662f1",
    menuCollectionId: "690f022a0017c3ea19ac",
    customizationsCollectionId: "690f26a50011cee4d4e7",
    menuCustomizationsCollectionId: "690f28e9003ad689bf3a",
    restaurantCollectionId: "69199bdd000a4f0767ee",

};

const client = new Client();
client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId).setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

// ---------------- CREATE USER ----------------
export const createUser = async ({ email, password, name, role = "customer" }: any) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (!newAccount) throw new Error("Account creation failed");

        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name);

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                email,
                name,
                role,
                accountId: newAccount.$id,
                avatar: avatarUrl,
            }
        );
    } catch (e) {
        console.error("Create user error:", e);
        throw e;
    }
};

// ---------------- CREATE RESTAURANT ----------------
export const createRestaurant = async ({
                                           ownerId,
                                           name,
                                           description,
                                       }: {
    ownerId: string;
    name: string;
    description: string;
}) => {
    try {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantCollectionId, // MUST be the correct ID
            ID.unique(),
            {
                ownerId,
                name,
                description,
            }
        );
    } catch (e) {
        console.error("Create restaurant error:", e);
        throw e;
    }
};

// ---------------- CREATE CATEGORY ----------------
export const createCategory = async ({
                                         name,
                                         description,
                                         restaurantId,
                                     }: {
    name: string;
    description: string;
    restaurantId: string;
}) => {
    try {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
            ID.unique(),
            {
                name,
                description,
                restaurantId,
            }
        );
    } catch (e) {
        console.error("Create category error:", e);
        throw e;
    }
};

// ---------------- SIGN IN ----------------
export const signIn = async ({ email, password }: SignInParams) => {
    try {
        return await account.createEmailPasswordSession(email, password);
    } catch (e) {
        console.error("Sign-in error:", e);
        throw e;
    }
};

// ---------------- GET CURRENT USER ----------------
export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw new Error("No account found");

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        return currentUser.documents[0];
    } catch (e) {
        console.error("Get current user error:", e);
        throw e;
    }
};

// ---------------- LOGOUT ----------------
export const logout = async () => {
    try {
        await account.deleteSession("current");
    } catch (e) {
        console.error("Logout error:", e);
        throw e;
    }
};

// ---------------- UPDATE USER ----------------
export const updateUser = async (userId: string, data: any) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userId,
            data
        );
    } catch (e) {
        console.error("Update user error:", e);
        throw e;
    }
};

// ---------------- GET MENU ----------------
export const getMenu = async ({ category, query }: GetMenuParams) => {
    try {
        const queries: string[] = [];

        if (category) queries.push(Query.equal("categories", category));
        if (query) queries.push(Query.search("name", query));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries
        );

        return menus.documents;
    } catch (e) {
        throw new Error(e as string);
    }
};

// ---------------- GET CATEGORIES ----------------
export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId
        );

        return categories.documents;
    } catch (e) {
        throw new Error(e as string);
    }
};
