// lib/orderService.ts
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
    deliveryAddress: string;  // Garde ça en anglais correct pour ton interface
    deliveryInstructions?: string;
    customerPhone?: string;
}

export const createOrder = async (params: CreateOrderParams) => {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("User not logged in");

        // Generate order number (e.g., ORD-20231115-001)
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const orderData = {
            orderNumber,
            customerId: user.accountId,
            customerName: user.name,
            customerPhone: params.customerPhone || user.phone || "",
            restaurantId: params.restaurantId,
            items: JSON.stringify(params.items), // Store items as JSON string
            status: "pending",
            totalPrice: params.totalPrice,
            deliveryAdress: params.deliveryAddress,  // ← CHANGÉ ICI (sans le 2ème 'e')
            deliveryInstructions: params.deliveryInstructions || "",
            placedAt: new Date().toISOString(),
        };

        const newOrder = await databases.createDocument(
            DB_ID,
            ORDERS_ID,
            ID.unique(),
            orderData
        );

        return newOrder;
    } catch (error) {
        console.error("Create order error:", error);
        throw error;
    }
};