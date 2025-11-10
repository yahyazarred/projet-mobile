import { Redirect, Tabs } from "expo-router";
import useAuthStore from "@/store/auth.store";
import { TabBarIconProps } from "@/type";
import { Image, Text, View } from "react-native";
import { images } from "@/constants";
import cn from "clsx";

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View style={{ alignItems: 'center' }}>
        <Image
            source={icon}
            style={{ width: 40, height: 40, tintColor: focused ? 'gray' : 'gray' }}
        />
        <Text style={{ color: focused ? 'gray' : 'gray', fontSize: 12 }}>{title}</Text>
    </View>
);


export default function TabLayout() {
    const { isAuthenticated } = useAuthStore();

    // ---- TEMP DEV BYPASS: set to `true` to skip auth checks ----
    const DEV_BYPASS_AUTH = true;

    if (!DEV_BYPASS_AUTH && !isAuthenticated) return <Redirect href="/sign-in" />;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    borderTopLeftRadius: 50,
                    borderTopRightRadius: 50,
                    borderBottomLeftRadius: 50,
                    borderBottomRightRadius: 50,
                    marginHorizontal: 20,
                    height: 80,
                    position: 'absolute',
                    bottom: 40,
                    backgroundColor: 'white',
                    shadowColor: '#1a1a1a',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 5,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center'
                }
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Home" icon={images.home} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='search'
                options={{
                    title: 'Search',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Search" icon={images.search} focused={focused} />
                }}
            />

            <Tabs.Screen
                name='cart'
                options={{
                    title: 'Cart',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Cart" icon={images.bag} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Profile" icon={images.person} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='map'
                options={{
                    title: 'Map',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Map" icon={images.map} focused={focused} />
                }}
            />
        </Tabs>
    );
}
