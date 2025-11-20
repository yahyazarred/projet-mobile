import {FlatList, Text, View} from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import useAppwrite from "@/lib/useAppwrite";
import {getCategories, getMenu} from "@/lib/appwrite";
import {useLocalSearchParams} from "expo-router";
import {useEffect} from "react";
import CartButton from "@/components/CartButton";
import cn from "clsx";
import MenuCard from "@/components/MenuCard";
import {MenuItem, Category} from "@/type";
import Filter from "@/components/Filter";
import SearchBar from "@/components/SearchBar";

const Search = () => {
    const { category, query } = useLocalSearchParams<{query: string; category: string}>()

    const { data, refetch, loading } = useAppwrite({ fn: getMenu, params: { category, query, limit: 6 } });
    const { data: categories } = useAppwrite({ fn: getCategories });

    useEffect(() => {
        refetch({ category, query, limit: 6 });
        console.log("Category:", category);
        console.log("Query:", query);
        console.log("Fetched menu:", data);

        // ⚠️ DEBUG: Check if restaurantId is present in menu items
        if (data && data.length > 0) {
            console.log("🔍 First menu item structure:", {
                id: data[0].$id,
                name: data[0].name,
                restaurantId: data[0].restaurantId, // ⚠️ Check this value!
                price: data[0].price
            });

            if (!data[0].restaurantId) {
                console.error("❌ CRITICAL: Menu items missing restaurantId field!");
                console.error("❌ Your menu_items collection needs a restaurantId attribute");
            }
        }
    }, [category, query]);

    return (
        <SafeAreaView className="bg-white h-full">
            <FlatList
                data={data}
                renderItem={({ item, index }) => {
                    const isFirstRightColItem = index % 2 === 0;

                    // ⚠️ CRITICAL: Validate restaurantId
                    const restaurantId = item.restaurantId;

                    if (!restaurantId || restaurantId === "unknown") {
                        console.error("❌ Menu item missing valid restaurantId:", {
                            itemId: item.$id,
                            itemName: item.name,
                            restaurantId: restaurantId
                        });
                    }

                    return (
                        <View className={cn("flex-1 max-w-[48%]", !isFirstRightColItem ? 'mt-10': 'mt-0')}>
                            <MenuCard
                                item={item as MenuItem}
                                restaurantId={restaurantId || "unknown"} // This will show error in logs if missing
                            />
                        </View>
                    )
                }}
                keyExtractor={item => item.$id}
                numColumns={2}
                columnWrapperClassName="gap-7"
                contentContainerClassName="gap-7 px-5 pb-32"
                ListHeaderComponent={() => (
                    <View className="my-5 gap-5">
                        <View className="flex-between flex-row w-full">
                            <View className="flex-start">
                                <Text className="small-bold uppercase text-primary">Search</Text>
                                <View className="flex-start flex-row gap-x-1 mt-0.5">
                                    <Text className="paragraph-semibold text-dark-100">Find your favorite food</Text>
                                </View>
                            </View>

                            <CartButton />
                        </View>

                        <SearchBar />

                        <Filter categories={(categories as Category[]) || []} />
                    </View>
                )}
                ListEmptyComponent={() => !loading && <Text>No results</Text>}
            />
        </SafeAreaView>
    )
}

export default Search