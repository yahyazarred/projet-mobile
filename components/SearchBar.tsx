// Import images (icons, assets…) from constants
import { images } from "@/constants";

// Import Expo Router utilities and URL params hook
import { router, useLocalSearchParams } from "expo-router";

// Import React and useState hook
import React, { useState } from "react";

// Import React Native components
import { Image, TextInput, TouchableOpacity, View } from "react-native";

// Search bar component
const Searchbar = () => {

    // Get the "query" parameter from the URL (e.g. ?query=pizza)
    const params = useLocalSearchParams<{ query: string }>();

    // Local state to store the search input value
    const [query, setQuery] = useState(params.query);

    // Called every time the text changes
    const handleSearch = (text: string) => {
        setQuery(text); // Update local state

        // If input is empty, remove the query from URL params
        if (!text) router.setParams({ query: undefined });
    };

    // Called when the user submits the search (keyboard search button)
    const handleSubmit = () => {
        // Only update the URL if the query is not empty
        if (query.trim()) router.setParams({ query });
    };

    return (
        // Main container for the search bar
        <View className="searchbar">

            {/* Text input field */}
            <TextInput
                className="flex-1 p-5"
                placeholder="Search for pizzas, burgers..."
                value={query}
                onChangeText={handleSearch}
                onSubmitEditing={handleSubmit}
                placeholderTextColor="#A0A0A0"
                returnKeyType="search"
            />

            {/* Search button */}
            <TouchableOpacity
                className="pr-5"
                onPress={() => router.setParams({ query })}
            >
                <Image
                    source={images.search}
                    className="size-6"
                    resizeMode="contain"
                    tintColor="#5D5F6D"
                />
            </TouchableOpacity>

        </View>
    );
};

// Export the component
export default Searchbar;
