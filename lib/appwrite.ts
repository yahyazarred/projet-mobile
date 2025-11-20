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
    ordersCollectionId: "691b75f50037cf051770",
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
        console.log("🟢 getCurrentUser called");
        const currentAccount = await account.get();
        console.log("🟢 Current Appwrite account:", currentAccount);
        if (!currentAccount) throw new Error("No account found");

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        console.log("🟢 Current user document:", currentUser.documents[0]);
        return currentUser.documents[0];
    } catch (e) {
        console.error("❌ Get current user error:", e);
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
export const getMenu = async ({ category, query, limit }: GetMenuParams & { limit?: number }) => {
    try {
        console.log("🔍 ========== GET MENU STARTED ==========");
        console.log("🔍 Params:", { category, query, limit });

        const queries: string[] = [Query.orderDesc("$createdAt")];

        if (limit) {
            queries.push(Query.limit(limit));
        }

        if (category) {
            queries.push(Query.equal("categories", category));
            console.log("🔍 Filtering by category:", category);
        }

        if (query) {
            queries.push(Query.search("name", query));
            console.log("🔍 Searching for:", query);
        }

        console.log("🔍 Database ID:", appwriteConfig.databaseId);
        console.log("🔍 Collection ID:", appwriteConfig.menuCollectionId);

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries
        );

        console.log("✅ Menu items fetched:", menus.documents.length);

        // ⚠️ CRITICAL: Check if restaurantId exists in menu items
        if (menus.documents.length > 0) {
            const firstItem = menus.documents[0];
            console.log("📋 First menu item structure:", {
                id: firstItem.$id,
                name: firstItem.name,
                restaurantId: firstItem.restaurantId, // ⚠️ CHECK THIS!
                categories: firstItem.categories,
                price: firstItem.price
            });

            if (!firstItem.restaurantId) {
                console.error("❌ ========== CRITICAL ERROR ==========");
                console.error("❌ Menu items are missing 'restaurantId' field!");
                console.error("❌ This is why orders show 'unknown' restaurant!");
                console.error("❌ Fix: Add 'restaurantId' attribute to menu_items collection in Appwrite");
                console.error("❌ Then update existing menu items to include restaurantId");
                console.error("❌ =====================================");
            } else {
                console.log("✅ restaurantId found:", firstItem.restaurantId);
            }
        }

        console.log("🔍 ========== GET MENU COMPLETED ==========");
        return menus.documents;
    } catch (e) {
        console.error("❌ getMenu error:", e);
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
// Add these functions to your existing lib/appwrite.ts file

// ---------------- GET AVAILABLE ORDERS (for drivers) ----------------
export const getAvailableOrders = async () => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("status", "ready"),
                Query.isNull("deliveryAgentId"),
                Query.orderDesc("placedAt"),
                Query.limit(50),
            ]
        );
        return result.documents;
    } catch (e) {
        console.error("Get available orders error:", e);
        throw e;
    }
};

// ---------------- GET DRIVER DELIVERIES ----------------
export const getDriverDeliveries = async (driverId: string, includeCompleted = false) => {
    try {
        const queries = [
            Query.equal("deliveryAgentId", driverId),
            Query.orderDesc("placedAt"),
            Query.limit(50),
        ];

        if (!includeCompleted) {
            queries.push(Query.notEqual("status", "delivered"));
        }

        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            queries
        );
        return result.documents;
    } catch (e) {
        console.error("Get driver deliveries error:", e);
        throw e;
    }
};

// ---------------- GET DRIVER HISTORY ----------------
export const getDriverHistory = async (driverId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("deliveryAgentId", driverId),
                Query.equal("status", "delivered"),
                Query.orderDesc("deliveredAt"),
                Query.limit(100),
            ]
        );
        return result.documents;
    } catch (e) {
        console.error("Get driver history error:", e);
        throw e;
    }
};

// ---------------- ACCEPT DELIVERY ----------------
export const acceptDelivery = async (orderId: string, driverId: string) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            {
                deliveryAgentId: driverId,
                status: "out_for_delivery",
                pickedUpAt: new Date().toISOString(),
            }
        );
    } catch (e) {
        console.error("Accept delivery error:", e);
        throw e;
    }
};

// ---------------- MARK AS DELIVERED ----------------
export const markAsDelivered = async (orderId: string) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            {
                status: "delivered",
                deliveredAt: new Date().toISOString(),
            }
        );
    } catch (e) {
        console.error("Mark as delivered error:", e);
        throw e;
    }
};

// ---------------- GET DRIVER STATS ----------------
export const getDriverStats = async (driverId: string) => {
    try {
        // Get all completed deliveries
        const allDeliveries = await getDriverHistory(driverId);

        // Get today's deliveries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDeliveries = allDeliveries.filter((d: any) =>
            new Date(d.deliveredAt) >= today
        );

        // Get this week's deliveries
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekDeliveries = allDeliveries.filter((d: any) =>
            new Date(d.deliveredAt) >= weekAgo
        );

        // Calculate earnings (assuming $5 per delivery or use deliveryFee field if available)
        const todayEarnings = todayDeliveries.length * 5;
        const weekEarnings = weekDeliveries.length * 5;
        const totalEarnings = allDeliveries.length * 5;

        return {
            today: {
                deliveries: todayDeliveries.length,
                earnings: todayEarnings,
            },
            week: {
                deliveries: weekDeliveries.length,
                earnings: weekEarnings,
            },
            total: {
                deliveries: allDeliveries.length,
                earnings: totalEarnings,
            },
        };
    } catch (e) {
        console.error("Get driver stats error:", e);
        throw e;
    }
};
