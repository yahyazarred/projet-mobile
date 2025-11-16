import { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import type { LocationObject } from "expo-location";

export default function MapPage() {
    const [location, setLocation] = useState<LocationObject | null>(null);
    const [loading, setLoading] = useState(true);

    // Replace this with dynamic user-selected image later
    const profilePic = "https://i.pravatar.cc/300";

    useEffect(() => {
        (async () => {
            // Request location permission
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                alert("Permission denied");
                setLoading(false);
                return;
            }

            // Get current location
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            setLoading(false);
        })();
    }, []);

    if (loading || !location) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const { latitude, longitude } = location.coords;

    return (
        <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
        >
            {/* Custom Marker with circular image */}
            <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                <Image
                    source={{ uri: profilePic }}
                    style={{
                        width: 35,
                        height: 35,
                        borderRadius:60, // make the image itself circular
                        borderWidth: 3,
                        borderColor: 'red',
                    }}
                />
            </Marker>

        </MapView>
    );
}

const AVATAR_SIZE = 35;

const styles = StyleSheet.create({
    map: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    avatarContainer: {

        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
});
