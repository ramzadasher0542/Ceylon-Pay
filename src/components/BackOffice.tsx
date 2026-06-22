/**
 * BACK OFFICE COMMAND CENTER
 * Manager-only dashboard for business intelligence
 */

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  Settings,
  ChevronRight,
  DollarSign,
  ShoppingCart,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  Store,
  MessageSquare,
} from 'lucide-react';
import { Button } from './Button';
import { useAppStore } from '../store/app-store';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/currency';
import type { UserRole } from '../lib/db-types';
import { DEFAULT_PERMISSIONS } from '../lib/db-types';
import { UserManagement } from './UserManagement';
import { InventoryManagement } from './InventoryManagement';
import { SalesReports } from './SalesReports';
import { DebtRecovery } from './DebtRecovery';
import { AuditTrailDisplay } from './AuditTrail';

type BackOfficeView = 'dashboard' | 'inventory' | 'sales' | 'debt' | 'audit' | 'settings';

export function BackOffice() {
  const [currentView, setCurrentView] = useState<BackOfficeView>('dashboard');
  const { theme, toggleTheme, logout, setScreen, userRole } = useAppStore();

  return (
    <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/50 dark:bg-white/5 backdrop-blur-xl border-r border-gray-300/50 dark:border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-300/50 dark:border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Back Office</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Manager Control</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavButton
            icon={LayoutDashboard}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          />
          <NavButton
            icon={Package}
            label="Inventory"
            active={currentView === 'inventory'}
            onClick={() => setCurrentView('inventory')}
          />
          <NavButton
            icon={TrendingUp}
            label="Sales Reports"
            active={currentView === 'sales'}
            onClick={() => setCurrentView('sales')}
          />
          <NavButton
            icon={CreditCard}
            label="Debt Recovery"
            active={currentView === 'debt'}
            onClick={() => setCurrentView('debt')}
          />
          <NavButton
            icon={AlertTriangle}
            label="Audit Trail"
            active={currentView === 'audit'}
            onClick={() => setCurrentView('audit')}
          />
          {userRole === 'ADMIN' && (
            <NavButton
              icon={Settings}
              label="Settings"
              active={currentView === 'settings'}
              onClick={() => setCurrentView('settings')}
            />
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-300/50 dark:border-white/10 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            icon={ShoppingCart}
            onClick={() => setScreen('pos')}
            className="w-full justify-start"
          >
            Go to POS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={theme === 'dark' ? Sun : Moon}
            onClick={toggleTheme}
            className="w-full justify-start"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={logout}
            className="w-full justify-start text-red-600 dark:text-red-400"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'inventory' && <InventoryView />}
        {currentView === 'sales' && <SalesView />}
        {currentView === 'debt' && <DebtRecoveryView />}
        {currentView === 'audit' && <AuditTrailView />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
        ${active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
          : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function DashboardView() {
  const [stats, setStats] = useState({
    todaySales: 0,
    cashInDrawer: 0,
    totalDiscounts: 0,
    grossProfit: 0,
    totalOrders: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const orders = await db.getOrdersByStatus('COMPLETED');
    
    const todayOrders = orders.filter(o => o.timestamp >= todayStart);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total_cents, 0);
    
    // TODO: Calculate actual gross profit with FIFO costing
    const grossProfit = Math.round(todaySales * 0.35); // Estimated 35% margin
    
    const products = await db.getAllProducts();
    const lowStockItems = products.filter(p => p.stock_level <= p.min_stock_alert).length;
    
    setStats({
      todaySales,
      cashInDrawer: 0, // TODO: Track from shift
      totalDiscounts: 0, // TODO: Track discounts
      grossProfit,
      totalOrders: todayOrders.length,
      lowStockItems,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Live business pulse</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(stats.grossProfit)}
          subtitle="~35% margin"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard
          title="Cash in Drawer"
          value={formatCurrency(stats.cashInDrawer)}
          subtitle="Current shift"
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockItems.toString()}
          subtitle="Items below minimum"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Discounts Given"
          value={formatCurrency(stats.totalDiscounts)}
          subtitle="Today"
          icon={CreditCard}
          color="gray"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="secondary" className="h-20 flex-col gap-2">
            <Package className="w-6 h-6" />
            <span className="text-sm">Stock Count</span>
          </Button>
          <Button variant="secondary" className="h-20 flex-col gap-2">
            <FileText className="w-6 h-6" />
            <span className="text-sm">Daily Report</span>
          </Button>
          <Button variant="secondary" className="h-20 flex-col gap-2">
            <Users className="w-6 h-6" />
            <span className="text-sm">Manage Staff</span>
          </Button>
          <Button variant="secondary" className="h-20 flex-col gap-2">
            <MessageSquare className="w-6 h-6" />
            <span className="text-sm">Send SMS</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'from-green-600 to-green-700',
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
    yellow: 'from-yellow-600 to-yellow-700',
    red: 'from-red-600 to-red-700',
    gray: 'from-gray-600 to-gray-700',
  };

  return (
    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function InventoryView() {
  return (
    <div className="p-8">
      <InventoryManagement />
    </div>
  );
}

function SalesView() {
  return (
    <div className="p-8">
      <SalesReports />
    </div>
  );
}

function DebtRecoveryView() {
  return (
    <div className="p-8">
      <DebtRecovery />
    </div>
  );
}

function AuditTrailView() {
  return (
    <div className="p-8">
      <AuditTrailDisplay />
    </div>
  );
}

function SettingsView() {
  const [settings, setSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'business' | 'hardware' | 'email' | 'tax' | 'rbac' | 'users'>('modules');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await db.getSettings();
    setSettings(data);
  };

  const saveSettings = async () => {
    if (settings) {
      await db.updateSettings(settings);
      alert('Settings saved successfully!');
    }
  };

  if (!settings) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Admin-only configurations</p>
        </div>
        <Button variant="primary" onClick={saveSettings}>
          Save All Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton label="Modules" active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} />
        <TabButton label="Business" active={activeTab === 'business'} onClick={() => setActiveTab('business')} />
        <TabButton label="Hardware" active={activeTab === 'hardware'} onClick={() => setActiveTab('hardware')} />
        <TabButton label="Email/SMS" active={activeTab === 'email'} onClick={() => setActiveTab('email')} />
        <TabButton label="Tax Config" active={activeTab === 'tax'} onClick={() => setActiveTab('tax')} />
        <TabButton label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <TabButton label="RBAC Info" active={activeTab === 'rbac'} onClick={() => setActiveTab('rbac')} />
      </div>

      {/* Content */}
      <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-2xl p-6">
        {activeTab === 'modules' && <ModulesTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'business' && <BusinessTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'hardware' && <HardwareTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'email' && <EmailTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'tax' && <TaxTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'rbac' && <RBACTab />}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

function ModulesTab({ settings, setSettings }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Feature Modules</h2>
      
      <ToggleRow
        label="Purchase Orders (PO)"
        description="Track incoming stock from suppliers"
        checked={settings.enable_purchase_orders}
        onChange={(val) => setSettings({ ...settings, enable_purchase_orders: val })}
      />
      
      <ToggleRow
        label="Return to Vendor (RTV)"
        description="Log damaged goods and supplier credits"
        checked={settings.enable_return_to_vendor}
        onChange={(val) => setSettings({ ...settings, enable_return_to_vendor: val })}
      />
      
      <ToggleRow
        label="Customer Loyalty Program"
        description="Points-based rewards system"
        checked={settings.enable_loyalty_program}
        onChange={(val) => setSettings({ ...settings, enable_loyalty_program: val })}
      />
      
      <ToggleRow
        label="Staff Stock Adjustments"
        description="Allow employees to adjust inventory (with audit trail)"
        checked={settings.allow_stock_adjustments}
        onChange={(val) => setSettings({ ...settings, allow_stock_adjustments: val })}
      />
    </div>
  );
}

function BusinessTab({ settings, setSettings }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Business Identity</h2>
      
      <InputField
        label="Store Name"
        value={settings.business.store_name}
        onChange={(val) => setSettings({
          ...settings,
          business: { ...settings.business, store_name: val }
        })}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Business Registration Number (BRN)"
          value={settings.business.business_registration_number || ''}
          onChange={(val) => setSettings({
            ...settings,
            business: { ...settings.business, business_registration_number: val }
          })}
        />
        
        <InputField
          label="Tax Identification Number (TIN)"
          value={settings.business.tax_identification_number || ''}
          onChange={(val) => setSettings({
            ...settings,
            business: { ...settings.business, tax_identification_number: val }
          })}
        />
      </div>
      
      <InputField
        label="Address Line 1"
        value={settings.business.address_line1}
        onChange={(val) => setSettings({
          ...settings,
          business: { ...settings.business, address_line1: val }
        })}
      />
      
      <InputField
        label="Address Line 2 (Optional)"
        value={settings.business.address_line2 || ''}
        onChange={(val) => setSettings({
          ...settings,
          business: { ...settings.business, address_line2: val }
        })}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="City"
          value={settings.business.city}
          onChange={(val) => setSettings({
            ...settings,
            business: { ...settings.business, city: val }
          })}
        />
        
        <InputField
          label="Postal Code"
          value={settings.business.postal_code || ''}
          onChange={(val) => setSettings({
            ...settings,
            business: { ...settings.business, postal_code: val }
          })}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Phone Number"
          value={settings.business.phone_number}
          onChange={(val) => setSettings({
            ...settings,
            business: { ...settings.business, phone_number: val }
          })}
        />
        
        <InputField
          label="Email (Optional)"
          value={settings.business.email || ''}
          onChange={(val) => setSettings({
            ...settings,
            business: { ...settings.business, email: val }
          })}
        />
      </div>
      
      <InputField
        label="Receipt Footer Text"
        value={settings.business.footer_text}
        onChange={(val) => setSettings({
          ...settings,
          business: { ...settings.business, footer_text: val }
        })}
        placeholder="Powered by Ash Point Solutions | Contact: +1234567890"
      />
    </div>
  );
}

function HardwareTab({ settings, setSettings }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Hardware Configuration</h2>
      
      {/* Thermal Printer */}
      <div className="border-t border-gray-300/50 dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thermal Printer</h3>
        
        <ToggleRow
          label="Enable Thermal Printer"
          checked={settings.thermal_printer.enabled}
          onChange={(val) => setSettings({
            ...settings,
            thermal_printer: { ...settings.thermal_printer, enabled: val }
          })}
        />
        
        {settings.thermal_printer.enabled && (
          <div className="mt-4 space-y-4 pl-6">
            <SelectField
              label="Driver Type"
              value={settings.thermal_printer.driver_type}
              options={['WINDOWS', 'LINUX', 'ESC_POS']}
              onChange={(val) => setSettings({
                ...settings,
                thermal_printer: { ...settings.thermal_printer, driver_type: val }
              })}
            />
            
            <SelectField
              label="Paper Width"
              value={settings.thermal_printer.paper_width.toString()}
              options={['58', '80']}
              onChange={(val) => setSettings({
                ...settings,
                thermal_printer: { ...settings.thermal_printer, paper_width: parseInt(val) }
              })}
            />
            
            <InputField
              label="COM Port"
              value={settings.thermal_printer.com_port || ''}
              onChange={(val) => setSettings({
                ...settings,
                thermal_printer: { ...settings.thermal_printer, com_port: val }
              })}
              placeholder="COM3 or /dev/ttyUSB0"
            />
            
            <InputField
              label="Baud Rate"
              value={settings.thermal_printer.baud_rate.toString()}
              onChange={(val) => setSettings({
                ...settings,
                thermal_printer: { ...settings.thermal_printer, baud_rate: parseInt(val) || 9600 }
              })}
              placeholder="9600"
            />
          </div>
        )}
      </div>
      
      {/* Cash Drawer */}
      <div className="border-t border-gray-300/50 dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cash Drawer</h3>
        
        <ToggleRow
          label="Enable Cash Drawer"
          checked={settings.cash_drawer.enabled}
          onChange={(val) => setSettings({
            ...settings,
            cash_drawer: { ...settings.cash_drawer, enabled: val }
          })}
        />
        
        {settings.cash_drawer.enabled && (
          <div className="mt-4 space-y-4 pl-6">
            <SelectField
              label="Connection Type"
              value={settings.cash_drawer.connection_type}
              options={['RJ11', 'USB']}
              onChange={(val) => setSettings({
                ...settings,
                cash_drawer: { ...settings.cash_drawer, connection_type: val }
              })}
            />
            
            <InputField
              label="COM Port"
              value={settings.cash_drawer.com_port || ''}
              onChange={(val) => setSettings({
                ...settings,
                cash_drawer: { ...settings.cash_drawer, com_port: val }
              })}
              placeholder="COM3"
            />
            
            <InputField
              label="Kick Code (ESC/POS Hex)"
              value={settings.cash_drawer.kick_code}
              onChange={(val) => setSettings({
                ...settings,
                cash_drawer: { ...settings.cash_drawer, kick_code: val }
              })}
              placeholder="1B7000FA"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EmailTab({ settings, setSettings }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Email & SMS Configuration</h2>
      
      {/* SMTP */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SMTP (Email Reporting)</h3>
        
        <ToggleRow
          label="Enable Email Reports"
          checked={settings.smtp.enabled}
          onChange={(val) => setSettings({
            ...settings,
            smtp: { ...settings.smtp, enabled: val }
          })}
        />
        
        {settings.smtp.enabled && (
          <div className="mt-4 space-y-4">
            <InputField
              label="SMTP Server"
              value={settings.smtp.server}
              onChange={(val) => setSettings({
                ...settings,
                smtp: { ...settings.smtp, server: val }
              })}
              placeholder="smtp.gmail.com"
            />
            
            <InputField
              label="Port"
              value={settings.smtp.port.toString()}
              onChange={(val) => setSettings({
                ...settings,
                smtp: { ...settings.smtp, port: parseInt(val) || 587 }
              })}
              placeholder="587"
            />
            
            <InputField
              label="Sender Email"
              value={settings.smtp.sender_email}
              onChange={(val) => setSettings({
                ...settings,
                smtp: { ...settings.smtp, sender_email: val }
              })}
              placeholder="yourstore@gmail.com"
            />
            
            <InputField
              label="App Password"
              type="password"
              value={settings.smtp.sender_password}
              onChange={(val) => setSettings({
                ...settings,
                smtp: { ...settings.smtp, sender_password: val }
              })}
              placeholder="xxxx xxxx xxxx xxxx"
            />
            
            <ToggleRow
              label="Auto-send Z-Report (End of Day)"
              checked={settings.smtp.auto_send_zreport}
              onChange={(val) => setSettings({
                ...settings,
                smtp: { ...settings.smtp, auto_send_zreport: val }
              })}
            />
          </div>
        )}
      </div>
      
      {/* SMS */}
      <div className="border-t border-gray-300/50 dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SMS (Debt Recovery)</h3>
        
        <InputField
          label="SMS API Key (Twilio/Vonage)"
          value={settings.sms_api_key || ''}
          onChange={(val) => setSettings({ ...settings, sms_api_key: val })}
          placeholder="Enter API key"
        />
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Used for automated debt recovery reminders
        </p>
      </div>
    </div>
  );
}

function TaxTab({ settings, setSettings }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tax Configuration</h2>
      
      {/* VAT */}
      <div>
        <ToggleRow
          label="Enable VAT"
          checked={settings.tax_config.vat_enabled}
          onChange={(val) => setSettings({
            ...settings,
            tax_config: { ...settings.tax_config, vat_enabled: val }
          })}
        />
        
        {settings.tax_config.vat_enabled && (
          <div className="mt-4 space-y-4 pl-6">
            <InputField
              label="VAT Rate (%)"
              value={settings.tax_config.vat_rate.toString()}
              onChange={(val) => setSettings({
                ...settings,
                tax_config: { ...settings.tax_config, vat_rate: parseFloat(val) || 0 }
              })}
              placeholder="15"
            />
            
            <ToggleRow
              label="VAT Inclusive Pricing"
              description="Prices already include VAT"
              checked={settings.tax_config.vat_inclusive}
              onChange={(val) => setSettings({
                ...settings,
                tax_config: { ...settings.tax_config, vat_inclusive: val }
              })}
            />
          </div>
        )}
      </div>
      
      {/* SSCL */}
      <div className="border-t border-gray-300/50 dark:border-white/10 pt-6">
        <ToggleRow
          label="Enable SSCL (Special Sales & Consumption Levy)"
          checked={settings.tax_config.sscl_enabled}
          onChange={(val) => setSettings({
            ...settings,
            tax_config: { ...settings.tax_config, sscl_enabled: val }
          })}
        />
        
        {settings.tax_config.sscl_enabled && (
          <div className="mt-4 pl-6">
            <InputField
              label="SSCL Rate (%)"
              value={settings.tax_config.sscl_rate.toString()}
              onChange={(val) => setSettings({
                ...settings,
                tax_config: { ...settings.tax_config, sscl_rate: parseFloat(val) || 0 }
              })}
              placeholder="2.5"
            />
          </div>
        )}
      </div>
      
      {/* Costing Method */}
      <div className="border-t border-gray-300/50 dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Costing Method</h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
            Currently: FIFO (First-In, First-Out)
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Hardcoded for accurate gross profit calculation. Cannot be changed.
          </p>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  return <UserManagement />;
}

function RBACTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Default Role Permissions</h2>
      
      <div className="space-y-4">
        <RoleCard role="CASHIER" pin="Default" />
        <RoleCard role="MANAGER" pin="Default" />
        <RoleCard role="ADMIN" pin="Default" />
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          ✅ Dynamic User Management Active
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Go to "Users" tab to create, edit, and manage staff accounts with custom permissions.
        </p>
      </div>
    </div>
  );
}

function RoleCard({ role, pin }: { role: UserRole; pin: string }) {
  const perms = DEFAULT_PERMISSIONS[role];
  
  const roleColors: Record<UserRole, string> = {
    CASHIER: 'from-green-600 to-green-700',
    MANAGER: 'from-blue-600 to-blue-700',
    ADMIN: 'from-purple-600 to-purple-700',
  };
  
  return (
    <div className="bg-white/50 dark:bg-white/5 border border-gray-300/50 dark:border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${roleColors[role]} text-white text-sm font-bold mb-2`}>
            {role}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">PIN: {pin}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <PermRow label="POS Access" granted={perms.can_access_pos} />
        <PermRow label="Back Office" granted={perms.can_access_backoffice} />
        <PermRow label="Settings" granted={perms.can_access_settings} />
        <PermRow label="Void Items" granted={perms.can_void_items} />
        <PermRow label="Discounts" granted={perms.can_give_discounts} />
        <PermRow label="Refunds" granted={perms.can_process_refunds} />
        <PermRow label="Stock Adjust" granted={perms.can_adjust_stock} />
        <PermRow label="Reports" granted={perms.can_view_reports} />
        <PermRow label="Manage Users" granted={perms.can_manage_users} />
        <PermRow label="Close Shift" granted={perms.can_close_shift} />
      </div>
      
      {perms.max_discount_percent > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300/50 dark:border-white/10">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Max Discount: <span className="font-bold">{perms.max_discount_percent}%</span>
          </p>
        </div>
      )}
    </div>
  );
}

function PermRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${granted ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-300/50 dark:border-white/10 last:border-0">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
