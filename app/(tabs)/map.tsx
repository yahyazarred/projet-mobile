import { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image, Platform } from "react-native";
import * as Location from "expo-location";
import type { LocationObject } from "expo-location";

// Only import maps on native platforms
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== 'web') {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

export default function MapPage() {
    const [location, setLocation] = useState<LocationObject | null>(null);
    const [loading, setLoading] = useState(true);

    const profilePic = "https://i.pravatar.cc/300";

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                alert("Permission denied");
                setLoading(false);
                return;
            }

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

    // Show message on web
    if (Platform.OS === 'web') {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 18, color: '#666' }}>
                    📱 Map is only available on mobile devices
                </Text>
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
            <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                <Image
                    source={{ uri: profilePic }}
                    style={{
                        width: 35,
                        height: 35,
                        borderRadius: 60,
                        borderWidth: 3,
                        borderColor: 'red',
                    }}
                />
            </Marker>
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
});