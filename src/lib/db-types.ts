/**
 * STRICT DATABASE SCHEMA
 * Mirrors SQLite structure for future Tauri migration
 */

export type CostingMethod = 'WAC' | 'FIFO';
export type UnitType = 'pcs' | 'g' | 'cm' | 'kg' | 'L' | 'm';
export type OrderStatus = 'ACTIVE' | 'PARKED' | 'COMPLETED' | 'VOIDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'CREDIT';
export type UserRole = 'CASHIER' | 'MANAGER' | 'ADMIN';

export interface UserPermissions {
  can_access_pos: boolean;
  can_access_backoffice: boolean;
  can_access_settings: boolean;
  can_void_items: boolean;
  can_give_discounts: boolean;
  can_process_refunds: boolean;
  can_adjust_stock: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  can_close_shift: boolean;
  max_discount_percent: number;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  CASHIER: {
    can_access_pos: true,
    can_access_backoffice: false,
    can_access_settings: false,
    can_void_items: true,
    can_give_discounts: false,
    can_process_refunds: false,
    can_adjust_stock: false,
    can_view_reports: false,
    can_manage_users: false,
    can_close_shift: false,
    max_discount_percent: 0,
  },
  MANAGER: {
    can_access_pos: true,
    can_access_backoffice: true,
    can_access_settings: false,
    can_void_items: true,
    can_give_discounts: true,
    can_process_refunds: true,
    can_adjust_stock: true,
    can_view_reports: true,
    can_manage_users: false,
    can_close_shift: true,
    max_discount_percent: 20,
  },
  ADMIN: {
    can_access_pos: true,
    can_access_backoffice: true,
    can_access_settings: true,
    can_void_items: true,
    can_give_discounts: true,
    can_process_refunds: true,
    can_adjust_stock: true,
    can_view_reports: true,
    can_manage_users: true,
    can_close_shift: true,
    max_discount_percent: 100,
  },
};
export type AdjustmentReason = 'WASTAGE' | 'DAMAGE' | 'THEFT' | 'COUNT_CORRECTION' | 'RETURN_TO_VENDOR' | 'OTHER';

export interface Product {
  id: string; // UUID
  sku: string;
  name: string;
  price_cents: number;
  costing_method: CostingMethod;
  current_wac_cents: number;
  stock_level: number; // Allows negatives (Ghost Stock)
  min_stock_alert: number;
  unit_type: UnitType;
  created_at: number; // Unix timestamp
}

export interface Order {
  id: string; // Short alphanumeric for barcode
  timestamp: number; // Unix timestamp
  total_cents: number;
  status: OrderStatus;
  customer_id?: string; // Optional FK
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number; // Can be negative for refunds
  unit_price_cents: number; // Locked at time of sale
  subtotal_cents: number; // qty * unit_price
}

export interface OrderPayment {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  amount_cents: number;
  timestamp: number;
}

export interface Customer {
  id: string;
  phone_number: string; // Unique
  name: string;
  outstanding_debt_cents: number; // The "Naya" credit ledger
  created_at: number;
}

export interface User {
  id: string;
  pin: string; // 4-digit PIN
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  is_active: boolean;
  created_at: number;
  created_by?: string; // Admin who created this user
}

export interface Shift {
  id: string;
  user_id: string; // FK to users
  opened_at: number;
  closed_at?: number; // Null if still open
  opening_cash_cents: number;
  actual_closing_cash_cents?: number;
  cashier_name: string;
}

export interface StockAdjustment {
  id: string;
  product_id: string;
  timestamp: number;
  quantity_change: number; // Positive or negative
  reason: AdjustmentReason;
  reason_notes?: string;
  user_pin: string; // Who made the adjustment
  old_stock: number;
  new_stock: number;
}

export interface StockBatch {
  id: string;
  product_id: string;
  quantity: number;
  cost_cents: number; // Cost per unit
  received_date: number;
  supplier_name?: string;
  remaining_quantity: number; // For FIFO tracking
}

export interface PurchaseOrder {
  id: string;
  supplier_name: string;
  order_date: number;
  expected_date?: number;
  received_date?: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  total_cost_cents: number;
  notes?: string;
}

export interface POItem {
  id: string;
  po_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  cost_per_unit_cents: number;
}

export interface KitBundle {
  id: string;
  kit_product_id: string; // The sellable "kit" SKU
  component_product_id: string; // Individual item that makes up the kit
  quantity_required: number; // How many of this component per kit
}

export interface AuditLog {
  id: string;
  timestamp: number;
  user_pin: string;
  action: 'LOGIN' | 'SALE' | 'VOID' | 'REFUND' | 'DISCOUNT' | 'DRAWER_KICK' | 'PRICE_OVERRIDE' | 'STOCK_ADJUST';
  details: string; // JSON string
  order_id?: string;
}

export interface LoyaltyCard {
  id: string;
  customer_id: string;
  points_balance: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  created_at: number;
}

export interface BusinessIdentity {
  store_name: string;
  business_registration_number?: string;
  tax_identification_number?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code?: string;
  phone_number: string;
  email?: string;
  footer_text: string;
  logo_path?: string; // Path to thermal logo .bmp
}

export interface ThermalPrinterConfig {
  enabled: boolean;
  driver_type: 'WINDOWS' | 'LINUX' | 'ESC_POS';
  paper_width: 58 | 80; // mm
  com_port?: string; // e.g., 'COM3', '/dev/ttyUSB0'
  baud_rate: number; // e.g., 9600, 115200
}

export interface CashDrawerConfig {
  enabled: boolean;
  connection_type: 'RJ11' | 'USB';
  com_port?: string;
  kick_code: string; // ESC/POS hex code, e.g., '1B7000FA'
}

export interface SMTPConfig {
  enabled: boolean;
  server: string; // e.g., 'smtp.gmail.com'
  port: number; // e.g., 587
  sender_email: string;
  sender_password: string; // App password
  auto_send_zreport: boolean;
  recipient_emails: string[]; // Comma-separated
}

export interface TaxConfig {
  vat_enabled: boolean;
  vat_rate: number; // e.g., 15 for 15%
  vat_inclusive: boolean; // true = price includes VAT
  sscl_enabled: boolean; // Special Sales & Consumption Levy
  sscl_rate: number;
}

export interface CloudSyncConfig {
  enabled: boolean;
  server_url?: string;
  api_key?: string;
  sync_interval_minutes: number; // e.g., 60 = hourly
  last_sync_timestamp?: number;
}

export interface AppSettings {
  id: string; // Always '1'
  
  // Security & Licensing
  hardware_fingerprint: string; // SHA-256 hash
  amc_expiry_date: number; // Unix timestamp
  license_key: string;
  last_backup_timestamp?: number;
  
  // Module Toggles
  allow_stock_adjustments: boolean;
  enable_purchase_orders: boolean;
  enable_return_to_vendor: boolean;
  enable_loyalty_program: boolean;
  
  // Business Info
  business: BusinessIdentity;
  
  // Hardware
  thermal_printer: ThermalPrinterConfig;
  cash_drawer: CashDrawerConfig;
  
  // Communications
  smtp: SMTPConfig;
  sms_api_key?: string;
  
  // Financial
  tax_config: TaxConfig;
  costing_method: 'FIFO'; // Hardcoded for now
  
  // Cloud Sync
  cloud_sync: CloudSyncConfig;
}
