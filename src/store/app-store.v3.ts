/**
 * CEYLON-PAY POS v3.0 - STATE MACHINE
 * Context-Aware Keyboard State Machine
 */

import { create } from 'zustand';
import type { Product, Customer, Order } from '../lib/db-types';
import { DEFAULT_PERMISSIONS } from '../lib/db-types';

// POS Window Modes - Context for keyboard commands
export type POSWindowMode = 
  | 'MAIN' 
  | 'TENDER' 
  | 'RECALL' 
  | 'CUSTOMER_LOOKUP' 
  | 'PRODUCT_LOOKUP' 
  | 'MANAGER_OVERRIDE' 
  | 'RETURN_MODE'
  | 'ON_THE_FLY'
  | 'CASH_PAID_OUT';

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

interface ParkedTransaction {
  id: string;
  cart: CartItem[];
  timestamp: number;
  customer_id?: string;
  cashier_name: string;
}

interface AppState {
  // === SCREEN STATE ===
  currentScreen: AppScreen;
  theme: Theme;
  
  // === AUTH STATE ===
  isAuthenticated: boolean;
  currentUser: string | null;
  currentUserPin: string | null;
  userRole: 'CASHIER' | 'MANAGER' | 'ADMIN' | null;
  userPermissions: typeof DEFAULT_PERMISSIONS.CASHIER | null;
  
  // === POS STATE MACHINE ===
  posMode: POSWindowMode;
  isReturnMode: boolean;
  
  // === CART STATE ===
  cart: CartItem[];
  cartCustomer: Customer | null;
  
  // === TRANSACTION STATE ===
  parkedTransactions: ParkedTransaction[];
  currentShiftId: string | null;
  
  // === TENDER STATE ===
  amountTenderedCents: number;
  changeDueCents: number;
  
  // === MANAGER OVERRIDE ===
  managerOverrideActive: boolean;
  managerOverrideExpiry: number | null;
  
  // === MODAL STATE ===
  modalData: any;
  
  // === ACTIONS ===
  
  // Screen
  setScreen: (screen: AppScreen) => void;
  toggleTheme: () => void;
  
  // Auth
  setAuthenticated: (user: string, pin: string, role: 'CASHIER' | 'MANAGER' | 'ADMIN') => void;
  logout: () => void;
  
  // POS Mode
  setPosMode: (mode: POSWindowMode) => void;
  toggleReturnMode: () => void;
  
  // Cart
  addToCart: (product: Product, quantity?: number) => void;
  updateLastItemQuantity: (qty: number) => boolean;
  overrideLastItemPrice: (priceCents: number) => { success: boolean; error?: string };
  removeFromCart: (productId: string) => void;
  voidCart: () => void;
  clearCart: () => void;
  
  // Customer
  setCartCustomer: (customer: Customer | null) => void;
  
  // Parked Transactions
  parkTransaction: () => string;
  recallTransaction: (id: string) => boolean;
  voidParkedTransaction: (id: string) => void;
  
  // Tender
  setAmountTendered: (cents: number) => void;
  resetTender: () => void;
  
  // Manager Override
  activateManagerOverride: (durationSeconds: number) => void;
  deactivateManagerOverride: () => void;
  checkManagerOverride: () => boolean;
  
  // Modal Data
  setModalData: (data: any) => void;
  
  // On-The-Fly Product
  addOnTheFlyProduct: (barcode: string, name: string, priceCents: number) => Promise<Product>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  currentScreen: 'login',
  theme: 'dark',
  
  isAuthenticated: false,
  currentUser: null,
  currentUserPin: null,
  userRole: null,
  userPermissions: null,
  
  posMode: 'MAIN',
  isReturnMode: false,
  
  cart: [],
  cartCustomer: null,
  
  parkedTransactions: [],
  currentShiftId: null,
  
  amountTenderedCents: 0,
  changeDueCents: 0,
  
  managerOverrideActive: false,
  managerOverrideExpiry: null,
  
  modalData: null,

  // === ACTIONS ===
  
  setScreen: (screen) => set({ currentScreen: screen }),
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('ceylonpay-theme', newTheme);
    return { theme: newTheme };
  }),
  
  setAuthenticated: (user, pin, role) => set({
    isAuthenticated: true,
    currentUser: user,
    currentUserPin: pin,
    userRole: role,
    userPermissions: DEFAULT_PERMISSIONS[role],
    currentScreen: 'pos',
    posMode: 'MAIN',
  }),
  
  logout: () => set({
    isAuthenticated: false,
    currentUser: null,
    currentUserPin: null,
    userRole: null,
    userPermissions: null,
    currentScreen: 'login',
    posMode: 'MAIN',
    cart: [],
    cartCustomer: null,
    isReturnMode: false,
    managerOverrideActive: false,
  }),
  
  setPosMode: (mode) => set({ posMode: mode }),
  
  toggleReturnMode: () => set((state) => ({ 
    isReturnMode: !state.isReturnMode 
  })),
  
  addToCart: (product, quantity = 1) => set((state) => {
    const multiplier = state.isReturnMode ? -1 : 1;
    const finalQty = quantity * multiplier;
    const unitPrice = product.price_cents;
    
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
    }
    
    return {
      cart: [...state.cart, {
        product,
        quantity: finalQty,
        unit_price_cents: unitPrice,
        original_price_cents: unitPrice,
        is_price_overridden: false,
        subtotal_cents: Math.round(unitPrice * finalQty),
      }],
    };
  }),
  
  updateLastItemQuantity: (qty) => {
    const state = get();
    if (state.cart.length === 0) return false;
    
    set((state) => {
      const newCart = [...state.cart];
      const lastItem = newCart[newCart.length - 1];
      
      if (lastItem) {
        const newQty = state.isReturnMode ? -Math.abs(qty) : Math.abs(qty);
        lastItem.quantity = newQty;
        lastItem.subtotal_cents = Math.round(lastItem.unit_price_cents * newQty);
      }
      
      return { cart: newCart };
    });
    
    return true;
  },
  
  overrideLastItemPrice: (priceCents) => {
    const state = get();
    
    if (state.cart.length === 0) {
      return { success: false, error: 'No items in cart' };
    }
    
    const lastItem = state.cart[state.cart.length - 1];
    const originalPrice = lastItem.original_price_cents;
    const discountPercent = originalPrice > 0 
      ? ((originalPrice - priceCents) / originalPrice) * 100 
      : 0;
    
    // Check permissions (including manager override)
    const permissions = state.userPermissions;
    const effectiveMaxDiscount = state.managerOverrideActive 
      ? 100 
      : (permissions?.max_discount_percent ?? 0);
    
    if (!permissions?.can_give_discounts && !state.managerOverrideActive) {
      return { success: false, error: 'NO_PERMISSION' };
    }
    
    if (discountPercent > effectiveMaxDiscount) {
      return { 
        success: false, 
        error: `EXCEEDS_LIMIT:${effectiveMaxDiscount}` 
      };
    }
    
    set((state) => {
      const newCart = [...state.cart];
      const item = newCart[newCart.length - 1];
      
      if (item) {
        item.unit_price_cents = priceCents;
        item.is_price_overridden = true;
        item.subtotal_cents = Math.round(priceCents * item.quantity);
      }
      
      return { cart: newCart };
    });
    
    return { success: true };
  },
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.product.id !== productId),
  })),
  
  voidCart: () => set({ cart: [], cartCustomer: null }),
  clearCart: () => set({ cart: [], cartCustomer: null, isReturnMode: false }),
  
  setCartCustomer: (customer) => set({ cartCustomer: customer }),
  
  parkTransaction: () => {
    const state = get();
    const id = `PK${Date.now().toString(36).toUpperCase()}`;
    
    set((state) => ({
      parkedTransactions: [...state.parkedTransactions, {
        id,
        cart: [...state.cart],
        timestamp: Date.now(),
        customer_id: state.cartCustomer?.id,
        cashier_name: state.currentUser || 'Unknown',
      }],
      cart: [],
      cartCustomer: null,
    }));
    
    return id;
  },
  
  recallTransaction: (id) => {
    const state = get();
    const parked = state.parkedTransactions.find(t => t.id === id);
    
    if (!parked) return false;
    
    set({
      cart: parked.cart,
      parkedTransactions: state.parkedTransactions.filter(t => t.id !== id),
    });
    
    return true;
  },
  
  voidParkedTransaction: (id) => set((state) => ({
    parkedTransactions: state.parkedTransactions.filter(t => t.id !== id),
  })),
  
  setAmountTendered: (cents) => {
    const state = get();
    const total = state.cart.reduce((sum, item) => sum + item.subtotal_cents, 0);
    set({ 
      amountTenderedCents: cents,
      changeDueCents: cents - total,
    });
  },
  
  resetTender: () => set({
    amountTenderedCents: 0,
    changeDueCents: 0,
  }),
  
  activateManagerOverride: (durationSeconds) => set({
    managerOverrideActive: true,
    managerOverrideExpiry: Date.now() + (durationSeconds * 1000),
  }),
  
  deactivateManagerOverride: () => set({
    managerOverrideActive: false,
    managerOverrideExpiry: null,
  }),
  
  checkManagerOverride: () => {
    const state = get();
    if (!state.managerOverrideActive) return false;
    if (state.managerOverrideExpiry && Date.now() > state.managerOverrideExpiry) {
      set({ managerOverrideActive: false, managerOverrideExpiry: null });
      return false;
    }
    return true;
  },
  
  setModalData: (data) => set({ modalData: data }),
  
  addOnTheFlyProduct: async (barcode, name, priceCents) => {
    // Create a generic "On-The-Fly" product
    const product = await (await import('../lib/db')).db.addProduct({
      sku: barcode,
      name: name || `Item ${barcode}`,
      price_cents: priceCents,
      costing_method: 'WAC',
      current_wac_cents: Math.round(priceCents * 0.7),
      stock_level: 0,
      min_stock_alert: 0,
      unit_type: 'pcs',
    });
    
    return product;
  },
}));

// Theme initialization
const savedTheme = localStorage.getItem('ceylonpay-theme') as Theme | null;
if (savedTheme) {
  useAppStore.setState({ theme: savedTheme });
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
} else {
  document.documentElement.classList.add('dark');
}
