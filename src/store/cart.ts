import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  baseId: string;
  baseName: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  items: [],
  addItem: (item) => {
    const id = `${item.productId}-${item.baseId}`;
    set((state) => {
      const existingItem = state.items.find((i) => i.id === id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, id }] };
    });
  },
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
      ),
    })),
  clearCart: () => set({ items: [] }),
  getTotalPrice: () =>
    get().items.reduce((total, item) => total + item.price * item.quantity, 0),
  getTotalItems: () =>
    get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: 'stakd-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
