import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  restaurant_id: string | null;
  restaurant_name: string | null;
  delivery_fee: number;
  addItem: (item: CartItem, restaurantName: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurant_id: null,
      restaurant_name: null,
      delivery_fee: 0,

      addItem: (item: CartItem, restaurantName: string) => {
        const { items, restaurant_id } = get();

        // Si el carrito tiene items de otro restaurante, limpiar primero
        if (restaurant_id && restaurant_id !== item.restaurant_id) {
          set({
            items: [item],
            restaurant_id: item.restaurant_id,
            restaurant_name: restaurantName,
          });
          return;
        }

        const existingItem = items.find((i) => i.id === item.id);
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, quantity: 1 }],
            restaurant_id: item.restaurant_id,
            restaurant_name: restaurantName,
          });
        }
      },

      removeItem: (id: string) => {
        const { items } = get();
        const newItems = items.filter((i) => i.id !== id);
        set({
          items: newItems,
          restaurant_id: newItems.length === 0 ? null : get().restaurant_id,
          restaurant_name:
            newItems.length === 0 ? null : get().restaurant_name,
        });
      },

      updateQuantity: (id: string, quantity: number) => {
        const { items } = get();
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => {
        set({ items: [], restaurant_id: null, restaurant_name: null, delivery_fee: 0 });
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotal: () => {
        return get().getSubtotal() + get().delivery_fee;
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "pinolapp-cart",
    }
  )
);
