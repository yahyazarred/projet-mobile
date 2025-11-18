// Add these types to your type.ts file or create a new deliveryTypes.ts

export interface DeliveryOrder {
    $id: string;
    $createdAt: string;
    customerId: string;
    restaurantId: string;
    driverId?: string;
    items: OrderItem[];
    totalAmount: number;
    status: "placed" | "confirmed" | "preparing" | "ready" | "picked_up" | "on_the_way" | "delivered" | "cancelled";
    deliveryAddress: string;
    customerName: string;
    customerPhone: string;
    restaurantName: string;
    restaurantAddress: string;
    placedAt: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    specialInstructions?: string;
}

export interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

export type DeliveryStatus = "available" | "assigned" | "picked_up" | "on_the_way" | "delivered";