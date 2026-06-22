/**
 * AUDIT TRAIL - "THE SNITCH LOG"
 * Displays all logged actions
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, User, ShoppingCart, Trash2, DollarSign, Lock, Clock, Filter } from 'lucide-react';
import { Button } from './Button';
import { getAuditLogs } from '../lib/db-extended';
import type { AuditLog } from '../lib/db-types';

export function AuditTrailDisplay() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState<'all' | AuditLog['action']>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('week');

  useEffect(() => {
    loadLogs();
  }, [filter, dateFilter]);

  const loadLogs = async () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    let startDate: number | undefined;
    switch (dateFilter) {
      case 'today':
        startDate = new Date().setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = now - (7 * day);
        break;
      default:
        startDate = undefined;
    }

    const data = await getAuditLogs({
      action: filter === 'all' ? undefined : filter,
      startDate,
    });

    setLogs(data);
  };

  const getActionIcon = (action: AuditLog['action']) => {
    switch (action) {
      case 'SALE': return ShoppingCart;
      case 'VOID': return Trash2;
      case 'REFUND': return DollarSign;
      case 'DRAWER_KICK': return Lock;
      case 'LOGIN': return User;
      default: return AlertTriangle;
    }
  };

  const getActionColor = (action: AuditLog['action']) => {
    switch (action) {
      case 'SALE': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'VOID': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'REFUND': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'DRAWER_KICK': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'LOGIN': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      default: return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    }
  };

  const actionTypes: AuditLog['action'][] = ['LOGIN', 'SALE', 'VOID', 'REFUND', 'DRAWER_KICK', 'DISCOUNT', 'PRICE_OVERRIDE', 'STOCK_ADJUST'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Trail - "The Snitch"</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{logs.length} events logged</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-white/10"
        >
          <option value="all">All Actions</option>
          {actionTypes.map(type => (
            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-white/10"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-xl">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
          </div>
        ) : (
          logs.map(log => {
            const Icon = getActionIcon(log.action);
            const colorClass = getActionColor(log.action);
            
            let details: any = {};
            try {
              details = JSON.parse(log.details);
            } catch {}

            return (
              <div key={log.id} className="bg-white/50 dark:bg-white/5 border border-gray-300/50 dark:border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorClass}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.user_pin}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {log.action === 'SALE' && details.total_cents && (
                        <>Order {details.order_id} • {new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(details.total_cents / 100)} • {details.items_count} items</>
                      )}
                      {log.action === 'DRAWER_KICK' && (
                        <>Cash drawer opened for order {details.order_id}</>
                      )}
                      {log.action === 'VOID' && (
                        <>Item voided</>
                      )}
                      {log.action === 'LOGIN' && (
                        <>User logged in</>
                      )}
                      {log.action === 'REFUND' && (
                        <>Refund processed</>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Loss Prevention Summary */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Loss Prevention Digest
        </h3>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {logs.filter(l => l.action === 'VOID').length}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Voids Today</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {logs.filter(l => l.action === 'DRAWER_KICK').length}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Drawer Kicks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {logs.filter(l => l.action === 'REFUND').length}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Refunds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
