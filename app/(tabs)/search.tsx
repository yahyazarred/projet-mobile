import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useAppwrite from "@/lib/useAppwrite";
import { getCategories, getMenu } from "@/lib/appwrite";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useMemo } from "react";
import CartButton from "@/components/CartButton";
import cn from "clsx";
import MenuCard from "@/components/MenuCard";
import { MenuItem, Category } from "@/type";

import Filter from "@/components/Filter";
import SearchBar from "@/components/SearchBar";

const Search = () => {
    const { category, query } = useLocalSearchParams<{ query: string; category: string }>();

    // Memoize search params to prevent infinite loop
    const searchParams = useMemo(() => ({ category, query, limit: 6 }), [category, query]);

    // Fetch menu items
    const { data: menuItems, refetch, loading } = useAppwrite<MenuItem[], { category: string; query: string; limit: number }>({
        fn: getMenu,
        params: searchParams,
    });

    // Fetch categories
    const { data: categories } = useAppwrite<Category[]>({ fn: getCategories });

    // Prevent unnecessary refetches
    const prevParams = useRef(searchParams);

    useEffect(() => {
        if (
            prevParams.current.category !== category ||
            prevParams.current.query !== query
        ) {
            prevParams.current = { category, query, limit: 6 };
            refetch({ category, query, limit: 6 });
        }
    }, [category, query, refetch]);

    return (
        <SafeAreaView className="bg-white h-full">
            <FlatList
                data={menuItems}
                renderItem={({ item, index }) => {
                    const isFirstRightColItem = index % 2 === 0;

                    return (
                        <View className={cn("flex-1 max-w-[48%]", !isFirstRightColItem ? "mt-10" : "mt-0")}>
                            <MenuCard item={item} />
                        </View>
                    );
                }}
                keyExtractor={(item) => item.$id}
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

                        {categories && <Filter categories={categories} />}
                    </View>
                )}
                ListEmptyComponent={() => !loading && <Text>No results</Text>}
            />
        </SafeAreaView>
    );
};

export default Search;
