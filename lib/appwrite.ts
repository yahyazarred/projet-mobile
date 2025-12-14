// Import Appwrite SDK modules for backend services
// Account: User authentication and account management
// Avatars: Generate user avatar images
// Client: Main Appwrite client for connecting to backend
// Databases: Database operations (CRUD)
// ID: Generate unique IDs for documents
// Models: TypeScript type definitions for Appwrite responses
// Query: Build database queries (filtering, sorting, searching)
// Storage: File storage operations
import {Account, Avatars, Client, Databases, ID, Models, Query, Storage} from "react-native-appwrite";
// Import custom TypeScript types for type safety
import {Category, GetMenuParams, MenuItem, SignInParams} from "@/type";

/**
 * Appwrite Configuration Object
 *
 * Contains all the IDs and settings needed to connect to your Appwrite backend.
 * These values are stored in environment variables for security.
 *
 * Key concepts:
 * - endpoint: URL of your Appwrite server
 * - projectId: Your specific project identifier
 * - platform: Package name for mobile app (Android/iOS)
 * - databaseId: The database where all collections are stored
 * - bucketId: Storage bucket for file uploads (images, etc.)
 * - Collection IDs: Identifiers for each data table (users, menu, orders, etc.)
 */
export const appwriteConfig = {
    // ! operator tells TypeScript "I'm sure this exists" (non-null assertion)
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform: "com.jsm.foodordering", // Android package name
    databaseId: "690eec0400324d34c0fd", // Main database ID
    bucketId: "690f2cab003a6a0c1732", // Storage bucket for images
    userCollectionId: "690eecfa00230183b929", // Users table
    categoriesCollectionId: "690f01430038609662f1", // Food categories table
    menuCollectionId: "690f022a0017c3ea19ac", // Menu items table
    customizationsCollectionId: "690f26a50011cee4d4e7", // Customization options table
    menuCustomizationsCollectionId: "690f28e9003ad689bf3a", // Links menu items to customizations
    restaurantCollectionId: "69199bdd000a4f0767ee", // Restaurants table
    ordersCollectionId: "691b75f50037cf051770", // Orders table
};

// Initialize the Appwrite client with configuration
// This creates the connection to your backend server
const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint) // Set server URL
    .setProject(appwriteConfig.projectId) // Set project ID
    .setPlatform(appwriteConfig.platform); // Set platform identifier

// Create service instances using the configured client
// These are used throughout the app to interact with Appwrite services
export const account = new Account(client); // For authentication (login, signup, logout)
export const databases = new Databases(client); // For database CRUD operations
export const storage = new Storage(client); // For file uploads/downloads
export const avatars = new Avatars(client); // For generating user avatars


const logError = (context: string, error: any) => {
    console.error(`❌ ${context}:`, {
        message: error?.message || 'Unknown error', // Error description
        code: error?.code, // Error code (if available)
        type: error?.type, // Error type classification
        status: error?.status, // HTTP status code (if applicable)
    });
};

// ===============================================================
// USER MANAGEMENT FUNCTIONS
// ===============================================================

/**
 * Create a New User Account
 *
 * This function does 3 things:
 * 1. Creates an Appwrite authentication account (for login)
 * 2. Signs the user in automatically
 * 3. Creates a user document in the database (stores additional user info)
 *
 * @param email - User's email address
 * @param password - User's password (must meet Appwrite security requirements)
 * @param name - User's display name
 * @param role - User type: "customer", "restaurant_owner", or "delivery_driver"
 * @returns The created user document from the database
 */
export const createUser = async ({ email, password, name, role = "customer" }: any) => {
    try {
        // Step 1: Create authentication account
        // ID.unique() generates a unique identifier automatically
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (!newAccount) throw new Error("Account creation failed");

        // Step 2: Sign in the newly created user
        await signIn({ email, password });

        // Step 3: Generate an avatar image with user's initials
        const avatarUrl = avatars.getInitialsURL(name);

        // Step 4: Create user document in database with additional info
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(), // Generate unique document ID
            {
                email,
                name,
                role, // Determines app permissions (customer/owner/driver)
                accountId: newAccount.$id, // Link to authentication account
                avatar: avatarUrl,
            }
        );
    } catch (e) {
        logError("Create user error", e);
        throw e; // Re-throw so calling code can handle it
    }
};

// ===============================================================
// RESTAURANT MANAGEMENT FUNCTIONS
// ===============================================================

/**
 * Create a New Restaurant
 *
 * Creates a restaurant document linked to a restaurant owner.
 * Only restaurant owners should be able to create restaurants.
 *
 * @param ownerId - The user ID of the restaurant owner
 * @param name - Restaurant name
 * @param description - Restaurant description
 * @param photo - Restaurant photo URL
 * @returns The created restaurant document
 */
export const createRestaurant = async ({
                                           ownerId,
                                           name,
                                           description,
                                           photo,
                                       }: {
    ownerId: string;
    name: string;
    description: string;
    photo: string;
}) => {
    try {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantCollectionId,
            ID.unique(),
            {
                ownerId, // Links restaurant to owner account
                name,
                description,
                photo,
            }
        );
    } catch (e) {
        logError("Create restaurant error", e);
        throw e;
    }
};

/**
 * Get All Restaurants
 *
 * Fetches all restaurants from the database.
 * Used to display restaurant list to customers.
 *
 * @returns Array of restaurant documents with photo URLs
 */
export const getRestaurants = async () => {
    try {
        // listDocuments fetches all documents from a collection
        const res = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantCollectionId
        );

        // Transform the data to ensure photo URLs are properly formatted
        // map() creates a new array with modified objects
        return res.documents.map(doc => ({
            ...doc, // Spread operator copies all existing properties
            photoUrl: doc.photo, // Add photoUrl property for consistency
        }));
    } catch (e) {
        logError("Get restaurants error", e);
        return []; // Return empty array if error (prevents app crash)
    }
};

/**
 * Get Restaurant by Owner ID
 *
 * Finds the restaurant owned by a specific user.
 * Used when restaurant owner logs in to manage their restaurant.
 *
 * @param ownerId - The user ID of the restaurant owner
 * @returns Restaurant document or null if not found
 */
export const getRestaurantByOwner = async (ownerId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantCollectionId,
            // Query.equal filters documents where ownerId matches the parameter
            [Query.equal("ownerId", ownerId)]
        );
        // Return first result or null if no restaurant found
        return result.documents[0] || null;
    } catch (e) {
        logError("Get restaurant error", e);
        throw e;
    }
};

// ===============================================================
// CATEGORY MANAGEMENT FUNCTIONS
// ===============================================================

/**
 * Create a Food Category
 *
 * Creates a category for organizing menu items (e.g., "Pizza", "Burgers", "Desserts").
 * Each category belongs to a specific restaurant.
 *
 * @param name - Category name
 * @param description - Category description
 * @param restaurantId - ID of the restaurant this category belongs to
 * @returns The created category document
 */
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
                restaurantId, // Links category to restaurant
            }
        );
    } catch (e) {
        logError("Create category error", e);
        throw e;
    }
};

/**
 * Get All Categories
 *
 * Fetches all food categories from the database.
 * Used to display category filters in the menu.
 *
 * @returns Array of category documents
 */
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

// ===============================================================
// AUTHENTICATION FUNCTIONS
// ===============================================================

/**
 * Sign In User
 *
 * Authenticates user with email and password.
 * Creates a session that keeps the user logged in.
 *
 * @param email - User's email
 * @param password - User's password
 * @returns Session object if successful
 */
export const signIn = async ({ email, password }: SignInParams) => {
    try {
        // Creates an email/password session (login)
        return await account.createEmailPasswordSession(email, password);
    } catch (e) {
        logError("Sign-in error", e);
        throw e;
    }
};

/**
 * Get Currently Logged In User
 *
 * This function does 2 things:
 * 1. Gets the current Appwrite authentication account
 * 2. Fetches the corresponding user document from database (with role, name, etc.)
 *
 * Why separate? The auth account only has basic info (email, id).
 * The database document has additional info (role, avatar, preferences, etc.)
 *
 * @returns User document with all user information
 */
export const getCurrentUser = async () => {
    try {
        console.log("🟢 getCurrentUser called");

        // Step 1: Get the authenticated account
        const currentAccount = await account.get();
        console.log("🟢 Current Appwrite account ID:", currentAccount.$id);
        if (!currentAccount) throw new Error("No account found");

        // Step 2: Find the user document using the account ID
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            // Filter: Find document where accountId matches the auth account ID
            [Query.equal("accountId", currentAccount.$id)]
        );

        console.log("🟢 Found user documents:", currentUser.documents.length);
        return currentUser.documents[0]; // Return the first (and should be only) match
    } catch (e) {
        // This was previously causing crashes - now safely logged
        logError("Get current user error", e);
        throw e;
    }
};

/**
 * Logout User
 *
 * Deletes the current session, logging the user out.
 * "current" refers to the active session.
 */
export const logout = async () => {
    try {
        await account.deleteSession("current");
    } catch (e) {
        logError("Logout error", e);
        throw e;
    }
};

/**
 * Update User Information
 *
 * Updates user document in the database (not the auth account).
 * Used to update profile info, preferences, etc.
 *
 * @param userId - Document ID of the user to update
 * @param data - Object containing fields to update
 * @returns Updated user document
 */
export const updateUser = async (userId: string, data: any) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userId,
            data // Can include any fields: { name: "New Name", avatar: "url", etc. }
        );
    } catch (e) {
        logError("Update user error", e);
        throw e;
    }
};

// ===============================================================
// MENU MANAGEMENT FUNCTIONS
// ===============================================================

/**
 * Get Menu Items with Filters
 *
 * Fetches menu items from database with optional filtering and searching.
 * Supports:
 * - Filtering by category (e.g., show only "Pizza" items)
 * - Searching by name (e.g., search for "pepperoni")
 * - Limiting number of results
 *
 * @param category - Optional category ID to filter by
 * @param query - Optional search term to search menu item names
 * @param limit - Optional maximum number of results to return
 * @returns Array of menu item documents
 */
export const getMenu = async ({ category, query, limit }: GetMenuParams & { limit?: number }) => {
    try {
        console.log("🔍 ========== GET MENU STARTED ==========");
        console.log("🔍 Params:", { category, query, limit });

        // Build array of query conditions
        // Query.orderDesc sorts results by creation date (newest first)
        const queries: string[] = [Query.orderDesc("$createdAt")];

        // Add limit if specified (controls how many items to return)
        if (limit) {
            queries.push(Query.limit(limit));
        }

        // Add category filter if specified
        if (category) {
            // Query.equal filters items where categories field matches the category ID
            queries.push(Query.equal("categories", category));
            console.log("🔍 Filtering by category:", category);
        }

        // Add search query if specified
        if (query) {
            // Query.search performs text search on the "name" field
            queries.push(Query.search("name", query));
            console.log("🔍 Searching for:", query);
        }

        // Execute the query with all conditions
        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries // Array of query conditions built above
        );

        console.log("✅ Menu items fetched:", menus.documents.length);

        // Debug logging: Check structure of first item
        if (menus.documents.length > 0) {
            const firstItem = menus.documents[0];
            console.log("📋 First menu item structure:", {
                id: firstItem.$id,
                name: firstItem.name,
                restaurantId: firstItem.restaurantId,
                categories: firstItem.categories,
                price: firstItem.price
            });

            // Verify that restaurantId exists (important for filtering/display)
            if (!firstItem.restaurantId) {
                console.error("❌ Menu items are missing 'restaurantId' field!");
            }
        }

        console.log("🔍 ========== GET MENU COMPLETED ==========");
        return menus.documents;
    } catch (e) {
        logError("getMenu error", e);
        throw new Error(e as string);
    }
};

// ===============================================================
// ORDER MANAGEMENT FUNCTIONS
// ===============================================================

/**
 * Update Order Status
 *
 * Changes the status of an order (e.g., "pending" → "preparing" → "ready").
 * Can also update additional fields like timestamps.
 *
 * @param orderId - Document ID of the order to update
 * @param status - New status value ("pending", "preparing", "ready", "out_for_delivery", "delivered")
 * @param additionalData - Optional additional fields to update
 * @returns Updated order document
 */
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
            // Spread operator merges status with any additional data
            { status, ...additionalData }
        );
    } catch (e) {
        logError("Update order status error", e);
        throw e;
    }
};

/**
 * Get Restaurant Orders
 *
 * Fetches all orders for a specific restaurant.
 * Used by restaurant owners to see incoming orders.
 *
 * @param restaurantId - ID of the restaurant
 * @returns Array of order documents sorted by most recent first
 */
export const getRestaurantOrders = async (restaurantId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("restaurantId", restaurantId), // Filter: Only this restaurant's orders
                Query.orderDesc("placedAt"), // Sort: Newest orders first
                Query.limit(100) // Limit: Maximum 100 orders
            ]
        );
        return result.documents;
    } catch (e) {
        logError("Get restaurant orders error", e);
        throw e;
    }
};

// ===============================================================
// DELIVERY DRIVER FUNCTIONS
// ===============================================================

/**
 * Get Available Orders for Delivery
 *
 * Fetches orders that are ready for pickup and don't have a driver yet.
 * Used by delivery drivers to find available delivery jobs.
 *
 * Conditions:
 * - Status is "ready" (restaurant finished preparing)
 * - No driver assigned yet (deliveryAgentId is null)
 *
 * @returns Array of available order documents
 */
export const getAvailableOrders = async () => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("status", "ready"), // Only orders ready for pickup
                Query.isNull("deliveryAgentId"), // No driver assigned yet
                Query.orderDesc("placedAt"), // Show oldest ready orders first (fair queue)
                Query.limit(50), // Maximum 50 orders to prevent overwhelming UI
            ]
        );
        return result.documents;
    } catch (e) {
        logError("Get available orders error", e);
        throw e;
    }
};

/**
 * Get Driver's Active and Past Deliveries
 *
 * Fetches orders assigned to a specific driver.
 * Can include or exclude completed deliveries.
 *
 * @param driverId - ID of the delivery driver
 * @param includeCompleted - If true, includes delivered orders. If false, only active deliveries
 * @returns Array of order documents assigned to this driver
 */
export const getDriverDeliveries = async (driverId: string, includeCompleted = false) => {
    try {
        const queries = [
            Query.equal("deliveryAgentId", driverId), // Filter: Only this driver's orders
            Query.orderDesc("placedAt"), // Sort: Most recent first
            Query.limit(50),
        ];

        // If not including completed, filter out "delivered" status
        if (!includeCompleted) {
            // Query.notEqual excludes orders with status "delivered"
            queries.push(Query.notEqual("status", "delivered"));
        }

        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            queries
        );
        return result.documents;
    } catch (e) {
        logError("Get driver deliveries error", e);
        throw e;
    }
};

/**
 * Get Driver's Delivery History
 *
 * Fetches all completed deliveries for a driver.
 * Used to show past deliveries and calculate statistics.
 *
 * @param driverId - ID of the delivery driver
 * @returns Array of completed order documents
 */
export const getDriverHistory = async (driverId: string) => {
    try {
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal("deliveryAgentId", driverId), // Filter: This driver's orders
                Query.equal("status", "delivered"), // Filter: Only completed deliveries
                Query.orderDesc("deliveredAt"), // Sort: Most recently delivered first
                Query.limit(100),
            ]
        );
        return result.documents;
    } catch (e) {
        logError("Get driver history error", e);
        throw e;
    }
};

/**
 * Accept a Delivery Job
 *
 * Assigns a driver to an order and updates status to "out for delivery".
 * Records the pickup time.
 *
 * @param orderId - ID of the order to accept
 * @param driverId - ID of the driver accepting the order
 * @returns Updated order document
 */
export const acceptDelivery = async (orderId: string, driverId: string) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            {
                deliveryAgentId: driverId, // Assign driver to order
                status: "out_for_delivery", // Update status
                pickedUpAt: new Date().toISOString(), // Record pickup time in ISO format
            }
        );
    } catch (e) {
        logError("Accept delivery error", e);
        throw e;
    }
};

/**
 * Mark Order as Delivered
 *
 * Updates order status to "delivered" and records delivery time.
 * Called when driver confirms successful delivery.
 *
 * @param orderId - ID of the order that was delivered
 * @returns Updated order document
 */
export const markAsDelivered = async (orderId: string) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            {
                status: "delivered", // Mark as complete
                deliveredAt: new Date().toISOString(), // Record delivery time
            }
        );
    } catch (e) {
        logError("Mark as delivered error", e);
        throw e;
    }
};

/**
 * Get Driver Statistics and Earnings
 *
 * Calculates driver performance metrics:
 * - Today's deliveries and earnings
 * - This week's deliveries and earnings
 * - Total all-time deliveries and earnings
 *
 * Earnings calculation: $5 per delivery (simplified model)
 *
 * @param driverId - ID of the driver
 * @returns Object with today/week/total statistics
 */
export const getDriverStats = async (driverId: string) => {
    try {
        // Get all completed deliveries for this driver
        const allDeliveries = await getDriverHistory(driverId);

        // Calculate today's deliveries
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day (midnight)
        const todayDeliveries = allDeliveries.filter((d: any) =>
            new Date(d.deliveredAt) >= today // Filter deliveries from today onwards
        );

        // Calculate this week's deliveries
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const weekDeliveries = allDeliveries.filter((d: any) =>
            new Date(d.deliveredAt) >= weekAgo // Filter deliveries from past 7 days
        );

        // Calculate earnings ($5 per delivery)
        const todayEarnings = todayDeliveries.length * 5;
        const weekEarnings = weekDeliveries.length * 5;
        const totalEarnings = allDeliveries.length * 5;

        // Return structured statistics object
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
        logError("Get driver stats error", e);
        throw e;
    }
};