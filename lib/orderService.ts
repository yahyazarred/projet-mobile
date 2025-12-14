/**
 * Order Service Module
 *
 * This module handles order creation for the food ordering app.
 * When a customer checks out from their cart, this service creates
 * an order record in the database.
 *
 * Order Flow:
 * 1. Customer adds items to cart
 * 2. Customer proceeds to checkout
 * 3. This service creates order with status "pending"
 * 4. Restaurant receives order and updates status
 * 5. Delivery driver picks up and delivers
 */

// Import ID generator from Appwrite SDK
import { ID } from "react-native-appwrite";
// Import Appwrite services and configuration
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";

// Store frequently used IDs in constants
const DB_ID = appwriteConfig.databaseId;
const ORDERS_ID = appwriteConfig.ordersCollectionId;

/**
 * OrderItem Interface
 *
 * Defines the structure of a single item in an order.
 * An order can contain multiple items (e.g., 2 pizzas, 1 drink, 1 dessert).
 */
export interface OrderItem {
    menuItemId: string;        // ID of the menu item being ordered
    name: string;              // Name of the item (for display purposes)
    price: number;             // Price per unit
    quantity: number;          // How many of this item
    customizations?: string[]; // Optional customizations (e.g., "Extra cheese", "No onions")
}

/**
 * CreateOrderParams Interface
 *
 * Defines all the data needed to create a new order.
 * This is the data passed from the checkout screen.
 */
export interface CreateOrderParams {
    restaurantId: string;           // Which restaurant the order is for
    items: OrderItem[];             // Array of items being ordered
    totalPrice: number;             // Total cost of order (sum of all items)
    deliveryAddress: string;        // Where to deliver the order
    deliveryInstructions?: string;  // Optional delivery notes (e.g., "Ring doorbell twice")
    customerPhone?: string;         // Optional phone number (fallback to user's stored phone)
}

/**
 * Create a New Order
 *
 * This function handles the complete order creation process:
 * 1. Gets the current logged-in user
 * 2. Generates a unique order number
 * 3. Prepares order data matching database schema
 * 4. Creates the order document in database
 * 5. Returns the created order
 *
 * Important Notes:
 * - Order starts with status "pending" (waiting for restaurant confirmation)
 * - Items are stored as JSON string (Appwrite doesn't support array of objects directly)
 * - Null fields are NOT included (Appwrite handles them automatically)
 *
 * @param params - Order details from checkout screen
 * @returns The created order document
 * @throws Error if user not logged in or database operation fails
 */
export const createOrder = async (params: CreateOrderParams) => {
    try {
        // Debug logging with clear visual separator
        console.log(" ========== CREATE ORDER STARTED ==========");

        // Step 1: Get current logged-in user
        // This ensures order is linked to the correct customer
        const user = await getCurrentUser();
        if (!user) throw new Error("User not logged in");

        // Log user details for debugging
        console.log("👤 Current user:", {
            id: user.$id,           // Database document ID
            accountId: user.accountId, // Authentication account ID
            name: user.name,
            email: user.email
        });

        // Step 2: Generate unique order number
        // Format: ORD-{timestamp}-{random3digits}
        // Example: "ORD-1703456789123-456"
        // - Timestamp ensures uniqueness across time
        // - Random number prevents collisions within same millisecond
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Step 3: Prepare order data matching exact database schema
        // CRITICAL: Field names must match database column names exactly
        const orderData = {
            // === REQUIRED FIELDS ===

            orderNumber, // Unique identifier visible to users

            // Customer information
            customerId: user.accountId, // Link to auth account (used for querying user's orders)
            customerName: user.name,     // Display name for restaurant
            // Fallback chain: use provided phone → stored phone → "N/A"
            customerPhone: params.customerPhone || user.phone || "N/A",

            // Restaurant information
            restaurantId: params.restaurantId, // CRITICAL: Must match restaurant document ID

            // Order details
            // JSON.stringify converts array of objects to string (Appwrite requirement)
            items: JSON.stringify(params.items),
            totalPrice: params.totalPrice, // Total cost including all items

            // Order status and timestamps
            status: "pending", // Initial status (restaurant hasn't confirmed yet)
            placedAt: new Date().toISOString(), // When order was created (ISO format for consistency)

            // Delivery information
            deliveryAddress: params.deliveryAddress,
            deliveryInstructions: params.deliveryInstructions || "", // Empty string if not provided
            deliveryFee: 5.00, // Fixed delivery fee (could be dynamic in production)

            // === NULL FIELDS ===
            // These fields start as null and are filled later in the order lifecycle
            // We DON'T include them here - Appwrite sets them to null automatically
            //
            // driverId: null,          // Set when driver accepts delivery
            // acceptedAt: null,        // Set when restaurant accepts order
            // completedAt: null,       // Set when order is fully completed
            // pickedUpAt: null,        // Set when driver picks up order
            // deliveredAt: null,       // Set when driver delivers order
            // deliveryAgentId: null,   // Set when driver is assigned
        };

        // Log order data summary for debugging (not full data to keep logs clean)
        console.log("📦 Creating order with data:", {
            orderNumber: orderData.orderNumber,
            customerId: orderData.customerId,
            restaurantId: orderData.restaurantId,
            status: orderData.status,
            totalPrice: orderData.totalPrice,
            itemsCount: params.items.length // Number of different items (not total quantity)
        });

        // Log database IDs to verify correct collections are being used
        console.log("🔍 Database IDs:", {
            databaseId: DB_ID,
            collectionId: ORDERS_ID
        });

        // Step 4: Create the order document in Appwrite database
        const newOrder = await databases.createDocument(
            DB_ID,          // Which database
            ORDERS_ID,      // Which collection (orders table)
            ID.unique(),    // Generate unique document ID
            orderData       // The order data prepared above
        );

        // Step 5: Log success and order details
        console.log("✅ Order created successfully!");
        console.log("📋 Order details:", {
            id: newOrder.$id,                   // Document ID (internal)
            orderNumber: newOrder.orderNumber,  // Order number (user-facing)
            status: newOrder.status,
            restaurantId: newOrder.restaurantId,
            customerId: newOrder.customerId
        });

        console.log("🚀 ========== CREATE ORDER COMPLETED ==========");

        // Return the complete order document
        // Calling code can use this to:
        // - Show confirmation screen
        // - Navigate to order tracking
        // - Display order number to user
        return newOrder;

    } catch (error) {
        // Comprehensive error logging for debugging
        console.error("❌ ========== CREATE ORDER FAILED ==========");
        console.error("❌ Error:", error); // Raw error object
        console.error("❌ Error message:", (error as any).message); // Error description
        console.error("❌ Error type:", (error as any).type); // Error classification
        console.error("❌ Error code:", (error as any).code); // Error code (if available)

        // Re-throw error so calling code can handle it
        // (e.g., show error message to user, enable retry button)
        throw error;
    }
};