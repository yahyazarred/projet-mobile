// Driver Deliveries Screen
// This screen allows delivery drivers to view, accept, and manage delivery orders
// Drivers can see available orders and track their active deliveries

// Import React hooks for state management and side effects
import { useEffect, useState, useCallback } from "react";

// Import React Native core components
import {
    View,
    Text,
    FlatList,        // Efficient scrollable list component
    Pressable,       // Touchable component with better feedback
    Alert,           // Native alert dialogs for confirmations
    ActivityIndicator, // Loading spinner
    RefreshControl,  // Pull-to-refresh functionality
    Modal,           // Overlay modal for detailed views
    ScrollView,      // Scrollable container
    Linking,         // Opens external apps (phone, maps)
} from "react-native";

// SafeAreaView prevents content overlap with device notches/status bar
import { SafeAreaView } from "react-native-safe-area-context";

// Ionicons for vector icons (navigation, call, status icons)
import { Ionicons } from "@expo/vector-icons";

// Appwrite Models type for document structure
import { Models } from "react-native-appwrite";

// Appwrite configuration and helper functions
import { appwriteConfig, databases, getCurrentUser } from "@/lib/appwrite";

// ===== TypeScript Interfaces =====
// Define data structures for type safety

// Represents a single item in an order
interface OrderItem {
    menuItemId: string;        // Reference to menu item in database
    name: string;              // Dish name (e.g., "Burger")
    price: number;             // Price per unit
    quantity: number;          // How many of this item ordered
    customizations?: string[]; // Optional modifications (e.g., "No pickles")
}

// Represents a delivery order document
// Extends Models.Document to include Appwrite's default fields
interface Order extends Models.Document {
    orderNumber: string;          // Human-readable order ID (e.g., "1234")
    customerId: string;           // Customer's user ID
    customerName: string;         // Customer's name
    customerPhone?: string;       // Customer's phone number (optional)
    restaurantId: string;         // Which restaurant the order is from
    restaurantName?: string;      // Restaurant name (optional)
    restaurantAddress?: string;   // Restaurant location (optional)
    items: string;                // JSON string of OrderItem[] array
    status: "ready" | "out_for_delivery" | "delivered"; // Delivery lifecycle stages
    totalPrice: number;           // Total order cost
    deliveryAddress: string;      // Where to deliver the order
    deliveryInstructions?: string; // Special delivery notes (optional)
    placedAt: string;            // When order was placed (ISO timestamp)
    deliveryAgentId?: string;    // Driver who accepted the order (optional)
    pickedUpAt?: string;         // When driver picked up order (optional)
    deliveredAt?: string;        // When order was delivered (optional)
}

// ===== Database Configuration =====
// Extract collection IDs from Appwrite config
const DB_ID = appwriteConfig.databaseId;
const ORDERS_ID = appwriteConfig.ordersCollectionId;

// ===== Status Configuration =====
// Visual styling for each delivery status
const STATUS_CONFIG = {
    ready: {
        label: "Ready for Pickup",     // Order is ready at restaurant
        color: "#10B981",              // Green
        icon: "checkmark-done"
    },
    out_for_delivery: {
        label: "Out for Delivery",     // Driver is delivering
        color: "#3B82F6",              // Blue
        icon: "bicycle"
    },
    delivered: {
        label: "Delivered",            // Order has been delivered
        color: "#6B7280",              // Gray
        icon: "checkmark-done-circle"
    },
};

// ===== Main Component =====
export default function DriverDeliveries() {
    // ===== State Management =====

    // All orders (both available and driver's active deliveries)
    const [orders, setOrders] = useState<Order[]>([]);

    // Filtered subset of orders based on selected filter
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

    // Loading state for initial data fetch
    const [loading, setLoading] = useState(true);

    // Refreshing state for pull-to-refresh
    const [refreshing, setRefreshing] = useState(false);

    // Current logged-in driver's ID
    const [currentDriverId, setCurrentDriverId] = useState("");

    // Currently selected filter ("available" or "my_deliveries")
    const [selectedFilter, setSelectedFilter] = useState<string>("available");

    // Order selected to view in detail modal
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Controls visibility of order details modal
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    // ===== Data Loading Function =====
    // Fetches orders based on selected filter
    // useCallback prevents unnecessary re-renders
    const loadOrders = useCallback(async () => {
        try {
            // 1. Get the currently logged-in driver
            const user = await getCurrentUser();
            if (!user) throw new Error("User not found");

            // 2. Store driver's ID
            setCurrentDriverId(user.$id);

            // 3. Initialize empty orders array
            let ordersList: Order[] = [];

            // 4. Dynamically import functions from appwrite.ts
            // This allows us to use specialized query functions
            const { getAvailableOrders, getDriverDeliveries } = await import("@/lib/appwrite");

            // 5. Fetch orders based on selected filter
            if (selectedFilter === "available") {
                // Get all orders that are ready for pickup (no driver assigned yet)
                ordersList = await getAvailableOrders() as Order[];
            } else if (selectedFilter === "my_deliveries") {
                // Get orders assigned to this driver (active deliveries)
                ordersList = await getDriverDeliveries(user.$id, false) as Order[];
            }

            // 6. Update state with fetched orders
            setOrders(ordersList);
            setFilteredOrders(ordersList);
        } catch (err) {
            // Log and display any errors
            console.error("Load orders error:", err);
            Alert.alert("Error", (err as Error).message);
        } finally {
            // Always hide loading indicators when done
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedFilter]); // Re-run when selectedFilter changes

    // ===== Side Effects =====

    // Reload orders whenever the filter changes
    useEffect(() => {
        loadOrders();
    }, [selectedFilter]); // Dependency: reload when filter changes

    // ===== User Interaction Handlers =====

    // Handler for pull-to-refresh gesture
    const onRefresh = () => {
        setRefreshing(true); // Show refresh indicator
        loadOrders();        // Reload data
    };

    // Handler when user taps a filter tab
    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter); // Update selected filter (triggers useEffect)
    };

    // Accept a delivery order
    // Assigns the order to current driver and updates status
    const acceptDelivery = async (orderId: string) => {
        try {
            // Update order in database
            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, {
                deliveryAgentId: currentDriverId,     // Assign to this driver
                status: "out_for_delivery",           // Change status
                pickedUpAt: new Date().toISOString(), // Record pickup time
            });

            // Show success message
            Alert.alert("Success", "Delivery accepted! Head to the restaurant.");

            // Reload orders to show updated list
            loadOrders();

            // Close details modal
            setDetailsModalVisible(false);
        } catch (err) {
            // Log and display any errors
            console.error("Accept delivery error:", err);
            Alert.alert("Error", (err as Error).message);
        }
    };

    // Mark an order as delivered
    // Called when driver confirms delivery completion
    const markAsDelivered = async (orderId: string) => {
        try {
            // Update order status in database
            await databases.updateDocument(DB_ID, ORDERS_ID, orderId, {
                status: "delivered",                    // Mark as complete
                deliveredAt: new Date().toISOString(), // Record delivery time
            });

            // Show success message
            Alert.alert("Success", "Order marked as delivered!");

            // Reload orders
            loadOrders();

            // Close details modal
            setDetailsModalVisible(false);
        } catch (err) {
            // Log and display any errors
            console.error("Mark delivered error:", err);
            Alert.alert("Error", (err as Error).message);
        }
    };

    // Show detailed view of an order in modal
    const showOrderDetails = (order: Order) => {
        setSelectedOrder(order);         // Store selected order
        setDetailsModalVisible(true);    // Show modal
    };

    // Open Google Maps with delivery address
    // Uses device's default maps app
    const openNavigation = (address: string) => {
        // Construct Google Maps URL with encoded address
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

        // Open URL in external app (Google Maps or browser)
        Linking.openURL(url);
    };

    // Initiate phone call to customer
    // Uses device's phone app
    const callCustomer = (phone?: string) => {
        if (phone) {
            // Open phone app with pre-filled number
            Linking.openURL(`tel:${phone}`);
        } else {
            // Show error if phone number not available
            Alert.alert("No Phone", "Customer phone number not available");
        }
    };

    // ===== Loading State Render =====
    // Show loading screen while fetching initial data
    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-gray-600">Loading deliveries...</Text>
            </SafeAreaView>
        );
    }

    // ===== Main Screen Render =====
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* ===== HEADER SECTION ===== */}
            <View className="px-5 pt-5 pb-3 bg-white">
                {/* Title and Count Badge */}
                <View className="flex-row justify-between items-center mb-4">
                    {/* Left side: Title */}
                    <View>
                        <Text className="text-xs font-semibold text-blue-600">DELIVERIES</Text>
                        <Text className="text-2xl font-bold text-gray-900 mt-1">
                            {/* Dynamic title based on selected filter */}
                            {selectedFilter === "available" ? "Available Orders" : "My Deliveries"}
                        </Text>
                    </View>

                    {/* Right side: Order count badge */}
                    <View className="bg-blue-600 px-4 py-2 rounded-full">
                        <Text className="text-white font-bold">{filteredOrders.length}</Text>
                    </View>
                </View>

                {/* ===== FILTER TABS ===== */}
                {/* Horizontal scrollable tabs for switching views */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[
                        { key: "available", label: "Available" },        // Orders ready for pickup
                        { key: "my_deliveries", label: "My Deliveries" }, // Driver's active deliveries
                    ].map((filter) => (
                        <Pressable
                            key={filter.key}
                            onPress={() => handleFilterChange(filter.key)}
                            className={`mr-2 px-4 py-2 rounded-full ${
                                // Active tab: blue background, inactive: gray background
                                selectedFilter === filter.key ? "bg-blue-600" : "bg-gray-100"
                            }`}
                        >
                            <Text
                                className={`font-semibold ${
                                    // Active tab: white text, inactive: dark text
                                    selectedFilter === filter.key ? "text-white" : "text-gray-700"
                                }`}
                            >
                                {filter.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* ===== ORDERS LIST ===== */}
            {/* Scrollable list of delivery orders */}
            <FlatList
                data={filteredOrders}              // Array of orders to display
                keyExtractor={(item) => item.$id}  // Unique key for each item

                // Pull-to-refresh functionality
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

                // Padding around the list
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}

                // Component shown when no orders match filter
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        {/* Large bicycle icon */}
                        <Ionicons name="bicycle-outline" size={64} color="#ccc" />

                        {/* Empty state text */}
                        <Text className="text-gray-500 mt-4 text-lg">No deliveries found</Text>
                        <Text className="text-gray-400 text-sm">
                            {/* Dynamic message based on selected filter */}
                            {selectedFilter === "available"
                                ? "Check back soon for new orders"
                                : "You don't have any active deliveries"}
                        </Text>
                    </View>
                }

                // Function to render each order card
                renderItem={({ item }) => {
                    // Get visual configuration for this order's status
                    const statusConfig = STATUS_CONFIG[item.status];

                    // Parse items JSON string into array
                    const itemsArray: OrderItem[] = JSON.parse(item.items);

                    // Check if this order is assigned to current driver
                    const isMyDelivery = item.deliveryAgentId === currentDriverId;

                    return (
                        // Order card - tappable to show details
                        <Pressable
                            onPress={() => showOrderDetails(item)}
                            className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
                        >
                            {/* ===== ORDER HEADER ===== */}
                            {/* Order number, status, customer info, price */}
                            <View className="p-4 border-b border-gray-100">
                                {/* Top row: Order number and status badge */}
                                <View className="flex-row justify-between items-center mb-2">
                                    {/* Order number with status dot */}
                                    <View className="flex-row items-center">
                                        {/* Colored status dot */}
                                        <View
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: statusConfig.color }}
                                        />
                                        <Text className="text-base font-bold text-gray-900">
                                            #{item.orderNumber}
                                        </Text>
                                    </View>

                                    {/* Status badge */}
                                    <View
                                        className="px-3 py-1 rounded-full"
                                        style={{ backgroundColor: `${statusConfig.color}20` }} // 20% opacity
                                    >
                                        <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
                                            {statusConfig.label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Bottom row: Customer info and price */}
                                <View className="flex-row justify-between items-center">
                                    {/* Customer name and delivery address */}
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {item.customerName}
                                        </Text>
                                        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                                            <Ionicons name="location" size={12} /> {item.deliveryAddress}
                                        </Text>
                                    </View>

                                    {/* Total price */}
                                    <Text className="text-lg font-bold text-blue-600 ml-2">
                                        ${item.totalPrice.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            {/* ===== ORDER METADATA ===== */}
                            {/* Item count and time placed */}
                            <View className="px-4 py-3 bg-gray-50">
                                <View className="flex-row justify-between items-center">
                                    {/* Number of items */}
                                    <View>
                                        <Text className="text-xs text-gray-500">Items</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {itemsArray.length} item{itemsArray.length > 1 ? "s" : ""}
                                        </Text>
                                    </View>

                                    {/* Time order was placed */}
                                    <View>
                                        <Text className="text-xs text-gray-500">Placed</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {/* Format timestamp to HH:MM AM/PM */}
                                            {new Date(item.placedAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* ===== ACCEPT DELIVERY BUTTON ===== */}
                            {/* Only shown for available orders (not assigned to any driver) */}
                            {!isMyDelivery && item.status === "ready" && (
                                <Pressable
                                    onPress={() => {
                                        // Show confirmation dialog before accepting
                                        Alert.alert(
                                            "Accept Delivery",
                                            `Accept delivery for order #${item.orderNumber}?`,
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                    text: "Accept",
                                                    onPress: () => acceptDelivery(item.$id),
                                                },
                                            ]
                                        );
                                    }}
                                    className="bg-blue-600 py-3 items-center"
                                >
                                    <Text className="text-white font-bold text-base">Accept Delivery</Text>
                                </Pressable>
                            )}

                            {/* ===== ACTION BUTTONS FOR ACTIVE DELIVERIES ===== */}
                            {/* Navigate and Call buttons for orders assigned to this driver */}
                            {isMyDelivery && item.status === "out_for_delivery" && (
                                <View className="flex-row border-t border-gray-100">
                                    {/* Navigate button - Opens Google Maps */}
                                    <Pressable
                                        onPress={() => openNavigation(item.deliveryAddress)}
                                        className="flex-1 py-3 items-center border-r border-gray-100"
                                    >
                                        <View className="flex-row items-center">
                                            <Ionicons name="navigate" size={16} color="#3B82F6" />
                                            <Text className="font-semibold text-blue-600 ml-1">Navigate</Text>
                                        </View>
                                    </Pressable>

                                    {/* Call button - Opens phone app */}
                                    <Pressable
                                        onPress={() => callCustomer(item.customerPhone)}
                                        className="flex-1 py-3 items-center"
                                    >
                                        <View className="flex-row items-center">
                                            <Ionicons name="call" size={16} color="#10B981" />
                                            <Text className="font-semibold text-green-600 ml-1">Call</Text>
                                        </View>
                                    </Pressable>
                                </View>
                            )}
                        </Pressable>
                    );
                }}
            />

            {/* ===== ORDER DETAILS MODAL ===== */}
            {/* Full-screen modal showing complete order information */}
            <Modal visible={detailsModalVisible} animationType="slide" transparent>
                {/* Semi-transparent background overlay */}
                <View className="flex-1 bg-black/50 justify-end">
                    {/* Modal content container (slides up from bottom) */}
                    <View className="bg-white rounded-t-3xl max-h-[85%]">
                        {/* Modal Header with close button */}
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Delivery Details</Text>
                            {/* Close button */}
                            <Pressable onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </Pressable>
                        </View>

                        {/* Modal Content - Scrollable */}
                        {selectedOrder && (
                            <ScrollView className="p-5">
                                {/* ===== ORDER NUMBER AND STATUS ===== */}
                                <View className="mb-5">
                                    <Text className="text-2xl font-bold text-gray-900 mb-1">
                                        #{selectedOrder.orderNumber}
                                    </Text>
                                    {/* Status badge */}
                                    <View
                                        className="self-start px-3 py-1 rounded-full"
                                        style={{ backgroundColor: `${STATUS_CONFIG[selectedOrder.status].color}20` }}
                                    >
                                        <Text
                                            className="text-sm font-semibold"
                                            style={{ color: STATUS_CONFIG[selectedOrder.status].color }}
                                        >
                                            {STATUS_CONFIG[selectedOrder.status].label}
                                        </Text>
                                    </View>
                                </View>

                                {/* ===== CUSTOMER AND DELIVERY INFO ===== */}
                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    {/* Customer name */}
                                    <Text className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER</Text>
                                    <Text className="text-base font-semibold text-gray-900">
                                        {selectedOrder.customerName}
                                    </Text>

                                    {/* Customer phone (tappable to call) */}
                                    {selectedOrder.customerPhone && (
                                        <Pressable
                                            onPress={() => callCustomer(selectedOrder.customerPhone)}
                                            className="flex-row items-center mt-2"
                                        >
                                            <Ionicons name="call" size={16} color="#3B82F6" />
                                            <Text className="text-sm text-blue-600 ml-2 font-semibold">
                                                {selectedOrder.customerPhone}
                                            </Text>
                                        </Pressable>
                                    )}

                                    {/* Delivery address section */}
                                    <View className="mt-3 pt-3 border-t border-gray-200">
                                        <Text className="text-xs font-semibold text-gray-500 mb-1">
                                            DELIVERY ADDRESS
                                        </Text>
                                        <Text className="text-sm text-gray-700 mb-2">
                                            {selectedOrder.deliveryAddress}
                                        </Text>
                                        {/* Open in Maps button */}
                                        <Pressable
                                            onPress={() => openNavigation(selectedOrder.deliveryAddress)}
                                            className="flex-row items-center self-start"
                                        >
                                            <Ionicons name="navigate" size={16} color="#3B82F6" />
                                            <Text className="text-sm text-blue-600 ml-1 font-semibold">
                                                Open in Maps
                                            </Text>
                                        </Pressable>
                                    </View>

                                    {/* Delivery instructions (if provided) */}
                                    {selectedOrder.deliveryInstructions && (
                                        <View className="mt-3 pt-3 border-t border-gray-200">
                                            <Text className="text-xs font-semibold text-gray-500 mb-1">
                                                INSTRUCTIONS
                                            </Text>
                                            <Text className="text-sm text-gray-700">
                                                {selectedOrder.deliveryInstructions}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* ===== ORDER ITEMS LIST ===== */}
                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-gray-500 mb-3">ORDER ITEMS</Text>
                                    {/* Loop through each item in the order */}
                                    {JSON.parse(selectedOrder.items).map((item: OrderItem, idx: number) => (
                                        <View key={idx} className="flex-row justify-between py-3 border-b border-gray-100">
                                            <View className="flex-1">
                                                {/* Item name with quantity */}
                                                <Text className="text-base font-semibold text-gray-900">
                                                    {item.quantity}x {item.name}
                                                </Text>
                                                {/* Customizations (if any) */}
                                                {item.customizations && item.customizations.length > 0 && (
                                                    <Text className="text-xs text-gray-500 mt-1">
                                                        + {item.customizations.join(", ")}
                                                    </Text>
                                                )}
                                            </View>
                                            {/* Item total (price × quantity) */}
                                            <Text className="text-base font-semibold text-gray-900">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* ===== TOTAL PRICE ===== */}
                                <View className="bg-blue-50 rounded-xl p-4 mb-5">
                                    <View className="flex-row justify-between">
                                        <Text className="text-lg font-bold text-gray-900">Total</Text>
                                        <Text className="text-xl font-bold text-blue-600">
                                            ${selectedOrder.totalPrice.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {/* ===== ACCEPT DELIVERY BUTTON (in modal) ===== */}
                                {/* Shown for available orders */}
                                {selectedOrder.deliveryAgentId !== currentDriverId && selectedOrder.status === "ready" && (
                                    <Pressable
                                        onPress={() => acceptDelivery(selectedOrder.$id)}
                                        className="bg-blue-600 py-4 rounded-xl items-center mb-3"
                                    >
                                        <Text className="text-white font-bold text-base">Accept Delivery</Text>
                                    </Pressable>
                                )}

                                {/* ===== MARK AS DELIVERED BUTTON ===== */}
                                {/* Shown for driver's active deliveries */}
                                {selectedOrder.deliveryAgentId === currentDriverId && selectedOrder.status === "out_for_delivery" && (
                                    <Pressable
                                        onPress={() => {
                                            // Show confirmation dialog before marking as delivered
                                            Alert.alert(
                                                "Confirm Delivery",
                                                "Have you delivered this order to the customer?",
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    {
                                                        text: "Yes, Delivered",
                                                        onPress: () => markAsDelivered(selectedOrder.$id),
                                                    },
                                                ]
                                            );
                                        }}
                                        className="bg-green-600 py-4 rounded-xl items-center mb-3"
                                    >
                                        <Text className="text-white font-bold text-base">Mark as Delivered</Text>
                                    </Pressable>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}