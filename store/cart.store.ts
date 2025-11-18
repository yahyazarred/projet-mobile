// store/cart.store.ts
import { create } from "zustand";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string; // ← Changé de "image" à "image_url" pour correspondre à CartItemType
    restaurantId: string;
    customizations?: any; // ← Changé de string[] à any pour plus de flexibilité
}

interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    removeItem: (id: string, customizations?: any) => void; // ← Ajouté customizations
    updateQuantity: (id: string, quantity: number) => void;
    increaseQty: (id: string, customizations?: any) => void; // ← NOUVEAU
    decreaseQty: (id: string, customizations?: any) => void; // ← NOUVEAU
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],

    addItem: (item) => {
        // Comparaison qui prend en compte les customizations
        const existingItem = get().items.find(
            (i) => i.id === item.id &&
                JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
        );

        if (existingItem) {
            // If item exists, increment quantity
            set({
                items: get().items.map((i) =>
                    i.id === item.id &&
                    JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
                        ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                        : i
                ),
            });
        } else {
            // Add new item with quantity
            set({
                items: [...get().items, { ...item, quantity: item.quantity || 1 }],
            });
        }
    },

    removeItem: (id, customizations) => {
        set({
            items: get().items.filter(
                (item) => !(item.id === id &&
                    JSON.stringify(item.customizations) === JSON.stringify(customizations))
            )
        });
    },

    updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
            get().removeItem(id);
        } else {
            set({
                items: get().items.map((item) =>
                    item.id === id ? { ...item, quantity } : item
                ),
            });
        }
    },

    // ← NOUVELLE MÉTHODE
    increaseQty: (id, customizations) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id &&
                JSON.stringify(item.customizations) === JSON.stringify(customizations)
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ),
        }));
    },

    // ← NOUVELLE MÉTHODE
    decreaseQty: (id, customizations) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id &&
                JSON.stringify(item.customizations) === JSON.stringify(customizations)
                    ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                    : item
            ),
        }));
    },

    clearCart: () => {
        set({ items: [] });
    },

    getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
    },

    getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
    },
}));