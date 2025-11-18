// lib/realtimeService.ts
import { Client } from "react-native-appwrite";
import { appwriteConfig } from "@/lib/appwrite";
import { Platform } from "react-native";

// Create a new client instance for realtime subscriptions
const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

// Check if we're running on web - Appwrite Realtime has issues on web
const isWeb = Platform.OS === "web";

if (isWeb) {
    console.warn(
        "⚠️ Appwrite Realtime is not fully supported on web. Using polling fallback."
    );
}

interface RealtimeEvent {
    type: "create" | "update" | "delete";
    order: any;
    isAvailable?: boolean;
}

type OrderEventCallback = (payload: RealtimeEvent) => void;

interface RealtimeResponse {
    events: string[];
    payload: any;
}

class RealtimeService {
    private subscriptions: Map<string, () => void> = new Map();
    private pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
    private lastOrderData: Map<string, any> = new Map();

    /**
     * Subscribe to real-time order updates for a specific restaurant
     */
    subscribeToRestaurantOrders(restaurantId: string, callback: OrderEventCallback) {
        const channelId = `restaurant-${restaurantId}`;

        if (this.subscriptions.has(channelId)) {
            console.log("Already subscribed to restaurant orders");
            return () => this.unsubscribe(channelId);
        }

        // Use polling for web, realtime for native
        if (isWeb) {
            return this.pollRestaurantOrders(restaurantId, callback, channelId);
        }

        const unsubscribe = client.subscribe(
            [
                `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.ordersCollectionId}.documents`,
            ],
            (response: RealtimeResponse) => {
                const events = response.events;
                const payload = response.payload as any;

                if (payload.restaurantId === restaurantId) {
                    const eventType = this.getEventType(events);

                    console.log(`[Restaurant ${restaurantId}] Order ${eventType}:`, payload.$id);

                    callback({
                        type: eventType,
                        order: payload,
                    });
                }
            }
        );

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Subscribed to restaurant orders: ${restaurantId}`);

        return () => this.unsubscribe(channelId);
    }

    /**
     * Subscribe to real-time delivery updates for a specific driver
     */
    subscribeToDriverDeliveries(driverId: string, callback: OrderEventCallback) {
        const channelId = `driver-${driverId}`;

        if (this.subscriptions.has(channelId)) {
            console.log("Already subscribed to driver deliveries");
            return () => this.unsubscribe(channelId);
        }

        // Use polling for web, realtime for native
        if (isWeb) {
            return this.pollDriverDeliveries(driverId, callback, channelId);
        }

        const unsubscribe = client.subscribe(
            [
                `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.ordersCollectionId}.documents`,
            ],
            (response: RealtimeResponse) => {
                const events = response.events;
                const payload = response.payload as any;

                const isDriverOrder = payload.driverId === driverId;
                const isAvailable = payload.status === "ready" && !payload.driverId;

                if (isDriverOrder || isAvailable) {
                    const eventType = this.getEventType(events);

                    console.log(`[Driver ${driverId}] Order ${eventType}:`, payload.$id);

                    callback({
                        type: eventType,
                        order: payload,
                        isAvailable,
                    });
                }
            }
        );

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Subscribed to driver deliveries: ${driverId}`);

        return () => this.unsubscribe(channelId);
    }

    /**
     * Subscribe to real-time updates for a specific customer's orders
     */
    subscribeToCustomerOrders(customerId: string, callback: OrderEventCallback) {
        const channelId = `customer-${customerId}`;

        if (this.subscriptions.has(channelId)) {
            console.log("Already subscribed to customer orders");
            return () => this.unsubscribe(channelId);
        }

        // Use polling for web, realtime for native
        if (isWeb) {
            return this.pollCustomerOrders(customerId, callback, channelId);
        }

        const unsubscribe = client.subscribe(
            [
                `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.ordersCollectionId}.documents`,
            ],
            (response: RealtimeResponse) => {
                const events = response.events;
                const payload = response.payload as any;

                if (payload.customerId === customerId) {
                    const eventType = this.getEventType(events);

                    console.log(`[Customer ${customerId}] Order ${eventType}:`, payload.$id);

                    callback({
                        type: eventType,
                        order: payload,
                    });
                }
            }
        );

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Subscribed to customer orders: ${customerId}`);

        return () => this.unsubscribe(channelId);
    }

    /**
     * Subscribe to a specific order (for real-time tracking)
     */
    subscribeToOrder(orderId: string, callback: OrderEventCallback) {
        const channelId = `order-${orderId}`;

        if (this.subscriptions.has(channelId)) {
            console.log("Already subscribed to this order");
            return () => this.unsubscribe(channelId);
        }

        // Use polling for web, realtime for native
        if (isWeb) {
            return this.pollOrder(orderId, callback, channelId);
        }

        const unsubscribe = client.subscribe(
            [
                `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.ordersCollectionId}.documents.${orderId}`,
            ],
            (response: RealtimeResponse) => {
                const events = response.events;
                const payload = response.payload as any;
                const eventType = this.getEventType(events);

                console.log(`[Order ${orderId}] ${eventType}`);

                callback({
                    type: eventType,
                    order: payload,
                });
            }
        );

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Subscribed to order: ${orderId}`);

        return () => this.unsubscribe(channelId);
    }

    /**
     * Polling fallback methods for web platform
     */
    private async pollRestaurantOrders(
        restaurantId: string,
        callback: OrderEventCallback,
        channelId: string
    ): Promise<() => void> {
        const { databases } = await import("@/lib/appwrite");
        const { Query } = await import("react-native-appwrite");

        const poll = async () => {
            try {
                const result = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.ordersCollectionId,
                    [Query.equal("restaurantId", restaurantId), Query.limit(100)]
                );

                this.checkForChanges(channelId, result.documents, callback);
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        // Initial fetch
        await poll();

        // Poll every 5 seconds
        const interval = setInterval(poll, 5000);
        this.pollingIntervals.set(channelId, interval);

        const unsubscribe = () => {
            const interval = this.pollingIntervals.get(channelId);
            if (interval) {
                clearInterval(interval);
                this.pollingIntervals.delete(channelId);
            }
            this.lastOrderData.delete(channelId);
        };

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Polling restaurant orders: ${restaurantId} (Web fallback)`);

        return unsubscribe;
    }

    private async pollDriverDeliveries(
        driverId: string,
        callback: OrderEventCallback,
        channelId: string
    ): Promise<() => void> {
        const { databases } = await import("@/lib/appwrite");
        const { Query } = await import("react-native-appwrite");

        const poll = async () => {
            try {
                const [activeOrders, availableOrders] = await Promise.all([
                    databases.listDocuments(
                        appwriteConfig.databaseId,
                        appwriteConfig.ordersCollectionId,
                        [Query.equal("driverId", driverId), Query.limit(50)]
                    ),
                    databases.listDocuments(
                        appwriteConfig.databaseId,
                        appwriteConfig.ordersCollectionId,
                        [Query.equal("status", "ready"), Query.limit(50)]
                    ),
                ]);

                const allOrders = [
                    ...activeOrders.documents,
                    ...availableOrders.documents.filter((o: any) => !o.driverId),
                ];

                this.checkForChanges(channelId, allOrders, callback, true);
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        await poll();
        const interval = setInterval(poll, 5000);
        this.pollingIntervals.set(channelId, interval);

        const unsubscribe = () => {
            const interval = this.pollingIntervals.get(channelId);
            if (interval) {
                clearInterval(interval);
                this.pollingIntervals.delete(channelId);
            }
            this.lastOrderData.delete(channelId);
        };

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Polling driver deliveries: ${driverId} (Web fallback)`);

        return unsubscribe;
    }

    private async pollCustomerOrders(
        customerId: string,
        callback: OrderEventCallback,
        channelId: string
    ): Promise<() => void> {
        const { databases } = await import("@/lib/appwrite");
        const { Query } = await import("react-native-appwrite");

        const poll = async () => {
            try {
                const result = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.ordersCollectionId,
                    [Query.equal("customerId", customerId), Query.limit(50)]
                );

                this.checkForChanges(channelId, result.documents, callback);
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        await poll();
        const interval = setInterval(poll, 5000);
        this.pollingIntervals.set(channelId, interval);

        const unsubscribe = () => {
            const interval = this.pollingIntervals.get(channelId);
            if (interval) {
                clearInterval(interval);
                this.pollingIntervals.delete(channelId);
            }
            this.lastOrderData.delete(channelId);
        };

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Polling customer orders: ${customerId} (Web fallback)`);

        return unsubscribe;
    }

    private async pollOrder(
        orderId: string,
        callback: OrderEventCallback,
        channelId: string
    ): Promise<() => void> {
        const { databases } = await import("@/lib/appwrite");

        const poll = async () => {
            try {
                const order = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.ordersCollectionId,
                    orderId
                );

                const lastOrder = this.lastOrderData.get(channelId);
                if (!lastOrder || JSON.stringify(lastOrder) !== JSON.stringify(order)) {
                    callback({
                        type: lastOrder ? "update" : "create",
                        order,
                    });
                    this.lastOrderData.set(channelId, order);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        await poll();
        const interval = setInterval(poll, 3000);
        this.pollingIntervals.set(channelId, interval);

        const unsubscribe = () => {
            const interval = this.pollingIntervals.get(channelId);
            if (interval) {
                clearInterval(interval);
                this.pollingIntervals.delete(channelId);
            }
            this.lastOrderData.delete(channelId);
        };

        this.subscriptions.set(channelId, unsubscribe);
        console.log(`Polling order: ${orderId} (Web fallback)`);

        return unsubscribe;
    }

    private checkForChanges(
        channelId: string,
        newOrders: any[],
        callback: OrderEventCallback,
        isDriver: boolean = false
    ) {
        const lastOrders = this.lastOrderData.get(channelId) || [];
        const lastOrderMap = new Map(lastOrders.map((o: any) => [o.$id, o]));
        const newOrderMap = new Map(newOrders.map((o: any) => [o.$id, o]));

        // Check for new or updated orders
        newOrders.forEach((order) => {
            const lastOrder = lastOrderMap.get(order.$id);
            if (!lastOrder) {
                // New order
                callback({
                    type: "create",
                    order,
                    isAvailable: isDriver && order.status === "ready" && !order.driverId,
                });
            } else if (JSON.stringify(lastOrder) !== JSON.stringify(order)) {
                // Updated order
                callback({
                    type: "update",
                    order,
                    isAvailable: isDriver && order.status === "ready" && !order.driverId,
                });
            }
        });

        // Check for deleted orders
        lastOrders.forEach((order: any) => {
            if (!newOrderMap.has(order.$id)) {
                callback({
                    type: "delete",
                    order,
                });
            }
        });

        this.lastOrderData.set(channelId, newOrders);
    }

    /**
     * Unsubscribe from a specific channel
     */
    private unsubscribe(channelId: string) {
        const unsubscribe = this.subscriptions.get(channelId);
        if (unsubscribe) {
            unsubscribe();
            this.subscriptions.delete(channelId);
            console.log(`Unsubscribed from: ${channelId}`);
        }
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll() {
        console.log("Unsubscribing from all channels...");
        this.subscriptions.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.subscriptions.clear();
        this.pollingIntervals.forEach((interval) => {
            clearInterval(interval);
        });
        this.pollingIntervals.clear();
        this.lastOrderData.clear();
    }

    /**
     * Determine event type from Appwrite events array
     */
    private getEventType(events: string[]): "create" | "update" | "delete" {
        if (events.some((e) => e.includes(".create"))) return "create";
        if (events.some((e) => e.includes(".delete"))) return "delete";
        return "update";
    }

    /**
     * Get status display information
     */
    getStatusInfo(status: string) {
        const statusMap: Record<string, { label: string; color: string; icon: string }> = {
            pending: { label: "Pending", color: "#EF4444", icon: "time" },
            accepted: { label: "Accepted", color: "#F59E0B", icon: "checkmark-circle" },
            preparing: { label: "Preparing", color: "#8B5CF6", icon: "restaurant" },
            ready: { label: "Ready for Pickup", color: "#10B981", icon: "checkmark-done" },
            picked_up: { label: "Picked Up", color: "#3B82F6", icon: "bicycle" },
            on_the_way: { label: "On The Way", color: "#3B82F6", icon: "navigate" },
            delivered: { label: "Delivered", color: "#22C55E", icon: "checkmark-done-circle" },
            cancelled: { label: "Cancelled", color: "#DC2626", icon: "close-circle" },
        };

        return statusMap[status] || statusMap.pending;
    }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export types
export type { OrderEventCallback, RealtimeEvent, RealtimeResponse };