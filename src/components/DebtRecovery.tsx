/**
 * DEBT RECOVERY - NAYA MANAGEMENT
 * Credit Ledger with customer tracking
 */

import { useState, useEffect } from 'react';
import { Plus, Edit2, Phone, DollarSign, MessageSquare, User } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/currency';
import type { Customer } from '../lib/db-types';

export function DebtRecovery() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await db.getAllCustomers();
    // Filter to only those with debt
    const withDebt = data.filter(c => c.outstanding_debt_cents > 0);
    setCustomers(withDebt.sort((a, b) => b.outstanding_debt_cents - a.outstanding_debt_cents));
  };

  const handleAddCustomer = async (data: Omit<Customer, 'id' | 'created_at'>) => {
    try {
      await db.addCustomer(data);
      await loadCustomers();
      setShowAddModal(false);
      alert('Customer added!');
    } catch (err) {
      console.error(err);
      alert('Failed to add customer. Phone may already exist.');
    }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      await db.updateCustomer(id, updates);
      await loadCustomers();
      setEditingCustomer(null);
      alert('Customer updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update customer.');
    }
  };

  const handlePayment = async (customer: Customer, amount: number) => {
    const newDebt = customer.outstanding_debt_cents - amount;
    await handleUpdateCustomer(customer.id, { outstanding_debt_cents: Math.max(0, newDebt) });
    setShowPaymentModal(null);
  };

  const totalDebt = customers.reduce((sum, c) => sum + c.outstanding_debt_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Debt Recovery (Naya)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {customers.length} customers • Total Outstanding: {formatCurrency(totalDebt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={MessageSquare}>
            Send SMS Reminders
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-700 dark:text-red-300">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">Over 30 Days</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{formatCurrency(totalDebt * 0.4)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">This Month</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(totalDebt * 0.2)}</p>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {customers.length === 0 ? (
          <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-xl">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No customers with outstanding debt</p>
          </div>
        ) : (
          customers.map(customer => (
            <CustomerDebtCard
              key={customer.id}
              customer={customer}
              onEdit={() => setEditingCustomer(customer)}
              onPayment={() => setShowPaymentModal(customer)}
            />
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <CustomerFormModal
          onSave={handleAddCustomer}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <CustomerFormModal
          customer={editingCustomer}
          onSave={(data) => handleUpdateCustomer(editingCustomer.id, data)}
          onCancel={() => setEditingCustomer(null)}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          customer={showPaymentModal}
          onPayment={handlePayment}
          onCancel={() => setShowPaymentModal(null)}
        />
      )}
    </div>
  );
}

function CustomerDebtCard({ customer, onEdit, onPayment }: {
  customer: Customer;
  onEdit: () => void;
  onPayment: () => void;
}) {
  return (
    <div className="bg-white/50 dark:bg-white/5 border border-gray-300/50 dark:border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{customer.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              {customer.phone_number}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(customer.outstanding_debt_cents)}
          </p>
          <p className="text-xs text-gray-500">Outstanding</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" size="sm" icon={DollarSign} onClick={onPayment}>
          Record Payment
        </Button>
        <Button variant="ghost" size="sm" icon={Edit2} onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" icon={MessageSquare}>
          Send SMS
        </Button>
      </div>
    </div>
  );
}

function CustomerFormModal({ customer, onSave, onCancel }: {
  customer?: Customer | null;
  onSave: (data: Omit<Customer, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    phone_number: customer?.phone_number || '',
    name: customer?.name || '',
    outstanding_debt_cents: customer?.outstanding_debt_cents || 0,
  });

  const handleSubmit = () => {
    if (!formData.phone_number || !formData.name) {
      alert('Phone and name are required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {customer ? 'Edit Customer' : 'Add Customer'}
        </h2>

        <div className="space-y-4">
          <Input label="Phone Number" value={formData.phone_number}
            onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
            placeholder="+1234567890" />
          
          <Input label="Name" value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe" />
          
          <Input label="Outstanding Debt (cents)" type="number"
            value={formData.outstanding_debt_cents.toString()}
            onChange={(e) => setFormData({...formData, outstanding_debt_cents: parseInt(e.target.value) || 0})}
            placeholder="0" />
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} className="flex-1">
            {customer ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ customer, onPayment, onCancel }: {
  customer: Customer;
  onPayment: (customer: Customer, amount: number) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(0);

  const handleSubmit = () => {
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    onPayment(customer, amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Record Payment</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {customer.name} owes {formatCurrency(customer.outstanding_debt_cents)}
        </p>

        <Input label="Payment Amount (cents)" type="number"
          value={amount.toString()}
          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          placeholder="Enter amount" />

        <div className="flex gap-2 mt-4">
          <button onClick={() => setAmount(customer.outstanding_debt_cents)}
            className="flex-1 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium">
            Full Amount
          </button>
          <button onClick={() => setAmount(Math.round(customer.outstanding_debt_cents / 2))}
            className="flex-1 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium">
            Half
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} className="flex-1">Record Payment</Button>
        </div>
      </div>
    </div>
  );
}
