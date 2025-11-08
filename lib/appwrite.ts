import { Account, Avatars, Client, Databases, ID, Query, Storage } from "react-native-appwrite";
import { GetMenuParams, SignInParams } from "@/type";

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
};

const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: any) => {
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
                accountId: newAccount.$id,
                avatar: avatarUrl,
            }
        );
    } catch (e) {
        console.error("Create user error:", e);
        throw e;
    }
};

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        return await account.createEmailPasswordSession(email, password);
    } catch (e) {
        console.error("Sign-in error:", e);
        throw e;
    }
};

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

export const getMenu = async ({ category, query }: GetMenuParams) => {
    try {
        const queries: any[] = [];
        if (category) queries.push(Query.equal("categories", category));
        if (query) queries.push(Query.search("name", query));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries
        );

        return menus.documents;
    } catch (e) {
        console.error("Get menu error:", e);
        throw e;
    }
};

export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId
        );
        return categories.documents;
    } catch (e) {
        console.error("Get categories error:", e);
        throw e;
    }
};
