/**
 * GLOBAL STATE VAULT
 * Zustand store for app-wide state management
 */

import { create } from 'zustand';
import type { Product, Order, Customer, Shift, UserRole } from '../lib/db-types';

export type Theme = 'light' | 'dark';
export type AppScreen = 'login' | 'pos' | 'backoffice' | 'god-mode';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

interface AppState {
  // Authentication
  isAuthenticated: boolean;
  currentUser: string | null;
  userRole: UserRole | null;
  
  // UI State
  theme: Theme;
  currentScreen: AppScreen;
  
  // Current Session
  currentShift: Shift | null;
  currentOrder: Order | null;
  cart: CartItem[];
  
  // Modals
  showSplitPaymentModal: boolean;
  showCustomerModal: boolean;
  
  // Refund Mode
  isRefundMode: boolean;
  
  // Actions
  setAuthenticated: (user: string, role: UserRole) => void;
  logout: () => void;
  toggleTheme: () => void;
  setScreen: (screen: AppScreen) => void;
  
  setCurrentShift: (shift: Shift | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  toggleSplitPaymentModal: () => void;
  toggleCustomerModal: () => void;
  toggleRefundMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial State
  isAuthenticated: false,
  currentUser: null,
  userRole: null,
  theme: 'dark',
  currentScreen: 'login',
  currentShift: null,
  currentOrder: null,
  cart: [],
  showSplitPaymentModal: false,
  showCustomerModal: false,
  isRefundMode: false,
  
  // Actions
  setAuthenticated: (user, role) => set({ 
    isAuthenticated: true, 
    currentUser: user, 
    userRole: role,
    currentScreen: (role === 'MANAGER' || role === 'ADMIN') ? 'backoffice' : 'pos'
  }),
  
  logout: () => set({
    isAuthenticated: false,
    currentUser: null,
    userRole: null,
    currentScreen: 'login',
    currentShift: null,
    currentOrder: null,
    cart: [],
  }),
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    // Update document class for Tailwind
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    return { theme: newTheme };
  }),
  
  setScreen: (screen) => set({ currentScreen: screen }),
  
  setCurrentShift: (shift) => set({ currentShift: shift }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  addToCart: (product, quantity) => set((state) => {
    const multiplier = state.isRefundMode ? -1 : 1;
    const finalQty = quantity * multiplier;
    const unitPrice = product.price_cents;
    const subtotal = Math.round(unitPrice * finalQty);
    
    // Check if product already in cart
    const existingIndex = state.cart.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      const newCart = [...state.cart];
      const existing = newCart[existingIndex];
      const newQty = existing.quantity + finalQty;
      
      if (newQty === 0) {
        // Remove item if quantity reaches zero
        newCart.splice(existingIndex, 1);
      } else {
        newCart[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal_cents: Math.round(unitPrice * newQty),
        };
      }
      
      return { cart: newCart };
    } else {
      return {
        cart: [...state.cart, {
          product,
          quantity: finalQty,
          unit_price_cents: unitPrice,
          subtotal_cents: subtotal,
        }],
      };
    }
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.product.id !== productId),
  })),
  
  updateCartQuantity: (productId, quantity) => set((state) => {
    const newCart = state.cart.map(item => {
      if (item.product.id === productId) {
        const subtotal = Math.round(item.unit_price_cents * quantity);
        return { ...item, quantity, subtotal_cents: subtotal };
      }
      return item;
    }).filter(item => item.quantity !== 0);
    
    return { cart: newCart };
  }),
  
  clearCart: () => set({ cart: [] }),
  
  toggleSplitPaymentModal: () => set((state) => ({
    showSplitPaymentModal: !state.showSplitPaymentModal,
  })),
  
  toggleCustomerModal: () => set((state) => ({
    showCustomerModal: !state.showCustomerModal,
  })),
  
  toggleRefundMode: () => set((state) => ({
    isRefundMode: !state.isRefundMode,
  })),
}));

// Initialize theme on load
const savedTheme = localStorage.getItem('ash-point-theme') as Theme | null;
if (savedTheme) {
  useAppStore.setState({ theme: savedTheme });
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
} else {
  // Default to dark
  document.documentElement.classList.add('dark');
}

// Persist theme changes
useAppStore.subscribe((state) => {
  localStorage.setItem('ash-point-theme', state.theme);
});
