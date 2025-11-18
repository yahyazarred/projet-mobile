import { Account, Avatars, Client, Databases, ID, Query, Storage } from "react-native-appwrite";
import { Category, GetMenuParams, MenuItem, SignInParams } from "@/type";

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
    ordersCollectionId: "691b75f50037cf051770",
};

// ---------------- CLIENT ----------------
const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

// ---------------- CREATE USER ----------------
export const createUser = async ({
                                     email,
                                     password,
                                     name,
                                     role = "customer",
                                     phone,
                                     vehicleType,
                                     licensePlate
                                 }: any) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (!newAccount) throw new Error("Account creation failed");

        // Immediately sign in
        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name);
        const userData: any = {
            email,
            name,
            role,
            accountId: newAccount.$id,
            avatar: avatarUrl
        };

        if (role === "driver") {
            userData.phone = phone;
            userData.vehicleType = vehicleType;
            userData.licensePlate = licensePlate;
        }

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            userData
        );
    } catch (e) {
        console.error("Create user error:", e);
        throw e;
    }
};

// ---------------- SIGN IN ----------------
export const signIn = async ({ email, password }: SignInParams) => {
    try {
        await account.createEmailPasswordSession(email, password);
        const currentAccount = await account.get();
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );
        return currentUser.documents[0] || null;
    } catch (e: any) {
        console.error("Sign-in error:", e.message || e);
        throw e;
    }
};

// ---------------- GET CURRENT USER ----------------
export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );
        return currentUser.documents[0] || null;
    } catch (e: any) {
        console.log("No active session or guest:", e.message);
        return null;
    }
};

// ---------------- LOGOUT ----------------
export const logout = async () => {
    try {
        await account.deleteSession("current");
        console.log("✅ Session deleted successfully");
    } catch (e: any) {
        console.log("✅ No active session to delete");
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
// ---------------- GET RESTAURANT BY OWNER ----------------
export const getRestaurantByOwner = async (ownerId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantCollectionId,
            [Query.equal("ownerId", ownerId)]
        );
        return result.documents[0] || null;
    } catch (e) {
        console.error("Get restaurant error:", e);
        throw e;
    }
};

// ---------------- UPDATE ORDER STATUS ----------------
export const updateOrderStatus = async (
    orderId: string,
    status: string,
    additionalData?: any
) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            { status, ...additionalData }
        );
    } catch (e) {
        console.error("Update order status error:", e);
        throw e;
    }
};

// ---------------- GET RESTAURANT ORDERS ----------------
export const getRestaurantOrders = async (restaurantId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("restaurantId", restaurantId),
                Query.orderDesc("placedAt"),
                Query.limit(100)
            ]
        );
        return result.documents;
    } catch (e) {
        console.error("Get restaurant orders error:", e);
        throw e;
    }
};


// ---------------- GET AVAILABLE DELIVERIES ----------------
// Get orders that are ready for pickup (status: "ready")
export const getAvailableDeliveries = async () => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("status", "ready"),
                Query.orderDesc("placedAt"),
                Query.limit(50)
            ]
        );
        return result.documents;
    } catch (e) {
        console.error("Get available deliveries error:", e);
        throw e;
    }
};

// ---------------- GET DRIVER DELIVERIES ----------------
// Get orders assigned to a specific driver
export const getDriverDeliveries = async (driverId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("driverId", driverId),
                Query.notEqual("status", "delivered"),
                Query.orderDesc("placedAt"),
                Query.limit(50)
            ]
        );
        return result.documents;
    } catch (e) {
        console.error("Get driver deliveries error:", e);
        throw e;
    }
};

// ---------------- GET DRIVER DELIVERY HISTORY ----------------
export const getDriverDeliveryHistory = async (driverId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("driverId", driverId),
                Query.equal("status", "delivered"),
                Query.orderDesc("deliveredAt"),
                Query.limit(100)
            ]
        );
        return result.documents;
    } catch (e) {
        console.error("Get driver history error:", e);
        throw e;
    }
};

// ---------------- ASSIGN DRIVER TO ORDER ----------------
export const assignDriverToOrder = async (orderId: string, driverId: string) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            {
                driverId,
                status: "picked_up",
                pickedUpAt: new Date().toISOString()
            }
        );
    } catch (e) {
        console.error("Assign driver error:", e);
        throw e;
    }
};

// ---------------- UPDATE DELIVERY STATUS ----------------
export const updateDeliveryStatus = async (
    orderId: string,
    status: "picked_up" | "on_the_way" | "delivered"
) => {
    try {
        const updateData: any = { status };

        if (status === "delivered") {
            updateData.deliveredAt = new Date().toISOString();
        } else if (status === "picked_up") {
            updateData.pickedUpAt = new Date().toISOString();
        }

        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            updateData
        );
    } catch (e) {
        console.error("Update delivery status error:", e);
        throw e;
    }
};

// ---------------- GET ORDER DETAILS ----------------
export const getOrderDetails = async (orderId: string) => {
    try {
        return await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId
        );
    } catch (e) {
        console.error("Get order details error:", e);
        throw e;
    }
};
