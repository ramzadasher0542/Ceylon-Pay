/**
 * CEYLON-PAY POS v3.0 - CLEAN TERMINAL
 * Context-Aware Keyboard State Machine
 * Sri Lankan High-Speed Retail Environment
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, POSWindowMode } from '../store/app-store.v3';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/currency';
import { logAudit } from '../lib/db-extended';
import type { Product, Customer } from '../lib/db-types';

// Format currency as Rs. X,XXX.XX
const formatRs = (cents: number) => `Rs. ${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Format phone with +94 prefix
const formatPhone = (phone: string) => {
  if (phone.startsWith('+94')) return phone;
  if (phone.startsWith('0')) return '+94' + phone.slice(1);
  return '+94' + phone;
};

export function POSTerminal() {
  const cliInputRef = useRef<HTMLInputElement>(null);
  const [cliInput, setCliInput] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [tenderInputs, setTenderInputs] = useState({ cash: '', card: '', credit: false });
  
  const {
    posMode,
    setPosMode,
    isReturnMode,
    toggleReturnMode,
    cart,
    cartCustomer,
    addToCart,
    updateLastItemQuantity,
    overrideLastItemPrice,
    voidCart,
    clearCart,
    setCartCustomer,
    parkedTransactions,
    parkTransaction,
    recallTransaction,
    voidParkedTransaction,
    amountTenderedCents,
    setAmountTendered,
    changeDueCents,
    resetTender,
    managerOverrideActive,
    activateManagerOverride,
    deactivateManagerOverride,
    currentUser,
    currentUserPin,
    userPermissions,
    addOnTheFlyProduct,
    logout,
    theme,
    toggleTheme,
  } = useAppStore();

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal_cents, 0);
  const discount = cart.reduce((sum, item) => {
    if (item.is_price_overridden) {
      return sum + ((item.original_price_cents - item.unit_price_cents) * Math.abs(item.quantity));
    }
    return sum;
  }, 0);
  const total = subtotal;

  // Aggressive focus on CLI input
  useEffect(() => {
    if (posMode === 'MAIN' && cliInputRef.current) {
      cliInputRef.current.focus();
    }
  }, [posMode, cart]);

  // Show feedback briefly
  const showFeedback = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  // Command Parser
  const parseCommand = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // =[Qty] - Quantity Override
    if (trimmed.startsWith('=')) {
      const qty = parseFloat(trimmed.slice(1));
      if (isNaN(qty) || qty <= 0) {
        showFeedback('Invalid quantity', 'error');
        return;
      }
      if (updateLastItemQuantity(qty)) {
        showFeedback(`Qty set to ${qty}`, 'success');
      } else {
        showFeedback('No items in cart', 'error');
      }
      setCliInput('');
      return;
    }

    // $[Price] - Price Override
    if (trimmed.startsWith('$')) {
      const price = parseFloat(trimmed.slice(1));
      if (isNaN(price) || price < 0) {
        showFeedback('Invalid price', 'error');
        return;
      }
      const priceCents = Math.round(price * 100);
      const result = overrideLastItemPrice(priceCents);
      if (result.success) {
        showFeedback(`Price set to ${formatRs(priceCents)}`, 'success');
      } else if (result.error?.startsWith('NO_PERMISSION')) {
        showFeedback('Manager override required', 'error');
        setPosMode('MANAGER_OVERRIDE');
        setModalData({ action: 'price_override', priceCents });
      } else {
        showFeedback(result.error || 'Error', 'error');
      }
      setCliInput('');
      return;
    }

    // Default: SKU/Barcode search
    const product = await db.getProductBySKU(trimmed);
    if (product) {
      addToCart(product, 1);
      showFeedback(`${product.name} added`, 'success');
      setCliInput('');
      return;
    }

    // Not found - On-The-Fly addition
    showFeedback(`Unknown barcode: ${trimmed}`, 'error');
    setPosMode('ON_THE_FLY');
    setModalData({ barcode: trimmed });
  };

  // Modal data helper
  const [modalData, setModalData] = useState<any>(null);

  // Context-aware keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useAppStore.getState();
      
      // === MAIN MODE ===
      if (state.posMode === 'MAIN') {
        switch (e.key) {
          case 'F3':
            e.preventDefault();
            setPosMode('CUSTOMER_LOOKUP');
            setModalInput('');
            break;
          case 'F5':
            e.preventDefault();
            if (confirm('Void entire transaction?')) {
              voidCart();
              showFeedback('Transaction voided', 'info');
            }
            break;
          case 'F6':
            e.preventDefault();
            setPosMode('RECALL');
            break;
          case 'F8':
            e.preventDefault();
            if (cart.length > 0) setPosMode('TENDER');
            break;
          case 'F9':
            e.preventDefault();
            setPosMode('PRODUCT_LOOKUP');
            setModalInput('');
            setSearchResults([]);
            break;
        }
        
        // Ctrl combinations
        if (e.ctrlKey) {
          switch (e.key.toLowerCase()) {
            case 'f':
              e.preventDefault();
              const parkId = parkTransaction();
              showFeedback(`Parked: ${parkId}`, 'success');
              break;
            case 'r':
              e.preventDefault();
              toggleReturnMode();
              showFeedback(isReturnMode ? 'Normal mode' : 'Return mode', 'info');
              break;
            case 'm':
              e.preventDefault();
              setPosMode('MANAGER_OVERRIDE');
              setModalInput('');
              break;
            case 'a':
            case 'h':
              e.preventDefault();
              setPosMode('CASH_PAID_OUT');
              setModalInput('');
              break;
            case 's':
              e.preventDefault();
              logout();
              break;
          }
        }
      }
      
      // === TENDER MODE ===
      else if (state.posMode === 'TENDER') {
        switch (e.key) {
          case 'F2':
            e.preventDefault();
            // Balance - fill remaining
            const remaining = total - (parseFloat(tenderInputs.cash || '0') * 100 + parseFloat(tenderInputs.card || '0') * 100);
            setTenderInputs(prev => ({ ...prev, cash: ((remaining) / 100).toFixed(2) }));
            break;
          case 'F3':
            e.preventDefault();
            // Exact cash
            processPayment('CASH', total);
            break;
          case 'F4':
            e.preventDefault();
            // Exact check/bank
            processPayment('CARD', total);
            break;
          case 'F8':
            e.preventDefault();
            // House account / Naya
            if (cartCustomer) {
              processPayment('CREDIT', total);
            } else {
              showFeedback('No customer linked', 'error');
            }
            break;
          case 'Escape':
            e.preventDefault();
            setPosMode('MAIN');
            resetTender();
            setTenderInputs({ cash: '', card: '', credit: false });
            break;
        }
      }
      
      // === PRODUCT_LOOKUP MODE ===
      else if (state.posMode === 'PRODUCT_LOOKUP') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPosMode('MAIN');
          setSearchResults([]);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedResultIndex(i => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedResultIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && searchResults.length > 0) {
          e.preventDefault();
          addToCart(searchResults[selectedResultIndex], 1);
          showFeedback('Added', 'success');
          setPosMode('MAIN');
          setSearchResults([]);
          setModalInput('');
        }
      }
      
      // === RECALL MODE ===
      else if (state.posMode === 'RECALL') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPosMode('MAIN');
        } else if (e.key === 'F5') {
          e.preventDefault();
          // Void then restore last
          if (parkedTransactions.length > 0) {
            recallTransaction(parkedTransactions[parkedTransactions.length - 1].id);
            showFeedback('Transaction recalled', 'success');
            setPosMode('MAIN');
          }
        } else if (e.key === 'F7') {
          e.preventDefault();
          // Permanently void last parked
          if (parkedTransactions.length > 0) {
            voidParkedTransaction(parkedTransactions[parkedTransactions.length - 1].id);
            showFeedback('Parked transaction voided', 'info');
          }
        } else if (e.key === 'F10') {
          e.preventDefault();
          // Restore open transaction
          if (parkedTransactions.length > 0) {
            recallTransaction(parkedTransactions[0].id);
            showFeedback('Transaction restored', 'success');
            setPosMode('MAIN');
          }
        }
      }
      
      // === MANAGER OVERRIDE MODE ===
      else if (state.posMode === 'MANAGER_OVERRIDE') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPosMode('MAIN');
          setModalInput('');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          // Validate manager PIN
          validateManagerPin(modalInput);
        }
      }
      
      // === CUSTOMER_LOOKUP MODE ===
      else if (state.posMode === 'CUSTOMER_LOOKUP') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPosMode('MAIN');
          setModalInput('');
          setSearchResults([]);
        }
      }
      
      // === ON_THE_FLY MODE ===
      else if (state.posMode === 'ON_THE_FLY') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPosMode('MAIN');
          setModalData(null);
          setModalInput('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, selectedResultIndex, parkedTransactions, cart, cartCustomer, isReturnMode, modalInput, tenderInputs, total]);

  // Product search in PRODUCT_LOOKUP mode
  useEffect(() => {
    if (posMode === 'PRODUCT_LOOKUP' && modalInput.length > 0) {
      db.searchProducts(modalInput).then(results => {
        setSearchResults(results.slice(0, 10));
        setSelectedResultIndex(0);
      });
    }
  }, [posMode, modalInput]);

  // Customer search
  useEffect(() => {
    if (posMode === 'CUSTOMER_LOOKUP' && modalInput.length > 0) {
      // Search customers
      (async () => {
        const customers = await db.getAllCustomers();
        const filtered = customers.filter(c => 
          c.name.toLowerCase().includes(modalInput.toLowerCase()) ||
          c.phone_number.includes(modalInput)
        );
        setSearchResults(filtered as any);
      })();
    }
  }, [posMode, modalInput]);

  // Process payment
  const processPayment = async (method: 'CASH' | 'CARD' | 'CREDIT', amount: number) => {
    try {
      const order = await db.createOrder({
        timestamp: Date.now(),
        total_cents: amount,
        status: 'COMPLETED',
        customer_id: cartCustomer?.id,
      });

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

      await db.addPayment({
        order_id: order.id,
        payment_method: method,
        amount_cents: amount,
        timestamp: Date.now(),
      });

      // If CREDIT, update customer debt
      if (method === 'CREDIT' && cartCustomer) {
        const newDebt = cartCustomer.outstanding_debt_cents + amount;
        await db.updateCustomer(cartCustomer.id, { outstanding_debt_cents: newDebt });
      }

      await logAudit({
        user_pin: currentUserPin || 'UNKNOWN',
        action: 'SALE',
        details: JSON.stringify({ order_id: order.id, total: amount, method }),
        order_id: order.id,
      });

      showFeedback(`Order ${order.id} complete!`, 'success');
      clearCart();
      setPosMode('MAIN');
      resetTender();
      setTenderInputs({ cash: '', card: '', credit: false });
    } catch (err) {
      console.error(err);
      showFeedback('Payment failed', 'error');
    }
  };

  // Validate manager PIN
  const validateManagerPin = async (pin: string) => {
    const user = await (await import('../lib/db-extended')).getUserByPin(pin);
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      activateManagerOverride(180); // 3 minutes
      showFeedback('Manager override active', 'success');
      setPosMode('MAIN');
      setModalInput('');
      
      // If there was a pending action
      if (modalData?.action === 'price_override') {
        overrideLastItemPrice(modalData.priceCents);
      }
    } else {
      showFeedback('Invalid PIN', 'error');
    }
  };

  // Get F-key cheat sheet for current mode
  const getCheatSheet = () => {
    switch (posMode) {
      case 'MAIN':
        return [
          { key: 'F3', label: 'Customer' },
          { key: 'F5', label: 'Void' },
          { key: 'F6', label: 'Recall' },
          { key: 'F8', label: 'Tender' },
          { key: 'F9', label: 'Lookup' },
          { key: 'Ctrl+R', label: isReturnMode ? 'Normal' : 'Return' },
        ];
      case 'TENDER':
        return [
          { key: 'F2', label: 'Balance' },
          { key: 'F3', label: 'Exact Cash' },
          { key: 'F4', label: 'Card' },
          { key: 'F8', label: cartCustomer ? 'Credit' : 'No Customer' },
          { key: 'Esc', label: 'Back' },
        ];
      case 'RECALL':
        return [
          { key: 'F5', label: 'Recall Last' },
          { key: 'F7', label: 'Void Last' },
          { key: 'F10', label: 'Restore' },
          { key: 'Esc', label: 'Back' },
        ];
      case 'PRODUCT_LOOKUP':
        return [
          { key: '↑↓', label: 'Navigate' },
          { key: 'Enter', label: 'Add' },
          { key: 'Esc', label: 'Back' },
        ];
      default:
        return [{ key: 'Esc', label: 'Back' }];
    }
  };

  return (
    <div className="h-screen bg-black text-green-400 font-mono flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-green-500/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-green-500">CEYLON-PAY</span>
          {isReturnMode && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded animate-pulse">RETURN MODE</span>
          )}
          {managerOverrideActive && (
            <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded">MANAGER OVERRIDE</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>{currentUser}</span>
          <span className="text-gray-500">|</span>
          <span>{parkedTransactions.length} parked</span>
          <button onClick={toggleTheme} className="text-gray-400 hover:text-green-400">
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button onClick={logout} className="text-red-400 hover:text-red-300">EXIT</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Receipt View */}
        <div className="flex-1 flex flex-col">
          {/* Customer Info */}
          {cartCustomer && (
            <div className="bg-blue-900/30 border-b border-blue-500/30 px-4 py-1 text-blue-400 text-sm">
              👤 {cartCustomer.name} | {cartCustomer.phone_number} | Debt: {formatRs(cartCustomer.outstanding_debt_cents)}
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-600 mt-20">
                <div className="text-4xl mb-2">📄</div>
                <div>EMPTY TRANSACTION</div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="text-left py-1 w-8">#</th>
                    <th className="text-left py-1">ITEM</th>
                    <th className="text-right py-1 w-20">QTY</th>
                    <th className="text-right py-1 w-28">PRICE</th>
                    <th className="text-right py-1 w-28">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx} className={`border-b border-gray-800/50 ${item.quantity < 0 ? 'text-red-400' : ''}`}>
                      <td className="py-2 text-gray-500">{idx + 1}</td>
                      <td className="py-2">
                        {item.product.name}
                        {item.is_price_overridden && <span className="text-yellow-500 ml-2">*OVR</span>}
                      </td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatRs(item.unit_price_cents)}</td>
                      <td className="py-2 text-right font-bold">{formatRs(item.subtotal_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* CLI Input */}
          <div className="p-4 border-t border-green-500/30">
            {feedback && (
              <div className={`mb-2 text-center py-1 rounded ${feedback.type === 'error' ? 'text-red-400' : feedback.type === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>
                {feedback.msg}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">{'>'}</span>
              <input
                ref={cliInputRef}
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    parseCommand(cliInput);
                  }
                }}
                onBlur={() => {
                  // Aggressive re-focus
                  if (posMode === 'MAIN') {
                    setTimeout(() => cliInputRef.current?.focus(), 100);
                  }
                }}
                placeholder="SKU | =QTY | $PRICE"
                className="flex-1 bg-gray-900 border border-green-500/50 rounded px-3 py-2 text-green-400 placeholder-gray-600 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Totals */}
        <div className="w-64 bg-gray-900 border-l border-green-500/30 p-4 flex flex-col">
          <div className="mb-4">
            <div className="text-gray-500 text-xs">SUBTOTAL</div>
            <div className="text-xl">{formatRs(subtotal)}</div>
          </div>
          
          {discount > 0 && (
            <div className="mb-4 text-yellow-400">
              <div className="text-xs">DISCOUNT</div>
              <div>-{formatRs(discount)}</div>
            </div>
          )}

          <div className="mb-4 pt-4 border-t border-gray-700">
            <div className="text-green-500 text-xs font-bold">GRAND TOTAL</div>
            <div className="text-3xl font-bold text-green-400">{formatRs(total)}</div>
          </div>

          <div className="mt-auto text-xs text-gray-600">
            <div>Items: {cart.length}</div>
            <div>Units: {cart.reduce((s, i) => s + Math.abs(i.quantity), 0)}</div>
          </div>
        </div>
      </div>

      {/* Footer - Cheat Sheet */}
      <footer className="bg-gray-900 border-t border-green-500/30 px-4 py-2 flex items-center justify-center gap-6 text-sm">
        {getCheatSheet().map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span className="px-2 py-0.5 bg-gray-800 rounded text-green-500">{item.key}</span>
            <span className="text-gray-400">{item.label}</span>
          </div>
        ))}
      </footer>

      {/* === MODALS === */}

      {/* TENDER MODAL */}
      {posMode === 'TENDER' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold text-green-400 mb-4">TENDER</h2>
            
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <div className="text-gray-400 text-xs">AMOUNT DUE</div>
              <div className="text-3xl font-bold text-white">{formatRs(total)}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs">CASH</label>
                <input
                  type="number"
                  value={tenderInputs.cash}
                  onChange={(e) => setTenderInputs(prev => ({ ...prev, cash: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-green-400 text-xl"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs">CARD</label>
                <input
                  type="number"
                  value={tenderInputs.card}
                  onChange={(e) => setTenderInputs(prev => ({ ...prev, card: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-blue-400"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded">
              <div className="text-gray-400 text-xs">CHANGE DUE</div>
              <div className="text-2xl font-bold text-green-400">
                {formatRs(Math.max(0, (parseFloat(tenderInputs.cash || '0') + parseFloat(tenderInputs.card || '0')) * 100 - total))}
              </div>
            </div>

            <button
              onClick={() => { setPosMode('MAIN'); resetTender(); setTenderInputs({ cash: '', card: '', credit: false }); }}
              className="mt-4 w-full py-2 bg-gray-700 text-gray-400 rounded"
            >
              ESC to Cancel
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT LOOKUP MODAL */}
      {posMode === 'PRODUCT_LOOKUP' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-6 w-[600px]">
            <h2 className="text-xl font-bold text-green-400 mb-4">PRODUCT LOOKUP</h2>
            
            <input
              type="text"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-gray-800 border border-green-500 rounded px-4 py-3 text-lg mb-4"
              autoFocus
            />

            <div className="max-h-80 overflow-y-auto space-y-1">
              {searchResults.map((product, idx) => (
                <div
                  key={product.id}
                  className={`p-3 rounded flex justify-between ${idx === selectedResultIndex ? 'bg-green-900/50 border border-green-500' : 'bg-gray-800'}`}
                >
                  <span className="text-green-400">{(product as Product).name}</span>
                  <span className="text-gray-500">{(product as Product).stock_level} in stock | {formatRs((product as Product).price_cents)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 text-gray-500 text-sm">
              ↑↓ Navigate | Enter to Add | Esc to Cancel
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER LOOKUP MODAL */}
      {posMode === 'CUSTOMER_LOOKUP' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-blue-500 rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold text-blue-400 mb-4">CUSTOMER</h2>
            
            <input
              type="text"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder="Name or phone (+94...)"
              className="w-full bg-gray-800 border border-blue-500 rounded px-4 py-3 mb-4"
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto space-y-1">
              {(searchResults as Customer[]).map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setCartCustomer(customer);
                    setPosMode('MAIN');
                    setModalInput('');
                    setSearchResults([]);
                    showFeedback(`Customer: ${customer.name}`, 'success');
                  }}
                  className="w-full p-3 bg-gray-800 hover:bg-blue-900/30 rounded text-left flex justify-between"
                >
                  <span className="text-white">{customer.name}</span>
                  <span className="text-gray-400">{customer.phone_number}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setPosMode('MAIN'); setModalInput(''); setSearchResults([]); }}
              className="mt-4 w-full py-2 bg-gray-700 text-gray-400 rounded"
            >
              ESC to Cancel
            </button>
          </div>
        </div>
      )}

      {/* RECALL MODAL */}
      {posMode === 'RECALL' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">RECALL TRANSACTION</h2>
            
            {parkedTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No parked transactions</div>
            ) : (
              <div className="space-y-2">
                {parkedTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-gray-800 rounded flex justify-between items-center">
                    <div>
                      <div className="text-white">{tx.id}</div>
                      <div className="text-gray-500 text-xs">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="text-green-400">{tx.cart.length} items</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setPosMode('MAIN')}
              className="mt-4 w-full py-2 bg-gray-700 text-gray-400 rounded"
            >
              ESC to Cancel
            </button>
          </div>
        </div>
      )}

      {/* MANAGER OVERRIDE MODAL */}
      {posMode === 'MANAGER_OVERRIDE' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">MANAGER OVERRIDE</h2>
            
            <input
              type="password"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validateManagerPin(modalInput)}
              placeholder="Enter Manager PIN"
              className="w-full bg-gray-800 border border-yellow-500 rounded px-4 py-3 text-center text-2xl tracking-widest"
              autoFocus
              maxLength={4}
            />

            <button
              onClick={() => { setPosMode('MAIN'); setModalInput(''); }}
              className="mt-4 w-full py-2 bg-gray-700 text-gray-400 rounded"
            >
              ESC to Cancel
            </button>
          </div>
        </div>
      )}

      {/* ON-THE-FLY MODAL */}
      {posMode === 'ON_THE_FLY' && modalData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-orange-500 rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold text-orange-400 mb-2">ON-THE-FLY ADDITION</h2>
            <p className="text-gray-400 text-sm mb-4">Unknown barcode: {modalData.barcode}</p>
            
            <input
              type="text"
              placeholder="Item name"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-3"
              onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price (Rs.)"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-3"
              onChange={(e) => setModalData({ ...modalData, price: e.target.value })}
            />
            
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const priceCents = Math.round(parseFloat(modalData.price || '0') * 100);
                  const product = await addOnTheFlyProduct(modalData.barcode, modalData.name || `Item ${modalData.barcode}`, priceCents);
                  addToCart(product, 1);
                  setPosMode('MAIN');
                  setModalData(null);
                  showFeedback('Item added', 'success');
                }}
                className="flex-1 py-2 bg-orange-600 text-white rounded"
              >
                Add to Cart
              </button>
              <button
                onClick={() => { setPosMode('MAIN'); setModalData(null); }}
                className="px-4 py-2 bg-gray-700 text-gray-400 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
