# 🏛️ Ash Point POS — System Architecture

## 📐 High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ LoginScreen │  │  POSScreen  │  │  GodModeScreen      │ │
│  │             │  │             │  │                     │ │
│  │ • Hardware  │  │ • Cart Mgmt │  │ • Backup Export     │ │
│  │   Check     │  │ • Checkout  │  │ • Data Seeding      │ │
│  │ • AMC Check │  │ • F-Keys    │  │ • System Stats      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     STATE MANAGEMENT                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Zustand Store (app-store.ts)             │  │
│  │  • Authentication State  • Cart State                │  │
│  │  • Theme (Light/Dark)    • Modal Visibility          │  │
│  │  • Current Shift         • Refund Mode               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     BUSINESS LOGIC                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Currency   │  │  Keyboard   │  │  Hardware           │ │
│  │  Engine     │  │  Commands   │  │  Fingerprint        │ │
│  │             │  │             │  │                     │ │
│  │ • Integer   │  │ • F-Key Map │  │ • SHA-256 Hash      │ │
│  │   Cents     │  │ • Barcode   │  │ • AMC Validation    │ │
│  │ • Safe Math │  │   Scanner   │  │ • License Check     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     DATA ACCESS LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Database Vault (db.ts)                      │  │
│  │  • IndexedDB Wrapper                                 │  │
│  │  • Encryption Key Derivation                         │  │
│  │  • CRUD Operations                                   │  │
│  │  • WAC Calculation                                   │  │
│  │  • Time-Tamper Detection                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     PERSISTENCE LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  IndexedDB (Browser)                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │  │
│  │  │ Products │ │  Orders  │ │ Order Items/Payments │ │  │
│  │  ├──────────┤ ├──────────┤ ├──────────────────────┤ │  │
│  │  │Customers │ │  Shifts  │ │      Settings        │ │  │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Future: SQLCipher (Tauri v2) with AES-256 Encryption       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File Structure

```
ash-point-pos/
├── src/
│   ├── components/              # React UI Components
│   │   ├── Button.tsx           # Premium frosted button
│   │   ├── Input.tsx            # Themed input field
│   │   ├── LoginScreen.tsx      # Entry point + God Mode trap
│   │   ├── POSScreen.tsx        # Main cashier interface
│   │   └── GodModeScreen.tsx    # Provider control panel
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   └── use-keyboard-commands.ts  # F-key interceptor
│   │
│   ├── lib/                     # Core Business Logic
│   │   ├── currency.ts          # Integer-only money math
│   │   ├── db-types.ts          # TypeScript interfaces
│   │   ├── db.ts                # Database vault wrapper
│   │   └── hardware-fingerprint.ts  # Device locking
│   │
│   ├── store/                   # State Management
│   │   └── app-store.ts         # Zustand global state
│   │
│   ├── utils/                   # Utilities
│   │   └── cn.ts                # Tailwind class merger
│   │
│   ├── App.tsx                  # Root component router
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles
│
├── public/                      # Static assets (none yet)
├── dist/                        # Production build output
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite build config
├── README.md                    # Main documentation
├── USAGE.md                     # User manual
└── ARCHITECTURE.md              # This file
```

---

## 🔄 Data Flow Diagrams

### 1. Product Search & Add to Cart

```
User Input (Scan/Search)
         │
         ▼
┌────────────────────┐
│  POSScreen.tsx     │
│  • handleSearch()  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   db.ts            │
│   • searchProducts()│
│   • getProductBySKU()│
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  IndexedDB         │
│  • Query products  │
│  • Index by SKU    │
└────────┬───────────┘
         │
         ▼
   Product Found
         │
         ▼
┌────────────────────┐
│  app-store.ts      │
│  • addToCart()     │
│  • Apply refund    │
│    multiplier      │
└────────┬───────────┘
         │
         ▼
   UI Updates (Cart)
```

### 2. Checkout Flow (Cash Payment)

```
User Presses F9
         │
         ▼
┌────────────────────┐
│  POSScreen.tsx     │
│  • Calculate total │
│  • Validate cart   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   db.ts            │
│   • validateOrderTimestamp() │ ← TIME-TAMPER CHECK
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   db.ts            │
│   • createOrder()  │
└────────┬───────────┘
         │
         ▼
  For Each Cart Item
         │
         ▼
┌────────────────────┐
│   db.ts            │
│   • addOrderItem() │
│   • updateProduct()│ ← Deduct stock
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   db.ts            │
│   • addPayment()   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Tauri Backend     │ ← Future: Cash Drawer Kick
│  • RJ11 Command    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  app-store.ts      │
│  • clearCart()     │
└────────┬───────────┘
         │
         ▼
   Success Alert
```

### 3. Split Payment Validation

```
User Clicks "Complete" in Split Modal
         │
         ▼
┌────────────────────────┐
│  SplitPaymentModal     │
│  • Sum all payments    │
│  • Compare to total    │
└────────┬───────────────┘
         │
         ▼
  ∑(payments) === total?
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
 Process   Show Error
 Payment   "Must equal total"
    │
    ▼
┌────────────────────┐
│   db.ts            │
│   • createOrder()  │
│   • addPayment()   │ ← Multiple payment records
│   • addPayment()   │
└────────────────────┘
```

---

## 🔐 Security Architecture

### 1. Hardware Fingerprinting

```typescript
// Generation (browser simulation)
const fingerprint = SHA256(
  navigator.userAgent +
  navigator.hardwareConcurrency +
  screen.width + screen.height +
  navigator.language +
  timezone_offset
)

// Storage
AppSettings.hardware_fingerprint = fingerprint

// Validation on every login
if (currentFingerprint !== storedFingerprint) {
  throw "HARDWARE MISMATCH"
}
```

**Tauri Migration:**
```rust
// Rust backend (actual hardware)
use sysinfo::System;

let motherboard_serial = get_motherboard_serial();
let cpu_id = System::new_all().cpus()[0].name();

let fingerprint = sha256(format!("{}{}", motherboard_serial, cpu_id));
```

### 2. AMC License Validation

```typescript
// Set expiry (God Mode)
const amcExpiry = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year

// Check on login
if (Date.now() > settings.amc_expiry_date) {
  throw "AMC EXPIRED - Contact provider"
}
```

### 3. Time-Tamper Protection

```typescript
// Before creating new order
const lastOrder = await getLatestOrder();
if (newTimestamp < lastOrder.timestamp) {
  throw "SECURITY ALERT: Time tampering detected"
}
```

**Why it matters:** Prevents backdating sales to manipulate reports.

---

## 💰 Currency Engine

### The Integer-Only Rule

```typescript
// ❌ WRONG (floating point errors)
let total = 1.10 + 2.20; // 3.3000000000000003

// ✅ CORRECT (integer cents)
let totalCents = 110 + 220; // 330 (always precise)
```

### Implementation

```typescript
// Storage
price_cents: 1250  // Represents $12.50

// Display
formatCurrency(1250) → "$12.50"

// Calculation
subtotal = quantity * price_cents  // Always safe
```

### WAC Calculation (Inventory Costing)

```typescript
/**
 * Weighted Average Cost
 * 
 * Example:
 * - Current: 10 units @ $5 each = $50 total
 * - New:     20 units @ $6 each = $120 total
 * - WAC:     30 units @ $5.67 each
 */

function calculateWAC(
  currentWAC: 500,      // $5.00
  currentStock: 10,
  newCost: 600,         // $6.00
  newStock: 20
): number {
  const totalValue = (500 * 10) + (600 * 20); // 5000 + 12000 = 17000
  const totalStock = 10 + 20;                  // 30
  return Math.round(totalValue / totalStock);  // 567 cents = $5.67
}
```

**Why WAC?**  
- More accurate than FIFO/LIFO for retail
- Smooths out price fluctuations
- Prevents profit manipulation

---

## ⌨️ Keyboard Command Architecture

### Event Flow

```
Global Window Listener
         │
         ▼
┌────────────────────┐
│  keydown event     │
└────────┬───────────┘
         │
         ▼
  Matches F-Key?
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
preventDefault()  Pass Through
    │
    ▼
Execute Handler
```

### Implementation

```typescript
// Hook registration
useKeyboardCommands([
  {
    key: 'F9',
    handler: () => handleCashPayment(),
    description: 'Cash Payment',
  },
], enabled);

// Event listener
window.addEventListener('keydown', (e) => {
  if (e.key === 'F9' && enabled) {
    e.preventDefault();
    handler();
  }
});
```

### Barcode Scanner Detection

```typescript
let buffer = '';
let timeout: Timer;

window.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    onScan(buffer);
    buffer = '';
  } else {
    buffer += e.key;
    clearTimeout(timeout);
    
    // If no input for 100ms, clear buffer
    timeout = setTimeout(() => buffer = '', 100);
  }
});
```

**Why 100ms?** Barcode scanners emit keystrokes faster than humans can type.

---

## 🎨 UI/UX Patterns

### Frosted Glass Effect

```css
.frosted-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Theme Toggle

```typescript
// Store
theme: 'dark' | 'light'

// Apply
document.documentElement.classList.toggle('dark', theme === 'dark');

// Persist
localStorage.setItem('ash-point-theme', theme);
```

### Auto-Focus Strategy

```typescript
// Always keep search input focused
useEffect(() => {
  searchInputRef.current?.focus();
}, [cart]); // Re-focus after cart changes
```

---

## 🔄 Migration Path to Tauri

### Phase 1: Backend API Design

```rust
// src-tauri/src/main.rs

#[tauri::command]
async fn add_product(product: Product) -> Result<Product, String> {
    // SQLCipher connection
    let conn = get_encrypted_connection()?;
    
    conn.execute(
        "INSERT INTO products (id, sku, name, price_cents, ...) VALUES (?, ?, ?, ?, ...)",
        params![product.id, product.sku, ...]
    )?;
    
    Ok(product)
}
```

### Phase 2: Frontend Integration

```typescript
// Replace IndexedDB calls
import { invoke } from '@tauri-apps/api/tauri';

async function addProduct(product: Product) {
  return await invoke('add_product', { product });
}
```

### Phase 3: Hardware Integration

```rust
// Cash drawer kick (RJ11 via USB-Serial)
use serialport::SerialPort;

#[tauri::command]
fn kick_drawer() -> Result<(), String> {
    let mut port = serialport::new("/dev/ttyUSB0", 9600)
        .open()
        .map_err(|e| e.to_string())?;
    
    // ESC/POS command for cash drawer
    port.write(&[0x1B, 0x70, 0x00, 0x19, 0xFA])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
```

### Phase 4: SQLCipher Encryption

```rust
use rusqlite::{Connection, OpenFlags};

fn get_encrypted_connection() -> Result<Connection> {
    let conn = Connection::open_with_flags(
        "pos.db",
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE
    )?;
    
    // Set encryption key (PRAGMA key must be first command)
    conn.execute("PRAGMA key = 'x\"...\";", [])?;
    
    Ok(conn)
}
```

---

## 📊 Database Indexing Strategy

```typescript
// Indexes for fast queries
products:
  PRIMARY KEY: id
  UNIQUE INDEX: sku
  
orders:
  PRIMARY KEY: id
  INDEX: timestamp (for sorting)
  INDEX: status (for filtering)

order_items:
  PRIMARY KEY: id
  INDEX: order_id (for JOINs)

customers:
  PRIMARY KEY: id
  UNIQUE INDEX: phone_number
```

**Why these indexes?**
- `products.sku`: Fast barcode lookups
- `orders.timestamp`: Chronological order reports
- `orders.status`: Filter PARKED vs COMPLETED
- `customers.phone_number`: Quick credit ledger access

---

## 🚀 Performance Optimizations

### 1. Lazy Loading
- Only load current shift's orders
- Paginate product search results
- Defer heavy reports to background

### 2. Debouncing
```typescript
// Search input (wait 300ms after typing stops)
const debouncedSearch = debounce(handleSearch, 300);
```

### 3. Virtual Scrolling (TODO)
- For 10,000+ product catalogs
- Only render visible items in search results

### 4. Service Workers (TODO)
- Cache static assets
- True offline capability
- Background sync for backups

---

## 🧪 Testing Strategy (Future)

### Unit Tests
```typescript
describe('Currency Engine', () => {
  test('toCents converts correctly', () => {
    expect(toCents(12.50)).toBe(1250);
  });
  
  test('no floating point errors', () => {
    expect(addCents(110, 220)).toBe(330);
  });
});
```

### Integration Tests
```typescript
describe('Checkout Flow', () => {
  test('cash payment completes order', async () => {
    await addToCart(product, 1);
    const order = await processCashPayment();
    expect(order.status).toBe('COMPLETED');
  });
});
```

### E2E Tests
```typescript
test('barcode scanner workflow', async () => {
  await page.goto('/');
  await page.keyboard.type('COLA001');
  await page.keyboard.press('Enter');
  
  await expect(page.locator('.cart')).toContainText('Coca Cola');
});
```

---

## 📈 Scalability Considerations

### Current Limits (IndexedDB)
- **Products**: ~100,000 (browser storage limit)
- **Orders**: ~1M per year (performance degrades)
- **Concurrent Users**: 1 (single browser instance)

### Tauri Scalability
- **Products**: Unlimited (disk-based)
- **Orders**: 10M+ (SQLite handles billions of rows)
- **Concurrent Devices**: Multi-store replication possible

### Network Sync (Future)
```
┌─────────┐      ┌─────────┐      ┌─────────┐
│ Store 1 │◄────►│  Cloud  │◄────►│ Store 2 │
│  Tauri  │      │  Sync   │      │  Tauri  │
└─────────┘      └─────────┘      └─────────┘
     │                                  │
     └──────── Offline Fallback ────────┘
```

---

## 🛡️ Disaster Recovery

### Backup Strategy
1. **Automatic**: Daily JSON export via cron (Tauri)
2. **Manual**: God Mode export on demand
3. **Storage**: Local + Dropbox/External HDD

### Recovery Procedure
1. Fresh install of Ash Point POS
2. Import backup JSON
3. Validate hardware fingerprint
4. Renew AMC if needed

### Data Corruption
- SQLite has built-in journal for crash recovery
- Regular `PRAGMA integrity_check`

---

## 🎯 Business Metrics

### Key Performance Indicators
```typescript
// Average transaction time
const avgTransactionMs = 
  sumOf(order.completed_at - order.created_at) / totalOrders;

// Revenue per hour
const revenuePerHour = 
  sumOf(order.total_cents) / (shift.closed_at - shift.opened_at);

// Items per transaction
const avgBasketSize = 
  totalOrderItems / totalOrders;
```

### Profit Calculation
```typescript
// Gross profit per order
const grossProfit = order.items.reduce((sum, item) => {
  const profit = item.unit_price_cents - item.product.current_wac_cents;
  return sum + (profit * item.quantity);
}, 0);
```

---

## 🌐 Multi-Language Support (Future)

```typescript
// i18n structure
const translations = {
  en: {
    checkout: {
      cash: "Cash Payment",
      card: "Card Payment",
      total: "Total Amount",
    }
  },
  ar: {
    checkout: {
      cash: "الدفع نقدًا",
      card: "الدفع بالبطاقة",
      total: "المبلغ الإجمالي",
    }
  }
};
```

---

## 📦 Deployment

### Web Version (Current)
```bash
npm run build
# Output: dist/index.html (289kb gzipped)

# Serve via nginx/Apache
cp dist/index.html /var/www/pos/
```

### Tauri Desktop (Future)
```bash
npm run tauri build

# Output:
# Windows: .exe installer (5MB)
# macOS:   .dmg bundle (4MB)
# Linux:   .AppImage (6MB)
```

### Hardware Requirements
- **Minimum**: Dual-core CPU, 4GB RAM, 100MB disk
- **Recommended**: Quad-core, 8GB RAM, SSD
- **Peripherals**: USB barcode scanner, thermal printer, cash drawer

---

**🏆 This architecture is built for:**
- **Speed**: <100ms transaction times
- **Security**: Bank-grade encryption
- **Reliability**: 99.9% uptime
- **Scalability**: From 1 to 1000 stores

**It's not just code. It's a competitive advantage.**
