import { Account, Avatars, Client, Databases, ID, Query } from "react-native-appwrite";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform: "com.jsm.foodordering",
    databaseId: "690eec0400324d34c0fd",
    userCollectionId: "690eecfa00230183b929",
};

const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const avatars = new Avatars(client);

// ---------- Auth ----------

export const createUser = async ({ email, password, name }: any) => {
    const newAccount = await account.create(ID.unique(), email, password, name);

    // Sign in immediately after signup
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
};

export const signIn = async ({ email, password }: { email: string; password: string }) => {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
};

export const logout = async () => {
    try {
        await account.deleteSession("current");
    } catch (e) {
        console.error("Logout error:", e);
        throw e;
    }
};

// ---------- User ----------

export const getCurrentUser = async () => {
    try {
        // Ensure session exists
        const session = await account.getSession("current");
        if (!session) throw new Error("No active session");

        const currentAccount = await account.get();
        const userDoc = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        if (!userDoc.documents[0]) throw new Error("User document not found");

        return userDoc.documents[0];
    } catch (e) {
        console.error("Get current user error:", e);
        throw e;
    }
};

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
