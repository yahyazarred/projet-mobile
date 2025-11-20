import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";

const DB_ID = appwriteConfig.databaseId;
const ORDERS_ID = appwriteConfig.ordersCollectionId;

export interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customizations?: string[];
}

export interface CreateOrderParams {
    restaurantId: string;
    items: OrderItem[];
    totalPrice: number;
    deliveryAddress: string;
    deliveryInstructions?: string;
    customerPhone?: string;
}

export const createOrder = async (params: CreateOrderParams) => {
    try {
        console.log("🚀 ========== CREATE ORDER STARTED ==========");

        const user = await getCurrentUser();
        if (!user) throw new Error("User not logged in");

        console.log("👤 Current user:", {
            id: user.$id,
            accountId: user.accountId,
            name: user.name,
            email: user.email
        });

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Match your exact database schema
        const orderData = {
            // Required fields
            orderNumber,
            customerId: user.accountId, // Using accountId as customerId
            customerName: user.name,
            customerPhone: params.customerPhone || user.phone || "N/A",
            restaurantId: params.restaurantId, // CRITICAL: This must match exactly
            items: JSON.stringify(params.items),
            status: "pending", // Initial status
            totalPrice: params.totalPrice,
            deliveryAddress: params.deliveryAddress,
            placedAt: new Date().toISOString(),

            // Optional fields
            deliveryInstructions: params.deliveryInstructions || "",
            deliveryFee: 5.00,

            // Fields that remain NULL initially - DON'T include them
            // driverId: null,
            // acceptedAt: null,
            // completedAt: null,
            // pickedUpAt: null,
            // deliveredAt: null,
            // deliveryAgentId: null,
        };

        console.log("📦 Creating order with data:", {
            orderNumber: orderData.orderNumber,
            customerId: orderData.customerId,
            restaurantId: orderData.restaurantId,
            status: orderData.status,
            totalPrice: orderData.totalPrice,
            itemsCount: params.items.length
        });

        console.log("🔍 Database IDs:", {
            databaseId: DB_ID,
            collectionId: ORDERS_ID
        });

        const newOrder = await databases.createDocument(
            DB_ID,
            ORDERS_ID,
            ID.unique(),
            orderData
        );

        console.log("✅ Order created successfully!");
        console.log("📋 Order details:", {
            id: newOrder.$id,
            orderNumber: newOrder.orderNumber,
            status: newOrder.status,
            restaurantId: newOrder.restaurantId,
            customerId: newOrder.customerId
        });

        console.log("🚀 ========== CREATE ORDER COMPLETED ==========");

        return newOrder;
    } catch (error) {
        console.error("❌ ========== CREATE ORDER FAILED ==========");
        console.error("❌ Error:", error);
        console.error("❌ Error message:", (error as any).message);
        console.error("❌ Error type:", (error as any).type);
        console.error("❌ Error code:", (error as any).code);
        throw error;
    }
};