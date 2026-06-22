/**
 * MAIN POS INTERFACE - THE WAR ROOM
 * Zero-touch workflow with F-key shortcuts
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
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { useAppStore } from '../store/app-store';
import { useKeyboardCommands, useBarcodeScanner } from '../hooks/use-keyboard-commands';
import { db } from '../lib/db';
import { formatCurrency, addCents } from '../lib/currency';
import type { Product } from '../lib/db-types';
import { logAudit } from '../lib/db-extended';

export function POSScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    theme,
    toggleTheme,
    logout,
    userRole,
    currentUser,
    setScreen,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    isRefundMode,
    toggleRefundMode,
    showSplitPaymentModal,
    toggleSplitPaymentModal,
  } = useAppStore();

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Barcode scanner trap
  useBarcodeScanner(async (barcode) => {
    console.log('Scanned:', barcode);
    
    // Try to find product by SKU
    const product = await db.getProductBySKU(barcode);
    if (product) {
      addToCart(product, 1);
      // Play beep sound (TODO)
    } else {
      alert(`Product not found: ${barcode}`);
    }
  }, true);

  // F-Key shortcuts
  useKeyboardCommands([
    {
      key: 'F1',
      handler: () => {
        setShowSearch(true);
        searchInputRef.current?.focus();
      },
      description: 'Search Products',
    },
    {
      key: 'F4',
      handler: () => {
        if (cart.length > 0) {
          removeFromCart(cart[cart.length - 1].product.id);
        }
      },
      description: 'Void Last Item',
    },
    {
      key: 'F5',
      handler: () => {
        alert('Park Bill (TODO)');
      },
      description: 'Park Bill',
    },
    {
      key: 'F8',
      handler: () => {
        alert('Customer Credit (TODO)');
      },
      description: 'Customer Credit',
    },
    {
      key: 'F9',
      handler: () => {
        handleCashPayment();
      },
      description: 'Exact Cash Payment',
    },
    {
      key: 'F10',
      handler: () => {
        toggleRefundMode();
      },
      description: 'Toggle Refund Mode',
    },
    {
      key: 'F11',
      handler: () => {
        toggleTheme();
      },
      description: 'Toggle Theme',
    },
    {
      key: 'F12',
      handler: () => {
        toggleSplitPaymentModal();
      },
      description: 'Split Payment',
    },
  ], true);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = await db.searchProducts(searchQuery);
    setSearchResults(results);
    setShowSearch(true);
  };

  const handleAddProduct = (product: Product) => {
    addToCart(product, 1);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    searchInputRef.current?.focus();
  };

  const handleCashPayment = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const total = calculateTotal();
    
    if (!confirm(`Process cash payment of ${formatCurrency(total)}?`)) {
      return;
    }

    try {
      // Create order
      const order = await db.createOrder({
        timestamp: Date.now(),
        total_cents: total,
        status: 'COMPLETED',
      });

      // Add order items & update stock
      for (const item of cart) {
        await db.addOrderItem({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          subtotal_cents: item.subtotal_cents,
        });

        // Update stock
        const newStock = item.product.stock_level - item.quantity;
        await db.updateProduct(item.product.id, { stock_level: newStock });
      }

      // Add payment
      await db.addPayment({
        order_id: order.id,
        payment_method: 'CASH',
        amount_cents: total,
        timestamp: Date.now(),
      });

      // Log to audit trail
      await logAudit({
        user_pin: currentUser || 'UNKNOWN',
        action: 'SALE',
        details: JSON.stringify({
          order_id: order.id,
          total_cents: total,
          items_count: cart.length,
          payment_method: 'CASH',
        }),
        order_id: order.id,
      });

      // TODO: Trigger cash drawer kick (Tauri RJ11 command)
      console.log('KICK DRAWER!');
      
      // Log drawer kick
      await logAudit({
        user_pin: currentUser || 'UNKNOWN',
        action: 'DRAWER_KICK',
        details: JSON.stringify({ order_id: order.id }),
      });

      alert(`Order ${order.id} completed!`);
      clearCart();
    } catch (err) {
      console.error('Checkout error:', err);
      alert(`Error: ${err}`);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => addCents(sum, item.subtotal_cents), 0);
  };

  const total = calculateTotal();

  return (
    <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black flex flex-col">
      {/* Header */}
      <header className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border-b border-gray-300/50 dark:border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ash Point POS
            </h1>
            {isRefundMode && (
              <div className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold animate-pulse">
                REFUND MODE
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'MANAGER' && (
              <Button
                variant="secondary"
                size="sm"
                icon={LayoutDashboard}
                onClick={() => setScreen('backoffice')}
              >
                Back Office
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={theme === 'dark' ? Sun : Moon}
              onClick={toggleTheme}
              title="F11 - Toggle Theme"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={LogOut}
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Product Search & Entry */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or search product... (F1)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch();
                }}
                className="pl-12 barcode-input text-lg"
              />
            </div>
          </div>

          {/* Search Results */}
          {showSearch && searchResults.length > 0 && (
            <div className="mb-6 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-xl p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Search Results
              </h3>
              <div className="space-y-2">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {product.sku} | Stock: {product.stock_level}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(product.price_cents)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Current Order
              </h3>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={clearCart}
                >
                  Clear
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Scan or search to add items</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-white/5"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.unit_price_cents)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.subtotal_cents)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Checkout */}
        <div className="w-96 bg-white/50 dark:bg-white/5 backdrop-blur-xl border-l border-gray-300/50 dark:border-white/10 p-6 flex flex-col">
          {/* Total */}
          <div className="mb-6 p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-2xl">
            <p className="text-blue-200 text-sm mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-white">
              {formatCurrency(total)}
            </p>
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3 flex-1">
            <Button
              variant="primary"
              size="lg"
              icon={DollarSign}
              onClick={handleCashPayment}
              disabled={cart.length === 0}
              className="w-full"
            >
              Cash Payment (F9)
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={CreditCard}
              disabled={cart.length === 0}
              className="w-full"
            >
              Card Payment
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={Users}
              disabled={cart.length === 0}
              className="w-full"
            >
              Customer Credit (F8)
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={Split}
              onClick={toggleSplitPaymentModal}
              disabled={cart.length === 0}
              className="w-full"
            >
              Split Payment (F12)
            </Button>

            <div className="border-t border-gray-300/50 dark:border-white/10 my-4"></div>

            <Button
              variant="secondary"
              size="md"
              icon={ParkingCircle}
              disabled={cart.length === 0}
              className="w-full"
            >
              Park Bill (F5)
            </Button>

            <Button
              variant={isRefundMode ? 'danger' : 'secondary'}
              size="md"
              icon={RotateCcw}
              onClick={toggleRefundMode}
              className="w-full"
            >
              {isRefundMode ? 'Exit Refund' : 'Refund Mode'} (F10)
            </Button>
          </div>

          {/* Quick Keys Guide */}
          <div className="mt-6 p-4 bg-gray-100/50 dark:bg-black/20 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Quick Keys
            </p>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
              <div className="flex justify-between">
                <span>Search</span>
                <span className="font-mono">F1</span>
              </div>
              <div className="flex justify-between">
                <span>Void Item</span>
                <span className="font-mono">F4</span>
              </div>
              <div className="flex justify-between">
                <span>Theme</span>
                <span className="font-mono">F11</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

function SplitPaymentModal({ total, onClose, onComplete }: {
  total: number;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');

  const cashCents = parseInt(cashAmount) || 0;
  const cardCents = parseInt(cardAmount) || 0;
  const totalPaid = cashCents + cardCents;
  const remaining = total - totalPaid;

  const handleComplete = async () => {
    if (totalPaid !== total) {
      alert('Payment amounts must equal total');
      return;
    }

    alert('Split payment processed!');
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Split Payment
        </h2>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <Input
            type="number"
            label="Cash Amount (cents)"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            placeholder="0"
          />

          <Input
            type="number"
            label="Card Amount (cents)"
            value={cardAmount}
            onChange={(e) => setCardAmount(e.target.value)}
            placeholder="0"
          />

          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
              <span className={`font-semibold ${remaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleComplete}
            disabled={totalPaid !== total}
            className="flex-1"
          >
            Complete
          </Button>
        </div>
      </div>
    </div>
  );
}
