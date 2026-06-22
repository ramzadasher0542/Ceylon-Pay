/**
 * PROVIDER GOD MODE
 * The Backdoor for Service Providers
 */

import { useState, useEffect } from 'react';
import { Crown, Download, Database, Settings, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { useAppStore } from '../store/app-store';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/currency';

const MASTER_PASSWORD = 'ASH2026GOD'; // Hardcoded master password

export function GodModeScreen() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    totalRevenue: 0,
  });

  const { setScreen } = useAppStore();

  useEffect(() => {
    if (isUnlocked) {
      loadStats();
    }
  }, [isUnlocked]);

  const loadStats = async () => {
    const products = await db.getAllProducts();
    const orders = await db.getOrdersByStatus('COMPLETED');
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_cents, 0);
    
    setStats({
      products: products.length,
      orders: orders.length,
      customers: 0, // TODO: Count customers
      totalRevenue,
    });
  };

  const handleUnlock = () => {
    if (password === MASTER_PASSWORD) {
      setIsUnlocked(true);
    } else {
      alert('Invalid Master Password');
    }
  };

  const handleBackup = async () => {
    try {
      const data = await db.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `AshPoint_Backup_${timestamp}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      URL.revokeObjectURL(url);
      
      alert('Backup created successfully!');
    } catch (err) {
      console.error('Backup error:', err);
      alert('Backup failed');
    }
  };

  const handleSeedData = async () => {
    if (!confirm('This will add demo products. Continue?')) return;

    try {
      // Seed demo products
      const demoProducts = [
        { sku: 'COLA001', name: 'Coca Cola 330ml', price_cents: 150, stock_level: 100 },
        { sku: 'CHIPS001', name: 'Lays Chips Classic', price_cents: 250, stock_level: 50 },
        { sku: 'BREAD001', name: 'White Bread Loaf', price_cents: 350, stock_level: 30 },
        { sku: 'MILK001', name: 'Fresh Milk 1L', price_cents: 450, stock_level: 20 },
        { sku: 'RICE001', name: 'Basmati Rice 5kg', price_cents: 1200, stock_level: 15 },
      ];

      for (const p of demoProducts) {
        try {
          await db.addProduct({
            sku: p.sku,
            name: p.name,
            price_cents: p.price_cents,
            costing_method: 'WAC',
            current_wac_cents: Math.round(p.price_cents * 0.6), // 40% margin
            stock_level: p.stock_level,
            min_stock_alert: 10,
            unit_type: 'pcs',
          });
        } catch (err) {
          // Skip if already exists
          console.log(`Product ${p.sku} already exists`);
        }
      }

      alert('Demo products added!');
      loadStats();
    } catch (err) {
      console.error('Seed error:', err);
      alert('Failed to seed data');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl shadow-purple-500/30 mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              God Mode
            </h1>
            <p className="text-purple-300">Provider Access Only</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <Input
              type="password"
              placeholder="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
              className="mb-4"
            />

            <Button
              variant="primary"
              size="lg"
              icon={Lock}
              onClick={handleUnlock}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Unlock
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScreen('login')}
              className="w-full mt-4 text-purple-300"
            >
              ← Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Provider God Mode</h1>
              <p className="text-purple-300 text-sm">Full System Control</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setIsUnlocked(false);
              setScreen('login');
            }}
            className="text-purple-300"
          >
            Exit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Database}
            label="Products"
            value={stats.products.toString()}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Orders"
            value={stats.orders.toString()}
            color="green"
          />
          <StatCard
            icon={Settings}
            label="Customers"
            value={stats.customers.toString()}
            color="purple"
          />
          <StatCard
            icon={AlertTriangle}
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            color="yellow"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            icon={Download}
            title="Backup Database"
            description="Export all data to JSON file"
            buttonLabel="Create Backup"
            onClick={handleBackup}
          />
          
          <ActionCard
            icon={Database}
            title="Seed Demo Data"
            description="Add sample products for testing"
            buttonLabel="Add Demo Products"
            onClick={handleSeedData}
          />
        </div>

        {/* Warning */}
        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="text-yellow-500 font-semibold mb-1">Warning</h3>
              <p className="text-yellow-200/70 text-sm">
                You have unrestricted access to all system functions. Changes made here cannot be undone.
                Always create a backup before making modifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    purple: 'from-purple-600 to-purple-700',
    yellow: 'from-yellow-600 to-yellow-700',
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, buttonLabel, onClick }: {
  icon: any;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      <Button
        variant="secondary"
        onClick={onClick}
        className="w-full"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
