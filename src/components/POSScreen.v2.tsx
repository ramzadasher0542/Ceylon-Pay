/**
 * POS SCREEN v2.5 - CLI Enterprise
 * Command-line driven interface
 */

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Users,
  Sun,
  Moon,
  LogOut,
  Trash2,
  ParkingCircle,
  RotateCcw,
  Split,
  LayoutDashboard,
  Receipt,
  Archive,
  Play,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { useAppStore } from '../store/app-store';
import { useKeyboardCommands, useBarcodeScanner } from '../hooks/use-keyboard-commands';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/currency';
import { logAudit, getUserByPin } from '../lib/db-extended';
import type { Product, Customer } from '../lib/db-types';

export function POSScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    theme,
    toggleTheme,
    logout,
    userRole,
    currentUser,
    userPermissions,
    setScreen,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    isRefundMode,
    toggleRefundMode,
    showSplitPaymentModal,
    toggleSplitPaymentModal,
    showTenderModal,
    toggleTenderModal,
    showCustomerSelectModal,
    toggleCustomerSelectModal,
    showShiftModal,
    toggleShiftModal,
    setLastItemQuantity,
    overrideLastItemPrice,
    parkBill,
    recallBill,
    parkedBills,
    openShift,
    closeShift,
    currentShiftId,
    selectedCustomer,
    setSelectedCustomer,
  } = useAppStore();

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, [cart]);

  // Show command feedback briefly
  const showFeedback = (msg: string) => {
    setCommandFeedback(msg);
    setTimeout(() => setCommandFeedback(''), 2000);
  };

  // CLI Search Parser
  const handleCLIInput = async (input: string) => {
    const trimmed = input.trim();
    
    // Command: =1.5 (Set last item quantity)
    if (trimmed.startsWith('=')) {
      const qtyStr = trimmed.slice(1);
      const qty = parseFloat(qtyStr);
      
      if (isNaN(qty) || qty <= 0) {
        showFeedback('❌ Invalid quantity');
        return;
      }
      
      setLastItemQuantity(qty);
      showFeedback(`✓ Qty set to ${qty}`);
      setSearchQuery('');
      return;
    }
    
    // Command: $500 (Override last item price)
    if (trimmed.startsWith('$')) {
      const priceStr = trimmed.slice(1);
      const price = parseFloat(priceStr);
      
      if (isNaN(price) || price < 0) {
        showFeedback('❌ Invalid price');
        return;
      }
      
      const priceCents = Math.round(price * 100);
      const result = overrideLastItemPrice(priceCents);
      
      if (result.success) {
        showFeedback(`✓ Price overridden to ${formatCurrency(priceCents)}`);
        setSearchQuery('');
      } else {
        showFeedback(`❌ ${result.error}`);
        // TODO: Trigger admin override modal
      }
      return;
    }
    
    // Default: SKU/Product search
    const product = await db.getProductBySKU(trimmed);
    if (product) {
      addToCart(product, 1);
      showFeedback(`✓ ${product.name} added`);
      setSearchQuery('');
    } else {
      // Search by name
      const results = await db.searchProducts(trimmed);
      if (results.length > 0) {
        setSearchResults(results);
        setShowSearch(true);
      } else {
        showFeedback('❌ Product not found');
      }
    }
  };

  // Handle Enter key in search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleCLIInput(searchQuery);
    }
  };

  // F-Key shortcuts
  useKeyboardCommands([
    {
      key: 'F1',
      handler: () => searchInputRef.current?.focus(),
      description: 'Focus Search',
    },
    {
      key: 'F4',
      handler: () => {
        if (cart.length > 0) removeFromCart(cart[cart.length - 1].product.id);
      },
      description: 'Void Last Item',
    },
    {
      key: 'F5',
      handler: () => {
        if (cart.length > 0) {
          const id = parkBill();
          showFeedback(`✓ Bill parked: ${id}`);
        }
      },
      description: 'Park Bill',
    },
    {
      key: 'F7',
      handler: () => {
        if (parkedBills.length > 0) {
          // Show recall modal (simplified - recall first parked)
          const recalled = recallBill(parkedBills[0].id);
          if (recalled) showFeedback('✓ Bill recalled');
        }
      },
      description: 'Recall Bill',
    },
    {
      key: 'F8',
      handler: () => toggleCustomerSelectModal(),
      description: 'Customer Credit',
    },
    {
      key: 'F9',
      handler: () => {
        if (cart.length > 0) toggleTenderModal();
      },
      description: 'Cash Payment',
    },
    {
      key: 'F10',
      handler: () => toggleRefundMode(),
      description: 'Refund Mode',
    },
    {
      key: 'F11',
      handler: () => toggleTheme(),
      description: 'Toggle Theme',
    },
    {
      key: 'F12',
      handler: () => toggleSplitPaymentModal(),
      description: 'Split Payment',
    },
  ], true);

  // Barcode scanner (fallback)
  useBarcodeScanner(async (barcode) => {
    handleCLIInput(barcode);
  }, true);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal_cents, 0);
  };

  const total = calculateTotal();

  return (
    <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black flex flex-col">
      {/* Header */}
      <header className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border-b border-gray-300/50 dark:border-white/10 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Ceylon-Pay CLI
            </h1>
            {isRefundMode && (
              <div className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold animate-pulse">
                REFUND MODE
              </div>
            )}
            {selectedCustomer && (
              <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                📞 {selectedCustomer.name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {parkedBills.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Archive className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  {parkedBills.length} parked
                </span>
              </div>
            )}
            
            {userRole === 'MANAGER' || userRole === 'ADMIN' ? (
              <Button variant="secondary" size="sm" icon={LayoutDashboard} onClick={() => setScreen('backoffice')}>
                Back Office
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" icon={theme === 'dark' ? Sun : Moon} onClick={toggleTheme} />
            <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      {/* Command Feedback */}
      {commandFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-pulse">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-lg shadow-lg font-mono text-lg">
            {commandFeedback}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - CLI & Cart */}
        <div className="flex-1 p-4 flex flex-col">
          {/* CLI Input */}
          <div className="mb-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-mono font-bold">$</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="SKU or =qty or $price..."
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 dark:bg-black border-2 border-green-500 text-green-400 font-mono text-lg placeholder-gray-600 focus:outline-none focus:border-green-400"
              />
            </div>
          </div>

          {/* Search Results */}
          {showSearch && searchResults.length > 0 && (
            <div className="mb-4 bg-gray-900 border border-green-500/30 rounded-lg p-2 max-h-40 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    addToCart(product, 1);
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearch(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-green-500/10 text-left"
                >
                  <span className="text-green-400 font-mono">{product.name}</span>
                  <span className="text-green-500 font-mono">{formatCurrency(product.price_cents)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Cart */}
          <div className="flex-1 bg-gray-900/80 backdrop-blur border border-green-500/20 rounded-lg p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-500 font-mono text-sm">CART</span>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-red-500 text-xs font-mono hover:underline">CLEAR</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center text-gray-600 font-mono py-12">
                EMPTY
              </div>
            ) : (
              <div className="space-y-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border-b border-green-500/10">
                    <span className="text-gray-500 font-mono text-xs w-6">{idx + 1}</span>
                    <div className="flex-1">
                      <span className="text-green-400 font-mono text-sm">{item.product.name}</span>
                      {item.is_price_overridden && (
                        <span className="ml-2 text-yellow-500 text-xs">*OVR</span>
                      )}
                    </div>
                    <span className="text-gray-500 font-mono text-sm">{item.quantity}×</span>
                    <span className="text-green-500 font-mono">{formatCurrency(item.unit_price_cents)}</span>
                    <span className="text-green-400 font-mono font-bold">{formatCurrency(item.subtotal_cents)}</span>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-gray-900 border-l border-green-500/20 p-4 flex flex-col">
          {/* Total */}
          <div className="mb-4 p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
            <span className="text-green-200 font-mono text-xs">TOTAL</span>
            <div className="text-3xl font-mono font-bold text-white">{formatCurrency(total)}</div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 flex-1">
            <button onClick={() => cart.length > 0 && toggleTenderModal()}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-mono rounded-lg flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5" /> F9 CASH
            </button>
            
            <button onClick={toggleCustomerSelectModal}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono rounded-lg flex items-center justify-center gap-2">
              <Users className="w-5 h-5" /> F8 CREDIT
            </button>
            
            <button onClick={toggleSplitPaymentModal}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm rounded-lg">
              F12 SPLIT
            </button>
          </div>

          {/* Park/Recall */}
          <div className="flex gap-2 mt-4">
            <button onClick={() => cart.length > 0 && parkBill()}
              className="flex-1 py-2 bg-yellow-600/20 border border-yellow-600 text-yellow-500 font-mono text-xs rounded-lg">
              F5 PARK
            </button>
            <button onClick={() => parkedBills.length > 0 && recallBill(parkedBills[0].id)}
              className="flex-1 py-2 bg-yellow-600/20 border border-yellow-600 text-yellow-500 font-mono text-xs rounded-lg">
              F7 RECALL ({parkedBills.length})
            </button>
          </div>

          {/* Refund Toggle */}
          <button onClick={toggleRefundMode}
            className={`w-full py-2 mt-2 font-mono text-xs rounded-lg ${
              isRefundMode ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}>
            F10 REFUND MODE
          </button>

          {/* CLI Help */}
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-gray-500 font-mono text-xs mb-2">CLI COMMANDS</div>
            <div className="space-y-1 text-xs font-mono text-gray-600">
              <div><span className="text-green-500">=1.5</span> set qty</div>
              <div><span className="text-green-500">$500</span> override price</div>
              <div><span className="text-green-500">SKU</span> add product</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tender Modal */}
      {showTenderModal && (
        <TenderModal
          total={total}
          onComplete={(tendered, change) => {
            toggleTenderModal();
            clearCart();
          }}
          onClose={toggleTenderModal}
        />
      )}

      {/* Customer Select Modal */}
      {showCustomerSelectModal && (
        <CustomerSelectModal
          onSelect={(customer) => {
            setSelectedCustomer(customer);
            toggleCustomerSelectModal();
          }}
          onClose={toggleCustomerSelectModal}
        />
      )}

      {/* Split Payment Modal */}
      {showSplitPaymentModal && (
        <SplitPaymentModal
          total={total}
          onClose={toggleSplitPaymentModal}
          onComplete={() => {
            toggleSplitPaymentModal();
            clearCart();
          }}
        />
      )}
    </div>
  );
}

// Tender Modal with Change Calculation
function TenderModal({ total, onComplete, onClose }: {
  total: number;
  onComplete: (tendered: number, change: number) => void;
  onClose: () => void;
}) {
  const [tendered, setTendered] = useState('');
  const { currentUser, selectedCustomer } = useAppStore();
  
  const tenderedCents = Math.round(parseFloat(tendered || '0') * 100);
  const changeDue = tenderedCents - total;
  
  const handlePayment = async () => {
    if (tenderedCents < total && !selectedCustomer) {
      alert('Insufficient amount');
      return;
    }

    try {
      const order = await db.createOrder({
        timestamp: Date.now(),
        total_cents: total,
        status: 'COMPLETED',
        customer_id: selectedCustomer?.id,
      });

      for (const item of useAppStore.getState().cart) {
        await db.addOrderItem({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          subtotal_cents: item.subtotal_cents,
        });
        
        const newStock = item.product.stock_level - item.quantity;
        await db.updateProduct(item.product.id, { stock_level: newStock });
      }

      await db.addPayment({
        order_id: order.id,
        payment_method: 'CASH',
        amount_cents: total,
        timestamp: Date.now(),
      });

      await logAudit({
        user_pin: currentUser || 'UNKNOWN',
        action: 'SALE',
        details: JSON.stringify({
          order_id: order.id,
          total_cents: total,
          tendered_cents: tenderedCents,
          change_cents: changeDue,
        }),
        order_id: order.id,
      });

      onComplete(tenderedCents, changeDue);
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-green-500 rounded-xl p-6 w-96">
        <h2 className="text-xl font-mono font-bold text-green-400 mb-4">TENDER</h2>
        
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <span className="text-gray-500 font-mono text-xs">AMOUNT DUE</span>
          <div className="text-2xl font-mono font-bold text-white">{formatCurrency(total)}</div>
        </div>

        <input
          type="number"
          value={tendered}
          onChange={(e) => setTendered(e.target.value)}
          placeholder="Enter amount tendered"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-green-400 font-mono text-xl rounded-lg focus:border-green-500 focus:outline-none"
          autoFocus
        />

        {tenderedCents > 0 && (
          <div className={`mt-4 p-3 rounded-lg ${changeDue >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            <span className="text-gray-500 font-mono text-xs">CHANGE DUE</span>
            <div className={`text-2xl font-mono font-bold ${changeDue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(Math.abs(changeDue))}
              {changeDue < 0 && <span className="text-sm ml-2">SHORT</span>}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-700 text-gray-400 font-mono rounded-lg">
            CANCEL
          </button>
          <button onClick={handlePayment}
            disabled={tenderedCents < total && !selectedCustomer}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-mono rounded-lg">
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}

// Customer Select Modal
function CustomerSelectModal({ onSelect, onClose }: {
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await db.getAllCustomers();
    setCustomers(data);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number.includes(search)
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-blue-500 rounded-xl p-6 w-96">
        <h2 className="text-xl font-mono font-bold text-blue-400 mb-4">SELECT CUSTOMER</h2>
        
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white font-mono rounded-lg mb-4"
          autoFocus
        />

        <div className="max-h-60 overflow-y-auto space-y-1">
          {filtered.map(c => (
            <button key={c.id} onClick={() => onSelect(c)}
              className="w-full p-3 bg-gray-800 hover:bg-blue-900/30 rounded-lg text-left">
              <div className="text-white font-mono">{c.name}</div>
              <div className="text-gray-500 text-xs font-mono">{c.phone_number}</div>
              {c.outstanding_debt_cents > 0 && (
                <div className="text-red-400 text-xs font-mono">Debt: {formatCurrency(c.outstanding_debt_cents)}</div>
              )}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="w-full mt-4 py-2 bg-gray-700 text-gray-400 font-mono rounded-lg">
          CANCEL
        </button>
      </div>
    </div>
  );
}

// Split Payment Modal
function SplitPaymentModal({ total, onClose, onComplete }: {
  total: number;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');

  const cashCents = Math.round(parseFloat(cash || '0') * 100);
  const cardCents = Math.round(parseFloat(card || '0') * 100);
  const totalPaid = cashCents + cardCents;
  const remaining = total - totalPaid;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-xl p-6 w-96">
        <h2 className="text-xl font-mono font-bold text-purple-400 mb-4">SPLIT PAYMENT</h2>
        
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <span className="text-gray-500 font-mono text-xs">TOTAL</span>
          <div className="text-2xl font-mono font-bold text-white">{formatCurrency(total)}</div>
        </div>

        <div className="space-y-3">
          <input
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            placeholder="Cash amount"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-green-400 font-mono rounded-lg"
          />
          <input
            type="number"
            value={card}
            onChange={(e) => setCard(e.target.value)}
            placeholder="Card amount"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-blue-400 font-mono rounded-lg"
          />
        </div>

        <div className={`mt-4 p-3 rounded-lg ${remaining === 0 ? 'bg-green-900/30' : 'bg-yellow-900/30'}`}>
          <div className="flex justify-between font-mono text-sm">
            <span className="text-gray-500">Remaining:</span>
            <span className={remaining === 0 ? 'text-green-400' : 'text-yellow-400'}>{formatCurrency(remaining)}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-700 text-gray-400 font-mono rounded-lg">CANCEL</button>
          <button onClick={onComplete} disabled={remaining !== 0}
            className="flex-1 py-2 bg-purple-600 disabled:bg-gray-700 text-white font-mono rounded-lg">COMPLETE</button>
        </div>
      </div>
    </div>
  );
}
