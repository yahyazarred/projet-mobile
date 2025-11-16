import { Tabs } from "expo-router";
import { Image, Text, View, ImageSourcePropType } from "react-native";
import { images } from "@/constants";

const ACTIVE_COLOR = "#df5a0c";
const INACTIVE_COLOR = "#999";

// Reuse the TabBarIcon with proper styling
interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Image
            source={icon}
            style={{
                width: 26,
                height: 26,
                tintColor: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
                marginBottom: 2,
            }}
        />
        <Text
            style={{
                color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
                fontSize: 9,
                fontWeight: focused ? "600" : "400",
            }}
        >
            {title}
        </Text>
    </View>
);

export default function OwnerTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                    height: 60,
                    backgroundColor: "#fff",
                    borderRadius: 30,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 8,
                    flexDirection: "row",
                    justifyContent: "space-around",
                    alignItems: "center",
                    paddingHorizontal: 0,
                },
            }}
        >
            {[
                { name: "restaurant-profile", title: "Profile", icon: images.person },
                { name: "menu", title: "Menu", icon: images.bag },
                { name: "orders", title: "Orders", icon: images.home },
            ].map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <TabBarIcon title={tab.title} icon={tab.icon} focused={focused} />
                            </View>
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}
