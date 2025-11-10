// app/map.tsx
import { View, Text, StyleSheet } from "react-native";

export default function MapPage() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Map Page</Text>
            {/* You can replace this with a Map component like react-native-maps */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
    },
});
