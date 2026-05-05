import { create } from "zustand";
import { CartItem, MenuItem } from "../types";

interface CartStore {
  cart: CartItem[];
  addToCart: (menuItem: MenuItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],

  addToCart: (menuItem: MenuItem) => {
    const { cart } = get();
    const existingItem = cart.find((item) => item.menuItem.id === menuItem.id);

    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      });
    } else {
      set({ cart: [...cart, { menuItem, quantity: 1, note: undefined }] });
    }
  },

  removeFromCart: (menuItemId: string) => {
    const { cart } = get();
    set({ cart: cart.filter((item) => item.menuItem.id !== menuItemId) });
  },

  updateQuantity: (menuItemId: string, quantity: number) => {
    const { cart } = get();
    if (quantity <= 0) {
      set({ cart: cart.filter((item) => item.menuItem.id !== menuItemId) });
    } else {
      set({
        cart: cart.map((item) =>
          item.menuItem.id === menuItemId ? { ...item, quantity } : item,
        ),
      });
    }
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getCartCount: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0,
    );
  },
}));
