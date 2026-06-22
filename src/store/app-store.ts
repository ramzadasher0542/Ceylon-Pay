/**
 * GLOBAL STATE VAULT - v2.5 CLI Enterprise
 * Zustand store for app-wide state management
 */

import { create } from 'zustand';
import type { Product, Customer, Shift, UserRole } from '../lib/db-types';
import { DEFAULT_PERMISSIONS } from '../lib/db-types';

export type Theme = 'light' | 'dark';
export type AppScreen = 'login' | 'pos' | 'backoffice' | 'god-mode';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price_cents: number;
  original_price_cents: number;
  is_price_overridden: boolean;
  subtotal_cents: number;
}

interface ParkedBill {
  id: string;
  cart: CartItem[];
  timestamp: number;
}

interface AppState {
  // Authentication
  isAuthenticated: boolean;
  currentUser: string | null;
  userRole: UserRole | null;
  userPermissions: typeof DEFAULT_PERMISSIONS.CASHIER | null;
  
  // UI State
  theme: Theme;
  currentScreen: AppScreen;
  
  // Current Session
  currentShift: Shift | null;
  currentShiftId: string | null;
  shiftOpeningFloat: number;
  currentOrder: Order | null;
  selectedCustomer: Customer | null;
  
  // Cart
  cart: CartItem[];
  
  // Parked Bills
  parkedBills: ParkedBill[];
  
  // Modals
  showSplitPaymentModal: boolean;
  showCustomerModal: boolean;
  showTenderModal: boolean;
  showCustomerSelectModal: boolean;
  showShiftModal: boolean;
  showAdminOverrideModal: boolean;
  
  // Refund Mode
  isRefundMode: boolean;
  
  // Tender Info
  lastTenderedAmount: number;
  lastChangeDue: number;
  
  // Actions
  setAuthenticated: (user: string, role: UserRole) => void;
  logout: () => void;
  toggleTheme: () => void;
  setScreen: (screen: AppScreen) => void;
  
  setCurrentShift: (shift: Shift | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  setLastItemQuantity: (qty: number) => void;
  overrideLastItemPrice: (newPriceCents: number) => { success: boolean; error?: string };
  clearCart: () => void;
  
  // Parked Bills
  parkBill: () => string;
  recallBill: (id: string) => boolean;
  deleteParkedBill: (id: string) => void;
  
  // Modals
  toggleSplitPaymentModal: () => void;
  toggleCustomerModal: () => void;
  toggleTenderModal: () => void;
  toggleCustomerSelectModal: () => void;
  toggleShiftModal: () => void;
  toggleRefundMode: () => void;
  
  // Tender
  setTenderInfo: (tendered: number, change: number) => void;
  
  // Shift
  openShift: (floatCents: number, shiftId: string) => void;
  closeShift: () => void;
}

interface Order {
  id: string;
  timestamp: number;
  total_cents: number;
  status: string;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  isAuthenticated: false,
  currentUser: null,
  userRole: null,
  userPermissions: null,
  theme: 'dark',
  currentScreen: 'login',
  currentShift: null,
  currentShiftId: null,
  shiftOpeningFloat: 0,
  currentOrder: null,
  selectedCustomer: null,
  cart: [],
  parkedBills: [],
  showSplitPaymentModal: false,
  showCustomerModal: false,
  showTenderModal: false,
  showCustomerSelectModal: false,
  showShiftModal: false,
  showAdminOverrideModal: false,
  isRefundMode: false,
  lastTenderedAmount: 0,
  lastChangeDue: 0,

  // Actions
  setAuthenticated: (user, role) => set({ 
    isAuthenticated: true, 
    currentUser: user, 
    userRole: role,
    userPermissions: DEFAULT_PERMISSIONS[role],
    currentScreen: (role === 'MANAGER' || role === 'ADMIN') ? 'backoffice' : 'pos'
  }),
  
  logout: () => set({
    isAuthenticated: false,
    currentUser: null,
    userRole: null,
    userPermissions: null,
    currentScreen: 'login',
    currentShift: null,
    currentOrder: null,
    cart: [],
    selectedCustomer: null,
  }),
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    return { theme: newTheme };
  }),
  
  setScreen: (screen) => set({ currentScreen: screen }),
  
  setCurrentShift: (shift) => set({ currentShift: shift }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

  // Cart Actions
  addToCart: (product, quantity = 1) => set((state) => {
    const multiplier = state.isRefundMode ? -1 : 1;
    const finalQty = quantity * multiplier;
    const unitPrice = product.price_cents;
    const subtotal = Math.round(unitPrice * finalQty);
    
    const existingIndex = state.cart.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      const newCart = [...state.cart];
      const existing = newCart[existingIndex];
      const newQty = existing.quantity + finalQty;
      
      if (newQty === 0) {
        newCart.splice(existingIndex, 1);
      } else {
        newCart[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal_cents: Math.round(existing.unit_price_cents * newQty),
        };
      }
      
      return { cart: newCart };
    } else {
      return {
        cart: [...state.cart, {
          product,
          quantity: finalQty,
          unit_price_cents: unitPrice,
          original_price_cents: unitPrice,
          is_price_overridden: false,
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
  
  // CLI: Set last item quantity (=1.5)
  setLastItemQuantity: (qty) => set((state) => {
    if (state.cart.length === 0) return state;
    
    const newCart = [...state.cart];
    const lastItem = newCart[newCart.length - 1];
    
    if (lastItem) {
      const newQty = state.isRefundMode ? -Math.abs(qty) : qty;
      lastItem.quantity = newQty;
      lastItem.subtotal_cents = Math.round(lastItem.unit_price_cents * newQty);
    }
    
    return { cart: newCart };
  }),
  
  // CLI: Override last item price ($500)
  overrideLastItemPrice: (newPriceCents) => {
    const state = get();
    
    if (state.cart.length === 0) {
      return { success: false, error: 'No items in cart' };
    }
    
    const lastItem = state.cart[state.cart.length - 1];
    const originalPrice = lastItem.original_price_cents;
    
    // Calculate discount percentage
    const discountPercent = originalPrice > 0 
      ? ((originalPrice - newPriceCents) / originalPrice) * 100 
      : 0;
    
    // Check permissions
    const permissions = state.userPermissions;
    
    if (!permissions?.can_give_discounts) {
      return { success: false, error: 'No permission to give discounts' };
    }
    
    if (discountPercent > permissions.max_discount_percent) {
      return { 
        success: false, 
        error: `Discount exceeds ${permissions.max_discount_percent}% limit. Admin override required.` 
      };
    }
    
    // Apply price override
    set((state) => {
      const newCart = [...state.cart];
      const item = newCart[newCart.length - 1];
      
      if (item) {
        item.unit_price_cents = newPriceCents;
        item.is_price_overridden = true;
        item.subtotal_cents = Math.round(newPriceCents * item.quantity);
      }
      
      return { cart: newCart };
    });
    
    return { success: true };
  },
  
  clearCart: () => set({ cart: [], selectedCustomer: null }),
  
  // Parked Bills
  parkBill: () => {
    const state = get();
    const id = `PARK-${Date.now().toString(36).toUpperCase()}`;
    
    set((state) => ({
      parkedBills: [...state.parkedBills, {
        id,
        cart: [...state.cart],
        timestamp: Date.now(),
      }],
      cart: [],
    }));
    
    return id;
  },
  
  recallBill: (id) => {
    const state = get();
    const parked = state.parkedBills.find(b => b.id === id);
    
    if (!parked) return false;
    
    set({
      cart: parked.cart,
      parkedBills: state.parkedBills.filter(b => b.id !== id),
    });
    
    return true;
  },
  
  deleteParkedBill: (id) => set((state) => ({
    parkedBills: state.parkedBills.filter(b => b.id !== id),
  })),
  
  // Modals
  toggleSplitPaymentModal: () => set((state) => ({
    showSplitPaymentModal: !state.showSplitPaymentModal,
  })),
  
  toggleCustomerModal: () => set((state) => ({
    showCustomerModal: !state.showCustomerModal,
  })),
  
  toggleTenderModal: () => set((state) => ({
    showTenderModal: !state.showTenderModal,
  })),
  
  toggleCustomerSelectModal: () => set((state) => ({
    showCustomerSelectModal: !state.showCustomerSelectModal,
  })),
  
  toggleShiftModal: () => set((state) => ({
    showShiftModal: !state.showShiftModal,
  })),
  
  toggleRefundMode: () => set((state) => ({
    isRefundMode: !state.isRefundMode,
  })),
  
  setTenderInfo: (tendered, change) => set({
    lastTenderedAmount: tendered,
    lastChangeDue: change,
  }),
  
  openShift: (floatCents, shiftId) => set({
    shiftOpeningFloat: floatCents,
    currentShiftId: shiftId,
  }),
  
  closeShift: () => set({
    currentShiftId: null,
    shiftOpeningFloat: 0,
  }),
}));

// Initialize theme
const savedTheme = localStorage.getItem('ash-point-theme') as Theme | null;
if (savedTheme) {
  useAppStore.setState({ theme: savedTheme });
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
} else {
  document.documentElement.classList.add('dark');
}

// Persist theme
useAppStore.subscribe((state) => {
  localStorage.setItem('ash-point-theme', state.theme);
});
