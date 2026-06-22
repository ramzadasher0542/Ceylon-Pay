/**
 * EXTENDED DATABASE OPERATIONS
 * Full CRUD for Users, Stock Adjustments, Audit Logs
 */

import { db } from './db';
import type { User, StockAdjustment, AuditLog, UserPermissions } from './db-types';
import { DEFAULT_PERMISSIONS } from './db-types';

// ==================== USER MANAGEMENT ====================

export async function createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const newUser: User = {
    ...userData,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  };
  
  const dbInstance = await (db as any).db;
  await dbInstance.add('users', newUser);
  return newUser;
}

export async function getAllUsers(): Promise<User[]> {
  const dbInstance = await (db as any).db;
  return await dbInstance.getAll('users');
}

export async function getUserByPin(pin: string): Promise<User | undefined> {
  const dbInstance = await (db as any).db;
  return await dbInstance.getFromIndex('users', 'by-pin', pin);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const dbInstance = await (db as any).db;
  const user = await dbInstance.get('users', id);
  if (!user) throw new Error('User not found');
  
  await dbInstance.put('users', { ...user, ...updates });
}

export async function deleteUser(id: string): Promise<void> {
  const dbInstance = await (db as any).db;
  await dbInstance.delete('users', id);
}

export async function seedDefaultUsers(): Promise<void> {
  const existing = await getAllUsers();
  if (existing.length > 0) return; // Already seeded
  
  // Create default users
  await createUser({
    pin: '1111',
    name: 'Default Cashier',
    role: 'CASHIER',
    permissions: DEFAULT_PERMISSIONS.CASHIER,
    is_active: true,
  });
  
  await createUser({
    pin: '2026',
    name: 'Default Manager',
    role: 'MANAGER',
    permissions: DEFAULT_PERMISSIONS.MANAGER,
    is_active: true,
  });
  
  await createUser({
    pin: '5692',
    name: 'System Admin',
    role: 'ADMIN',
    permissions: DEFAULT_PERMISSIONS.ADMIN,
    is_active: true,
  });
}

// ==================== STOCK ADJUSTMENTS ====================

export async function createStockAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'timestamp'>): Promise<StockAdjustment> {
  const newAdjustment: StockAdjustment = {
    ...adjustment,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  const dbInstance = await (db as any).db;
  await dbInstance.add('stock_adjustments', newAdjustment);
  
  // Update product stock level
  await db.updateProduct(adjustment.product_id, { stock_level: adjustment.new_stock });
  
  return newAdjustment;
}

export async function getStockAdjustments(productId?: string): Promise<StockAdjustment[]> {
  const dbInstance = await (db as any).db;
  
  if (productId) {
    return await dbInstance.getAllFromIndex('stock_adjustments', 'by-product', productId);
  }
  
  return await dbInstance.getAll('stock_adjustments');
}

// ==================== AUDIT LOGS ====================

export async function logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  const auditLog: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  const dbInstance = await (db as any).db;
  await dbInstance.add('audit_logs', auditLog);
}

export async function getAuditLogs(filters?: {
  user_pin?: string;
  action?: AuditLog['action'];
  startDate?: number;
  endDate?: number;
}): Promise<AuditLog[]> {
  const dbInstance = await (db as any).db;
  let logs: AuditLog[] = [];
  
  if (filters?.user_pin) {
    logs = await dbInstance.getAllFromIndex('audit_logs', 'by-user', filters.user_pin);
  } else if (filters?.action) {
    logs = await dbInstance.getAllFromIndex('audit_logs', 'by-action', filters.action);
  } else {
    logs = await dbInstance.getAll('audit_logs');
  }
  
  // Apply date filters
  if (filters?.startDate) {
    logs = logs.filter(log => log.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    logs = logs.filter(log => log.timestamp <= filters.endDate!);
  }
  
  // Sort by timestamp descending (newest first)
  logs.sort((a, b) => b.timestamp - a.timestamp);
  
  return logs;
}

export async function getRecentAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const logs = await getAuditLogs();
  return logs.slice(0, limit);
}
