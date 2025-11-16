import { SafeAreaView } from "react-native-safe-area-context";
import {
    FlatList,
    Image,
    Pressable,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CartButton from "@/components/CartButton";
import { images, offers } from "@/constants";
import useAuthStore from "@/store/auth.store";

export default function Index() {
    const { user } = useAuthStore();

    const categories = [
        { id: '1', name: 'Breakfast', icon: 'sunny-outline', color: '#FEF3C7' },
        { id: '2', name: 'Lunch', icon: 'restaurant-outline', color: '#FED7AA' },
        { id: '3', name: 'Dinner', icon: 'moon-outline', color: '#DBEAFE' },
        { id: '4', name: 'Desserts', icon: 'ice-cream-outline', color: '#FECACA' },
    ];

    const popularRestaurants = [
        {
            id: '1',
            name: 'Golden Fork',
            cuisine: 'Mediterranean',
            rating: 4.8,
            deliveryTime: '25-35',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'
        },
        {
            id: '2',
            name: 'Spice House',
            cuisine: 'Indian',
            rating: 4.6,
            deliveryTime: '30-40',
            image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400'
        },
        {
            id: '3',
            name: 'Pizza Palace',
            cuisine: 'Italian',
            rating: 4.9,
            deliveryTime: '20-30',
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'
        },
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
            color: '#10B981',
            image: require('@/assets/images/lunch.png'),
        },
    ];

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
                            placeholder="Search for restaurants or dishes..."
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 ml-3 text-gray-900 text-base"
                        />
                        <TouchableOpacity>
                            <Ionicons name="options-outline" size={20} color="#D97706" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Special Offers Banner */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                        Special Offers 🔥
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="gap-3"
                    >
                        {specialOffers.map((offer, index) => (
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

                {/* Popular Restaurants */}
                <View className="px-5 mb-6">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-xl font-bold text-gray-900">
                            Popular Restaurants
                        </Text>
                        <TouchableOpacity>
                            <Text className="text-amber-600 font-semibold">See All</Text>
                        </TouchableOpacity>
                    </View>

                    {popularRestaurants.map((restaurant) => (
                        <TouchableOpacity
                            key={restaurant.id}
                            className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
                            activeOpacity={0.8}
                        >
                            <Image
                                source={{ uri: restaurant.image }}
                                className="w-full h-40"
                                resizeMode="cover"
                            />
                            <View className="p-4">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-gray-900 mb-1">
                                            {restaurant.name}
                                        </Text>
                                        <Text className="text-sm text-gray-600">
                                            {restaurant.cuisine}
                                        </Text>
                                    </View>
                                    <View className="bg-amber-50 px-2 py-1 rounded-lg flex-row items-center">
                                        <Ionicons name="star" size={14} color="#D97706" />
                                        <Text className="text-sm font-bold text-amber-700 ml-1">
                                            {restaurant.rating}
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center">
                                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                                    <Text className="text-sm text-gray-600 ml-1">
                                        {restaurant.deliveryTime} min
                                    </Text>
                                    <View className="w-1 h-1 bg-gray-400 rounded-full mx-2" />
                                    <Ionicons name="bicycle-outline" size={16} color="#6B7280" />
                                    <Text className="text-sm text-gray-600 ml-1">
                                        Free delivery
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}