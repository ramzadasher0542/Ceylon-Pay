/**
 * ASH POINT ENCRYPTED DATABASE VAULT
 * IndexedDB with simulated encryption layer
 * (In Tauri: Replace with SQLCipher via Rust backend)
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Product,
  Order,
  OrderItem,
  OrderPayment,
  Customer,
  Shift,
  AppSettings,
  StockAdjustment,
  StockBatch,
  PurchaseOrder,
  POItem,
  KitBundle,
  AuditLog,
  LoyaltyCard,
  User,
} from './db-types';

interface AshPointDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-sku': string };
  };
  orders: {
    key: string;
    value: Order;
    indexes: { 'by-timestamp': number; 'by-status': string };
  };
  order_items: {
    key: string;
    value: OrderItem;
    indexes: { 'by-order': string };
  };
  order_payments: {
    key: string;
    value: OrderPayment;
    indexes: { 'by-order': string };
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-phone': string };
  };
  shifts: {
    key: string;
    value: Shift;
    indexes: { 'by-opened': number };
  };
  users: {
    key: string;
    value: User;
    indexes: { 'by-pin': string; 'by-name': string };
  };
  stock_adjustments: {
    key: string;
    value: StockAdjustment;
    indexes: { 'by-product': string; 'by-timestamp': number };
  };
  audit_logs: {
    key: string;
    value: AuditLog;
    indexes: { 'by-user': string; 'by-timestamp': number; 'by-action': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

class DatabaseVault {
  private db: IDBPDatabase<AshPointDB> | null = null;
  private _encryptionKey: string = ''; // Simulated encryption key (for future AES implementation)

  async init(password: string): Promise<void> {
    // Simulate encryption key derivation
    this._encryptionKey = await this.deriveKey(password);

    this.db = await openDB<AshPointDB>('ash-point-pos', 2, {
      upgrade(db, oldVersion) {
        // Version 1 tables
        if (oldVersion < 1) {
          // Products table
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-sku', 'sku', { unique: true });

          // Orders table
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('by-timestamp', 'timestamp');
          orderStore.createIndex('by-status', 'status');

          // Order Items table
          const itemStore = db.createObjectStore('order_items', { keyPath: 'id' });
          itemStore.createIndex('by-order', 'order_id');

          // Order Payments table
          const paymentStore = db.createObjectStore('order_payments', { keyPath: 'id' });
          paymentStore.createIndex('by-order', 'order_id');

          // Customers table
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by-phone', 'phone_number', { unique: true });

          // Shifts table
          const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' });
          shiftStore.createIndex('by-opened', 'opened_at');

          // Settings table
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        
        // Version 2 tables
        if (oldVersion < 2) {
          // Users table
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-pin', 'pin', { unique: true });
          userStore.createIndex('by-name', 'name');
          
          // Stock Adjustments table
          const adjustmentStore = db.createObjectStore('stock_adjustments', { keyPath: 'id' });
          adjustmentStore.createIndex('by-product', 'product_id');
          adjustmentStore.createIndex('by-timestamp', 'timestamp');
          
          // Audit Logs table
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('by-user', 'user_pin');
          auditStore.createIndex('by-timestamp', 'timestamp');
          auditStore.createIndex('by-action', 'action');
        }
      },
    });
  }

  private async deriveKey(password: string): Promise<string> {
    // In production: Use Web Crypto API for proper PBKDF2
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // TIME-TAMPER CHECK: Verify new order timestamp isn't in the past
  async validateOrderTimestamp(timestamp: number): Promise<boolean> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction('orders', 'readonly');
    const index = tx.store.index('by-timestamp');
    
    // Get the most recent order
    let cursor = await index.openCursor(null, 'prev');
    if (cursor) {
      const lastTimestamp = cursor.value.timestamp;
      if (timestamp < lastTimestamp) {
        throw new Error('SECURITY ALERT: Time tampering detected! Order timestamp is in the past.');
      }
    }
    
    return true;
  }

  // WEIGHTED AVERAGE COST CALCULATION
  calculateWAC(
    currentWAC: number,
    currentStock: number,
    newCost: number,
    newStock: number
  ): number {
    if (currentStock + newStock === 0) return newCost;
    
    const totalValue = (currentWAC * currentStock) + (newCost * newStock);
    const totalStock = currentStock + newStock;
    
    return Math.round(totalValue / totalStock);
  }

  // CRUD OPERATIONS
  async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    if (!this.db) throw new Error('DB not initialized');
    
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      created_at: Date.now(),
    };
    
    await this.db.add('products', newProduct);
    return newProduct;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.get('products', id);
  }

  async getProductBySKU(sku: string): Promise<Product | undefined> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.getFromIndex('products', 'by-sku', sku);
  }

  async getAllProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.getAll('products');
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    const product = await this.getProduct(id);
    if (!product) throw new Error('Product not found');
    
    await this.db.put('products', { ...product, ...updates });
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!this.db) throw new Error('DB not initialized');
    const all = await this.getAllProducts();
    
    const lowerQuery = query.toLowerCase();
    return all.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery)
    );
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    if (!this.db) throw new Error('DB not initialized');
    
    // TIME-TAMPER CHECK
    await this.validateOrderTimestamp(order.timestamp);
    
    const newOrder: Order = {
      ...order,
      id: this.generateOrderID(),
    };
    
    await this.db.add('orders', newOrder);
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.get('orders', id);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    const order = await this.getOrder(id);
    if (!order) throw new Error('Order not found');
    
    await this.db.put('orders', { ...order, ...updates });
  }

  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.getAllFromIndex('orders', 'by-status', status);
  }

  async addOrderItem(item: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    if (!this.db) throw new Error('DB not initialized');
    
    const newItem: OrderItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    
    await this.db.add('order_items', newItem);
    return newItem;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.getAllFromIndex('order_items', 'by-order', orderId);
  }

  async addPayment(payment: Omit<OrderPayment, 'id'>): Promise<OrderPayment> {
    if (!this.db) throw new Error('DB not initialized');
    
    const newPayment: OrderPayment = {
      ...payment,
      id: crypto.randomUUID(),
    };
    
    await this.db.add('order_payments', newPayment);
    return newPayment;
  }

  async getOrderPayments(orderId: string): Promise<OrderPayment[]> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.getAllFromIndex('order_payments', 'by-order', orderId);
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    if (!this.db) throw new Error('DB not initialized');
    
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID(),
      created_at: Date.now(),
    };
    
    await this.db.add('customers', newCustomer);
    return newCustomer;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.getFromIndex('customers', 'by-phone', phone);
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    const customer = await this.db.get('customers', id);
    if (!customer) throw new Error('Customer not found');
    
    await this.db.put('customers', { ...customer, ...updates });
  }

  async getAllCustomers(): Promise<Customer[]> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.getAll('customers');
  }

  async openShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    if (!this.db) throw new Error('DB not initialized');
    
    const newShift: Shift = {
      ...shift,
      id: crypto.randomUUID(),
    };
    
    await this.db.add('shifts', newShift);
    return newShift;
  }

  async closeShift(id: string, actual_closing_cash_cents: number): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    const shift = await this.db.get('shifts', id);
    if (!shift) throw new Error('Shift not found');
    
    await this.db.put('shifts', {
      ...shift,
      closed_at: Date.now(),
      actual_closing_cash_cents,
    });
  }

  async getCurrentShift(): Promise<Shift | undefined> {
    if (!this.db) throw new Error('DB not initialized');
    const shifts = await this.db.getAll('shifts');
    return shifts.find(s => !s.closed_at);
  }

  async getSettings(): Promise<AppSettings | undefined> {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.get('settings', '1');
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    await this.db.put('settings', settings);
  }

  private generateOrderID(): string {
    // Generate short alphanumeric ID (suitable for barcodes)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  async exportData(): Promise<string> {
    if (!this.db) throw new Error('DB not initialized');
    
    const data = {
      products: await this.db.getAll('products'),
      orders: await this.db.getAll('orders'),
      order_items: await this.db.getAll('order_items'),
      order_payments: await this.db.getAll('order_payments'),
      customers: await this.db.getAll('customers'),
      shifts: await this.db.getAll('shifts'),
      settings: await this.db.getAll('settings'),
      exported_at: Date.now(),
    };
    
    return JSON.stringify(data, null, 2);
  }
}

export const db = new DatabaseVault();
