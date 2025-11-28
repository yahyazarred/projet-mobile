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
import { getRestaurants } from "@/lib/appwrite";

export default function Index() {
    const { user } = useAuthStore();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: '1', name: 'Breakfast', icon: 'sunny-outline', color: '#FEF3C7' },
        { id: '2', name: 'Lunch', icon: 'restaurant-outline', color: '#FED7AA' },
        { id: '3', name: 'Dinner', icon: 'moon-outline', color: '#DBEAFE' },
        { id: '4', name: 'Desserts', icon: 'ice-cream-outline', color: '#FECACA' },
    ];

    const specialOffers = [
        {
            id: '1',
            title: '30% OFF',
            subtitle: 'On your first order',
            color: '#F59E0B',
            image: require('@/assets/images/breakfast.png'),
        },
        {
            id: '2',
            title: 'Free Delivery',
            subtitle: 'Orders above $20',
            color: '#B91C1C',
            image: require('@/assets/images/lunch.png'),
        },
    ];

    useEffect(() => {
        async function load() {
            try {
                const data = await getRestaurants();
                setRestaurants(data);
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-amber-50">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="px-5 pt-4 pb-3">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <View className="flex-row items-center gap-1">
                                <Ionicons name="location" size={18} color="#D97706" />
                                <Text className="text-sm font-semibold text-amber-700">
                                    Deliver to
                                </Text>
                            </View>
                            <TouchableOpacity className="flex-row items-center gap-1 mt-1">
                                <Text className="text-lg font-bold text-gray-900">Croatia</Text>
                                <Ionicons name="chevron-down" size={18} color="#111827" />
                            </TouchableOpacity>
                        </View>
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
                        <TouchableOpacity>
                            <Ionicons name="options-outline" size={20} color="#D97706" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Special Offers */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                        Special Offers 🔥
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="gap-3"
                    >
                        {specialOffers.map((offer) => (
                            <TouchableOpacity
                                key={offer.id}
                                className="rounded-2xl overflow-hidden mr-3"
                                style={{ backgroundColor: offer.color, width: 280, height: 140 }}
                                activeOpacity={0.8}
                            >
                                <View className="flex-row h-full">
                                    <View className="flex-1 p-4 justify-center">
                                        <Text className="text-2xl font-bold text-white mb-1">
                                            {offer.title}
                                        </Text>
                                        <Text className="text-white text-base mb-3">
                                            {offer.subtitle}
                                        </Text>
                                        <View className="bg-white/20 self-start px-4 py-2 rounded-full">
                                            <Text className="text-white font-semibold">Order Now</Text>
                                        </View>
                                    </View>
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

                {/* Categories */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                        Categories
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                className="bg-white rounded-2xl p-4 items-center shadow-sm"
                                style={{ width: '22%' }}
                                activeOpacity={0.7}
                            >
                                <View
                                    className="w-14 h-14 rounded-full items-center justify-center mb-2"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <Ionicons name={category.icon as any} size={28} color="#D97706" />
                                </View>
                                <Text className="text-xs font-semibold text-gray-900 text-center">
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* REAL Restaurants */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                        Popular Restaurants
                    </Text>

                    {loading && (
                        <ActivityIndicator size="large" color="#D97706" className="mt-4" />
                    )}

                    {!loading && restaurants.length === 0 && (
                        <Text className="text-center text-gray-500 mt-4">
                            No restaurants added yet.
                        </Text>
                    )}

                    {!loading &&
                        restaurants.map((restaurant) => (
                            <TouchableOpacity
                                key={restaurant.$id}
                                className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
                                activeOpacity={0.8}
                            >
                                {/* Restaurant Image */}
                                <Image
                                    source={{ uri: restaurant.photoUrl }}
                                    className="w-full h-40"
                                    resizeMode="cover"
                                />

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
