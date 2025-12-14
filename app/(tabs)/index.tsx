// ==================== IMPORTS ====================
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CartButton from "@/components/CartButton";
import useAuthStore from "@/store/auth.store";
import { useEffect, useState } from "react";
import { getRestaurants } from "@/lib/appwrite";  // API function to fetch restaurants

// ==================== HOME SCREEN COMPONENT ====================
export default function Index() {
    // ==================== STATE ====================
    const { user } = useAuthStore();  // Get current user from global state
    const [restaurants, setRestaurants] = useState([]);  // Restaurants from database
    const [loading, setLoading] = useState(true);  // Loading indicator state

    // ==================== STATIC DATA ====================
    // Categories array - could be fetched from API in production
    const categories = [
        { id: '1', name: 'Breakfast', icon: 'sunny-outline', color: '#FEF3C7' },
        { id: '2', name: 'Lunch', icon: 'restaurant-outline', color: '#FED7AA' },
        { id: '3', name: 'Dinner', icon: 'moon-outline', color: '#DBEAFE' },
        { id: '4', name: 'Desserts', icon: 'ice-cream-outline', color: '#FECACA' },
    ];

    // Special offers/promotions - hardcoded for UI demo
    const specialOffers = [
        {
            id: '1',
            title: '30% OFF',
            subtitle: 'On your first order',
            color: '#F59E0B',  // Orange background
            image: require('@/assets/images/breakfast.png'),
        },
        {
            id: '2',
            title: 'Free Delivery',
            subtitle: 'Orders above $20',
            color: '#B91C1C',  // Red background
            image: require('@/assets/images/lunch.png'),
        },
    ];

    // ==================== FETCH RESTAURANTS ====================
    // useEffect runs once on component mount (empty dependency array)
    useEffect(() => {
        async function load() {
            try {
                // Fetch restaurants from Appwrite database
                const data = await getRestaurants();
                setRestaurants(data);
            } catch (e) {
                console.log(e);  // Log error for debugging
            } finally {
                setLoading(false);  // Always stop loading, even on error
            }
        }
        load();
    }, []);  // Empty array = run only once on mount

    // ==================== RENDER UI ====================
    // @ts-ignore
    // @ts-ignore
    return (
        <SafeAreaView className="flex-1 bg-amber-50">
            {/* ScrollView allows entire screen to scroll */}
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ==================== HEADER SECTION ==================== */}
                <View className="px-5 pt-4 pb-3">
                    {/* Top bar: Location + Cart button */}
                    <View className="flex-row justify-between items-center mb-4">
                        {/* Left: Location selector */}
                        <View>
                            <View className="flex-row items-center gap-1">
                                <Ionicons name="location" size={18} color="#D97706" />
                                <Text className="text-sm font-semibold text-amber-700">
                                    Deliver to
                                </Text>
                            </View>
                            {/* Clickable location dropdown */}
                            <TouchableOpacity className="flex-row items-center gap-1 mt-1">
                                <Text className="text-lg font-bold text-gray-900">Croatia</Text>
                                <Ionicons name="chevron-down" size={18} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        {/* Right: Cart button component */}
                        <CartButton />
                    </View>

                    {/* Search Bar */}
                    <View className="bg-white rounded-2xl flex-row items-center px-4 py-3 shadow-sm">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            placeholder="Search for restaurants..."
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 ml-3 text-gray-900 text-base"
                        />
                        {/* Filter/options button */}
                        <TouchableOpacity>
                            <Ionicons name="options-outline" size={20} color="#D97706" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ==================== SPECIAL OFFERS SECTION ==================== */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                        Special Offers 🔥
                    </Text>
                    {/* Horizontal scrollable list */}
                    <ScrollView
                        horizontal  // Enables horizontal scrolling
                        showsHorizontalScrollIndicator={false}  // Hide scrollbar
                        className="gap-3"
                    >
                        {specialOffers.map((offer) => (
                            <TouchableOpacity
                                key={offer.id}
                                className="rounded-2xl overflow-hidden mr-3"
                                style={{
                                    backgroundColor: offer.color,
                                    width: 280,  // Fixed width for horizontal scroll
                                    height: 140
                                }}
                                activeOpacity={0.8}  // Slight fade on press
                            >
                                {/* Card content: Text + Image side by side */}
                                <View className="flex-row h-full">
                                    {/* Left: Text content */}
                                    <View className="flex-1 p-4 justify-center">
                                        <Text className="text-2xl font-bold text-white mb-1">
                                            {offer.title}
                                        </Text>
                                        <Text className="text-white text-base mb-3">
                                            {offer.subtitle}
                                        </Text>
                                        {/* CTA button */}
                                        <View className="bg-white/20 self-start px-4 py-2 rounded-full">
                                            <Text className="text-white font-semibold">Order Now</Text>
                                        </View>
                                    </View>
                                    {/* Right: Image */}
                                    <Image
                                        source={offer.image}
                                        className="w-32 h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ==================== CATEGORIES SECTION ==================== */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                        Categories
                    </Text>
                    {/* Grid layout using flex-wrap */}
                    <View className="flex-row flex-wrap gap-3">
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                className="bg-white rounded-2xl p-4 items-center shadow-sm"
                                style={{ width: '22%' }}  // 4 items per row (22% × 4 + gaps = ~100%)
                                activeOpacity={0.7}
                            >
                                {/* Icon container with dynamic background color */}
                                <View
                                    className="w-14 h-14 rounded-full items-center justify-center mb-2"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <Ionicons
                                        name={category.icon as any}  // Cast to any for TypeScript
                                        size={28}
                                        color="#D97706"
                                    />
                                </View>
                                {/* Category name */}
                                <Text className="text-xs font-semibold text-gray-900 text-center">
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ==================== RESTAURANTS SECTION ==================== */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                        Popular Restaurants
                    </Text>

                    {/* Loading state: Show spinner while fetching data */}
                    {loading && (
                        <ActivityIndicator size="large" color="#D97706" className="mt-4" />
                    )}

                    {/* Empty state: Show message if no restaurants found */}
                    {!loading && restaurants.length === 0 && (
                        <Text className="text-center text-gray-500 mt-4">
                            No restaurants added yet.
                        </Text>
                    )}

                    {/* Success state: Render restaurant cards */}
                    {!loading &&
                        restaurants.map((restaurant) => (
                            <TouchableOpacity
                                key={restaurant.$id}  // Appwrite uses $id as unique identifier
                                className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
                                activeOpacity={0.8}
                            >
                                {/* Restaurant Image */}
                                <Image
                                    source={{ uri: restaurant.photoUrl }}  // Load from URL
                                    className="w-full h-40"
                                    resizeMode="cover"  // Crop to fill
                                />

                                {/* Restaurant Info */}
                                <View className="p-4">
                                    {/* Restaurant Name */}
                                    <Text className="text-lg font-bold text-gray-900 mb-1">
                                        {restaurant.name}
                                    </Text>

                                    {/* Description */}
                                    <Text className="text-sm text-gray-600">
                                        {restaurant.description}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
