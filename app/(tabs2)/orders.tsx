// This screen displays and manages restaurant orders in a kitchen display system style
// Restaurant owners can view incoming orders, update their status, and track order progress

// Import React hooks for state and side effects
import { useEffect, useState, useCallback } from "react";

// Import React Native UI components
import {
    View,
    Text,
    FlatList,        // Efficient scrollable list
    Pressable,       // Touchable component with better feedback
    Alert,           // Native alert dialogs
    ActivityIndicator, // Loading spinner
    RefreshControl,  // Pull-to-refresh functionality
    ScrollView,      // Scrollable container (used for horizontal filter pills)
} from "react-native";

// SafeAreaView prevents content from overlapping with device notches/status bar
import { SafeAreaView } from "react-native-safe-area-context";

// Ionicons for vector icons (status icons, action buttons)
import { Ionicons } from "@expo/vector-icons";

// Appwrite SDK imports for database queries
import { Query, Models } from "react-native-appwrite";

// Custom Appwrite configuration and helper functions
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";

// LinearGradient for beautiful background effects
import { LinearGradient } from 'expo-linear-gradient';

// ===== TypeScript Interfaces =====
// These define the shape of our data for type safety

// Represents a single item within an order (e.g., one burger, two fries)
interface OrderItem {
    menuItemId?: string;        // Reference to the menu item (optional)
    name: string;               // Name of the dish
    price: number;              // Price per unit
    quantity: number;           // How many of this item
    customizations?: string[];  // Optional modifications (e.g., "No onions", "Extra cheese")
}

// Represents a complete order document from the database
// Extends Models.Document to include Appwrite's default fields ($id, $createdAt, etc.)
interface Order extends Models.Document {
    orderNumber: string;        // Human-readable order number (e.g., "1234")
    customerId: string;         // ID of the customer who placed the order
    customerName: string;       // Customer's name
    customerPhone?: string;     // Customer's phone (optional)
    restaurantId: string;       // Which restaurant this order belongs to
    items: string;              // JSON string of OrderItem[] (stored as string in DB)
    status: "pending" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled"; // Order lifecycle stages
    totalPrice: number;         // Total cost of the order
    deliveryAddress: string;    // Where to deliver
    deliveryInstructions?: string; // Special delivery notes (optional)
    placedAt: string;          // When order was placed (ISO timestamp)
    acceptedAt?: string;       // When restaurant accepted (optional)
    completedAt?: string;      // When order was finished/cancelled (optional)
    driverId?: string;         // Delivery driver ID (optional)
}

// ===== Database Configuration =====
// Extract collection IDs from Appwrite config
const DB_ID = appwriteConfig.databaseId;
const ORDERS_ID = appwriteConfig.ordersCollectionId;
const RESTAURANTS_ID = appwriteConfig.restaurantCollectionId;

// ===== Status Configuration =====
// Defines visual styling for each order status (colors, labels, icons)
const STATUS_CONFIG = {
    pending: {
        label: "NEW ORDER",           // Display text
        color: "#EF4444",             // Red (urgent)
        bgColor: "#FEE2E2",           // Light red background
        icon: "alert-circle"          // Icon name from Ionicons
    },
    accepted: {
        label: "ACCEPTED",
        color: "#F59E0B",             // Amber/orange
        bgColor: "#FEF3C7",
        icon: "checkmark-circle"
    },
    preparing: {
        label: "PREPARING",
        color: "#8B5CF6",             // Purple (in progress)
        bgColor: "#EDE9FE",
        icon: "restaurant"
    },
    ready: {
        label: "READY",
        color: "#10B981",             // Green (ready for pickup)
        bgColor: "#D1FAE5",
        icon: "checkmark-done"
    },
    out_for_delivery: {
        label: "OUT FOR DELIVERY",
        color: "#3B82F6",             // Blue (in transit)
        bgColor: "#DBEAFE",
        icon: "bicycle"
    },
    delivered: {
        label: "DELIVERED",
        color: "#6B7280",             // Gray (completed)
        bgColor: "#F3F4F6",
        icon: "checkmark-done-circle"
    },
    cancelled: {
        label: "CANCELLED",
        color: "#DC2626",             // Dark red (cancelled)
        bgColor: "#FEE2E2",
        icon: "close-circle"
    },
};

// ===== Helper Functions =====

// Utility function to log errors consistently throughout the app
const logError = (context: string, error: any) => {
    console.error(`${context}:`, error?.message || String(error));
};

// ===== Main Component =====
export default function OrdersManagement() {
    // ===== State Management =====

    // All orders for this restaurant
    const [orders, setOrders] = useState<Order[]>([]);

    // Filtered subset of orders based on selected filter
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

    // Loading state for initial data fetch
    const [loading, setLoading] = useState(true);

    // Refreshing state for pull-to-refresh
    const [refreshing, setRefreshing] = useState(false);

    // Current restaurant's ID
    const [currentRestaurantId, setCurrentRestaurantId] = useState("");

    // Currently selected filter ("all", "active", "pending", etc.)
    const [selectedFilter, setSelectedFilter] = useState<string>("all");

    // Order selected for detailed view (not currently used but ready for modal)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Controls visibility of order details modal (not currently implemented)
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    // ===== Data Fetching Functions =====

    // Fetch the restaurant document for the current user
    // Returns the restaurant owned by the logged-in user
    const fetchRestaurant = async (accountId: string) => {
        const result = await databases.listDocuments(DB_ID, RESTAURANTS_ID, [
            Query.equal("ownerId", accountId), // Find restaurant where ownerId matches
        ]);
        return result.documents[0] ?? null; // Return first result or null
    };

    // Fetch all orders for a specific restaurant
    // Returns orders sorted by most recent first
    const fetchOrders = async (restaurantId: string) => {
        const result = await databases.listDocuments(DB_ID, ORDERS_ID, [
            Query.equal("restaurantId", restaurantId), // Only this restaurant's orders
            Query.orderDesc("placedAt"),                // Newest first
            Query.limit(100),                           // Max 100 orders
        ]);
        return result.documents as Order[]; // Type cast to Order[]
    };

    // Main function to load all order data
    // useCallback prevents unnecessary re-renders
    const loadOrders = useCallback(async () => {
        setLoading(true); // Show loading indicator
        try {
            // 1. Get the currently logged-in user
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            // 2. Find the restaurant owned by this user
            const restaurant = await fetchRestaurant(user.accountId);
            if (!restaurant) throw new Error("No restaurant found");

            // 3. Store the restaurant ID
            setCurrentRestaurantId(restaurant.$id);

            // 4. Fetch all orders for this restaurant
            const ordersList = await fetchOrders(restaurant.$id);

            // 5. Update state with fetched orders
            setOrders(ordersList);

            // 6. Apply the current filter to show filtered results
            filterOrders(ordersList, selectedFilter);
        } catch (err) {
            // Log and display any errors
            logError("Load orders error", err);
            Alert.alert("Error", (err as Error).message);
        } finally {
            // Always hide loading indicators when done
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedFilter]); // Re-create function when selectedFilter changes

    // ===== Side Effects =====

    // Load orders when component first mounts
    useEffect(() => {
        loadOrders();
    }, []); // Empty dependency array = run once on mount

    // ===== User Interaction Handlers =====

    // Handler for pull-to-refresh gesture
    const onRefresh = () => {
        setRefreshing(true); // Show refresh indicator
        loadOrders();         // Reload data
    };

    // Filter orders based on selected status
    const filterOrders = (ordersList: Order[], filter: string) => {
        if (filter === "all") {
            // Show all orders
            setFilteredOrders(ordersList);
        } else if (filter === "active") {
            // Show only orders that are in progress (not completed/cancelled)
            setFilteredOrders(
                ordersList.filter((o) =>
                    ["pending", "accepted", "preparing", "ready"].includes(o.status)
                )
            );
        } else {
            // Show orders matching specific status
            setFilteredOrders(ordersList.filter((o) => o.status === filter));
        }
    };

    // Handler when user taps a filter pill
    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);        // Update selected filter
        filterOrders(orders, filter);     // Apply filter to orders
    };

    // Update an order's status in the database
    const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
        try {
            // Prepare update data
            const updateData: any = { status: newStatus };

            // Add timestamp fields based on status
            if (newStatus === "accepted") {
                updateData.acceptedAt = new Date().toISOString();
            } else if (newStatus === "delivered" || newStatus === "cancelled") {
                updateData.completedAt = new Date().toISOString();
            }

            // Update the document in the database
            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, updateData);

            // Show success message
            Alert.alert("Success", `Order status updated to ${STATUS_CONFIG[newStatus].label}`);

            // Reload orders to reflect changes
            loadOrders();

            // Close details modal if open
            setDetailsModalVisible(false);
        } catch (err) {
            // Log and display any errors
            logError("Update order status error", err);
            Alert.alert("Error", (err as Error).message);
        }
    };

    // Show detailed view of an order (modal not yet implemented)
    const showOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsModalVisible(true);
    };

    // Determine which action buttons to show based on current status
    // Returns an array of possible next statuses
    const getStatusActions = (currentStatus: Order["status"]) => {
        const actions: { status: Order["status"]; label: string }[] = [];

        // Define state transitions
        switch (currentStatus) {
            case "pending":
                // New orders can be accepted or rejected
                actions.push({ status: "accepted", label: "Accept" });
                actions.push({ status: "cancelled", label: "Reject" });
                break;
            case "accepted":
                // Accepted orders can start being prepared
                actions.push({ status: "preparing", label: "Start Prep" });
                break;
            case "preparing":
                // Preparing orders can be marked as ready
                actions.push({ status: "ready", label: "Ready" });
                break;
            // Note: "ready" and "out_for_delivery" transitions would be handled by delivery system
        }
        return actions;
    };

    // ===== Render Loading State =====

    // Show loading screen while fetching initial data
    if (loading) {
        return (
            <View className="flex-1 bg-slate-950">
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#334155']} // Dark gradient
                    className="flex-1 justify-center items-center"
                >
                    {/* Spinner container with subtle background */}
                    <View className="bg-white/10 rounded-full p-8 mb-4">
                        <ActivityIndicator size="large" color="#f97316" />
                    </View>
                    <Text className="text-white text-lg font-semibold">Loading orders...</Text>
                </LinearGradient>
            </View>
        );
    }

    // ===== Main Screen Render =====
    return (
        <View className="flex-1 bg-slate-950">
            {/* Background gradient for the entire screen */}
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#1e293b']} // Dark blue/purple gradient
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    {/* ===== HEADER SECTION ===== */}
                    <View className="px-5 pt-5 pb-3">
                        {/* Title and Order Count */}
                        <View className="flex-row justify-between items-center mb-4">
                            {/* Left side: Title */}
                            <View>
                                {/* Decorative accent and label */}
                                <View className="flex-row items-center mb-2">
                                    <View className="w-1 h-6 bg-orange-500 rounded-full mr-2" />
                                    <Text className="text-orange-500 text-xs font-bold tracking-widest uppercase">
                                        Kitchen Display
                                    </Text>
                                </View>
                                <Text className="text-white text-3xl font-bold">Order Tickets</Text>
                            </View>

                            {/* Right side: Active order count badge */}
                            <View className="bg-orange-500/20 border border-orange-500/30 px-4 py-3 rounded-2xl">
                                <Text className="text-orange-500 font-bold text-xl">{filteredOrders.length}</Text>
                                <Text className="text-orange-300 text-xs">Active</Text>
                            </View>
                        </View>

                        {/* ===== FILTER PILLS ===== */}
                        {/* Horizontal scrollable list of filter buttons */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-2"
                        >
                            {/* Define all available filters with their icons */}
                            {[
                                { key: "all", label: "All", icon: "list" },
                                { key: "active", label: "Active", icon: "flame" },
                                { key: "pending", label: "New", icon: "alert-circle" },
                                { key: "preparing", label: "Prep", icon: "restaurant" },
                                { key: "ready", label: "Ready", icon: "checkmark-done" },
                                { key: "delivered", label: "Done", icon: "checkmark-circle" },
                            ].map((filter) => (
                                <Pressable
                                    key={filter.key}
                                    onPress={() => handleFilterChange(filter.key)}
                                    className={`mr-2 px-4 py-2 rounded-xl flex-row items-center ${
                                        selectedFilter === filter.key
                                            ? "bg-orange-500"                      // Active: orange background
                                            : "bg-white/5 border border-white/10" // Inactive: subtle background
                                    }`}
                                >
                                    {/* Filter icon */}
                                    <Ionicons
                                        name={filter.icon as any}
                                        size={16}
                                        color={selectedFilter === filter.key ? "white" : "#94a3b8"}
                                    />
                                    {/* Filter label */}
                                    <Text
                                        className={`font-semibold ml-2 ${
                                            selectedFilter === filter.key ? "text-white" : "text-slate-400"
                                        }`}
                                    >
                                        {filter.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {/* ===== ORDERS LIST ===== */}
                    <FlatList
                        data={filteredOrders}              // Array of orders to display
                        keyExtractor={(item) => item.$id}  // Unique key for each order

                        // Pull-to-refresh functionality
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#f97316" // Orange spinner
                            />
                        }

                        // Padding around the list
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}

                        // Component shown when no orders match filter
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                {/* Large icon */}
                                <View className="bg-white/5 rounded-full p-8 mb-4 border border-white/10">
                                    <Ionicons name="receipt-outline" size={64} color="#475569" />
                                </View>

                                {/* Empty state text */}
                                <Text className="text-white text-xl font-bold mb-2">No Orders</Text>
                                <Text className="text-slate-400 text-sm mb-6">
                                    {selectedFilter === "all" ? "No orders yet" : `No ${selectedFilter} orders`}
                                </Text>

                                {/* Refresh button */}
                                <Pressable
                                    onPress={onRefresh}
                                    className="bg-orange-500 px-6 py-3 rounded-xl flex-row items-center"
                                >
                                    <Ionicons name="refresh" size={20} color="white" />
                                    <Text className="text-white font-semibold ml-2">Refresh</Text>
                                </Pressable>
                            </View>
                        }

                        // Function to render each order card
                        renderItem={({ item, index }) => {
                            // Get visual configuration for this order's status
                            const statusConfig = STATUS_CONFIG[item.status];

                            // Parse the items JSON string into an array
                            let itemsArray: OrderItem[] = [];
                            try {
                                const parsed = JSON.parse(item.items);
                                if (Array.isArray(parsed)) {
                                    itemsArray = parsed;
                                } else {
                                    // Fallback if items is not an array
                                    itemsArray = [{
                                        name: String(item.items),
                                        quantity: 1,
                                        price: item.totalPrice,
                                        menuItemId: ""
                                    }];
                                }
                            } catch {
                                // Fallback if JSON parsing fails
                                itemsArray = [{
                                    name: String(item.items),
                                    quantity: 1,
                                    price: item.totalPrice,
                                    menuItemId: ""
                                }];
                            }

                            // Format the order time for display
                            const orderTime = new Date(item.placedAt);
                            const timeString = orderTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true // Use AM/PM format
                            });

                            return (
                                // Order card container (removed animation for stability)
                                <View className="mb-4">
                                    {/* Main pressable card - tap to view details */}
                                    <Pressable
                                        onPress={() => showOrderDetails(item)}
                                        className="bg-white rounded-2xl overflow-hidden"
                                        style={{
                                            // Shadow color matches order status
                                            shadowColor: statusConfig.color,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 12,
                                            elevation: 8, // Android shadow
                                        }}
                                    >
                                        {/* ===== DECORATIVE TOP PERFORATION ===== */}
                                        {/* Mimics torn paper ticket effect */}
                                        <View className="absolute top-0 left-0 right-0 flex-row justify-between px-4 z-10">
                                            {[...Array(8)].map((_, i) => (
                                                <View
                                                    key={i}
                                                    className="w-3 h-3 rounded-full bg-slate-950 -mt-1.5"
                                                />
                                            ))}
                                        </View>

                                        {/* ===== STATUS HEADER ===== */}
                                        {/* Colored banner showing order status */}
                                        <View
                                            className="py-3 items-center border-b-2 border-dashed border-gray-300"
                                            style={{ backgroundColor: statusConfig.bgColor }}
                                        >
                                            <Text
                                                className="text-xs font-black tracking-widest"
                                                style={{ color: statusConfig.color }}
                                            >
                                                {statusConfig.label}
                                            </Text>
                                        </View>

                                        {/* ===== ORDER HEADER INFO ===== */}
                                        {/* Order number, time, price, customer info */}
                                        <View className="px-6 py-4 border-b-2 border-dashed border-gray-300">
                                            <View className="flex-row justify-between items-start mb-2">
                                                {/* Left: Order number and time */}
                                                <View>
                                                    <Text className="text-2xl font-black text-gray-900">
                                                        #{item.orderNumber}
                                                    </Text>
                                                    <Text className="text-xs text-gray-500 font-mono mt-0.5">
                                                        {timeString.toUpperCase()}
                                                    </Text>
                                                </View>

                                                {/* Right: Total price and item count */}
                                                <View className="items-end">
                                                    <Text className="text-2xl font-black text-orange-600">
                                                        ${item.totalPrice.toFixed(2)}
                                                    </Text>
                                                    <View className="bg-gray-100 px-3 py-1 rounded-full mt-1">
                                                        <Text className="text-xs font-bold text-gray-600">
                                                            {itemsArray.length} ITEM{itemsArray.length > 1 ? 'S' : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Customer information box */}
                                            <View className="bg-gray-50 rounded-lg px-3 py-2 mt-2">
                                                {/* Customer name */}
                                                <View className="flex-row items-center">
                                                    <Ionicons name="person" size={14} color="#6b7280" />
                                                    <Text className="text-sm font-bold text-gray-700 ml-2">
                                                        {item.customerName}
                                                    </Text>
                                                </View>

                                                {/* Customer phone (if provided) */}
                                                {item.customerPhone && (
                                                    <View className="flex-row items-center mt-1">
                                                        <Ionicons name="call" size={14} color="#6b7280" />
                                                        <Text className="text-xs text-gray-600 ml-2 font-mono">
                                                            {item.customerPhone}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* ===== ORDER ITEMS LIST ===== */}
                                        {/* Shows each item ordered with quantity and customizations */}
                                        <View className="px-6 py-4 bg-amber-50">
                                            <Text className="text-xs font-black text-gray-500 mb-3 tracking-wider">
                                                ORDER DETAILS
                                            </Text>

                                            {/* Loop through each item in the order */}
                                            {itemsArray.map((orderItem, idx) => (
                                                <View
                                                    key={idx}
                                                    className="flex-row justify-between mb-3 pb-3 border-b border-gray-200"
                                                >
                                                    <View className="flex-1 mr-4">
                                                        {/* Item name with quantity badge */}
                                                        <View className="flex-row items-center">
                                                            {/* Quantity badge */}
                                                            <View className="bg-orange-500 rounded-md w-8 h-8 items-center justify-center mr-3">
                                                                <Text className="text-white font-black text-sm">
                                                                    {orderItem.quantity}×
                                                                </Text>
                                                            </View>
                                                            {/* Item name */}
                                                            <Text className="text-base font-bold text-gray-900 flex-1">
                                                                {orderItem.name}
                                                            </Text>
                                                        </View>

                                                        {/* Customizations (if any) */}
                                                        {orderItem.customizations && orderItem.customizations.length > 0 && (
                                                            <View className="ml-11 mt-1">
                                                                {orderItem.customizations.map((custom, i) => (
                                                                    <Text key={i} className="text-xs text-gray-600 italic">
                                                                        • {custom}
                                                                    </Text>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* Item price */}
                                                    <Text className="text-sm font-bold text-gray-700">
                                                        ${orderItem.price.toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* ===== DELIVERY INFORMATION ===== */}
                                        {/* Shows delivery address and special instructions */}
                                        {item.deliveryAddress && (
                                            <View className="px-6 py-3 bg-gray-50 border-t-2 border-dashed border-gray-300">
                                                <View className="flex-row items-start">
                                                    <Ionicons name="location" size={16} color="#f97316" />
                                                    <View className="flex-1 ml-2">
                                                        <Text className="text-xs font-black text-gray-500 mb-1">
                                                            DELIVERY TO:
                                                        </Text>
                                                        <Text className="text-sm text-gray-700 font-semibold">
                                                            {item.deliveryAddress}
                                                        </Text>

                                                        {/* Special delivery instructions (if any) */}
                                                        {item.deliveryInstructions && (
                                                            <Text className="text-xs text-gray-500 mt-1 italic">
                                                                Note: {item.deliveryInstructions}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        )}

                                        {/* ===== ACTION BUTTONS ===== */}
                                        {/* Shows available status transition buttons */}
                                        {getStatusActions(item.status).length > 0 && (
                                            <View className="flex-row border-t-2 border-dashed border-gray-300">
                                                {/* Create button for each available action */}
                                                {getStatusActions(item.status).map((action, idx) => (
                                                    <Pressable
                                                        key={idx}
                                                        onPress={() => {
                                                            // Show confirmation dialog before updating status
                                                            Alert.alert(
                                                                "Confirm Action",
                                                                `${action.label} for order #${item.orderNumber}?`,
                                                                [
                                                                    { text: "Cancel", style: "cancel" },
                                                                    {
                                                                        text: "Confirm",
                                                                        onPress: () => updateOrderStatus(item.$id, action.status),
                                                                    },
                                                                ]
                                                            );
                                                        }}
                                                        className={`flex-1 py-4 items-center ${
                                                            idx > 0 ? "border-l border-gray-300" : ""
                                                        } ${action.status === "cancelled" ? "bg-red-50" : "bg-orange-50"}`}
                                                    >
                                                        <Text
                                                            className={`font-black text-sm tracking-wide ${
                                                                action.status === "cancelled" ? "text-red-600" : "text-orange-600"
                                                            }`}
                                                        >
                                                            {action.label.toUpperCase()}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        )}

                                        {/* ===== DECORATIVE BOTTOM PERFORATION ===== */}
                                        {/* Mimics torn paper ticket effect at bottom */}
                                        <View className="absolute bottom-0 left-0 right-0 flex-row justify-between px-4 z-10">
                                            {[...Array(8)].map((_, i) => (
                                                <View
                                                    key={i}
                                                    className="w-3 h-3 rounded-full bg-slate-950 -mb-1.5"
                                                />
                                            ))}
                                        </View>
                                    </Pressable>
                                </View>
                            );
                        }}
                    />
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}