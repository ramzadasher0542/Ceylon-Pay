# 🛡️ Ash Point POS — Enterprise Retail Command

**A premium, offline-first, highly secure Point of Sale system built with psychological precision.**

---

## 🚀 Features

### 🔐 Security Fortress
- **SQLCipher-Ready Architecture**: IndexedDB vault with simulated encryption (migrates to AES-256 in Tauri)
- **Hardware Fingerprinting**: SHA-256 device lock prevents unauthorized installations
- **AMC Licensing**: Time-based license validation with expiry enforcement
- **Zero Cloud Dependencies**: 100% offline operation

### 💰 Financial Integrity
- **Integer-Only Currency**: All money stored as cents — ZERO floating-point errors
- **WAC Accounting**: Weighted Average Cost calculation for inventory
- **Split Payments**: Multi-tender support (Cash + Card + Credit)
- **Time-Tamper Protection**: Orders rejected if timestamp predates last order

### ⚡ Zero-Touch Workflow
- **Barcode Scanner Trap**: Auto-detects rapid keystroke inputs ending in Enter
- **F-Key Shortcuts**: Complete POS control without touching the mouse
  - `F1` — Product Search
  - `F4` — Void Last Item
  - `F5` — Park Bill
  - `F8` — Customer Credit
  - `F9` — Exact Cash (+ Drawer Kick)
  - `F10` — Refund Mode
  - `F11` — Light/Dark Theme Toggle
  - `F12` — Split Payment Modal
  - `Ctrl+Shift+F12` — God Mode (Login Screen Only)

### 🎨 Premium UI/UX
- **Frosted Glass Aesthetic**: Backdrop blur with high contrast
- **Instant Theme Toggle**: Reduces cashier eye strain
- **Authoritative Design**: Feels expensive and professional
- **Responsive Layouts**: Works on any screen size

### 🔧 Provider God Mode
- **Master Password Access**: Backdoor for service providers (`ASH2026GOD`)
- **Database Backup**: Export to timestamped JSON files
- **Demo Data Seeding**: Quick setup for client demos
- **System Statistics**: Real-time business metrics

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 |
| **State** | Zustand |
| **Database** | IndexedDB (via `idb`) |
| **Icons** | Lucide React |
| **Build** | Vite 7 |

**Future Migration Path:** Tauri v2 + Rust backend with SQLCipher

---

## 🏗️ Database Schema

### Products
```typescript
{
  id: UUID
  sku: string (unique)
  name: string
  price_cents: integer
  costing_method: 'WAC'
  current_wac_cents: integer
  stock_level: integer (allows negatives for "Ghost Stock")
  min_stock_alert: integer
  unit_type: 'pcs' | 'g' | 'cm'
}
```

### Orders
```typescript
{
  id: AlphanumericID (8 chars, barcode-ready)
  timestamp: UnixTimestamp
  total_cents: integer
  status: 'ACTIVE' | 'PARKED' | 'COMPLETED' | 'VOIDED'
  customer_id?: UUID (optional FK)
}
```

### Order Items
```typescript
{
  id: UUID
  order_id: FK → Orders
  product_id: FK → Products
  quantity: integer (negative for refunds)
  unit_price_cents: integer (locked at time of sale)
  subtotal_cents: integer
}
```

### Order Payments
```typescript
{
  id: UUID
  order_id: FK → Orders
  payment_method: 'CASH' | 'CARD' | 'CREDIT'
  amount_cents: integer
  timestamp: UnixTimestamp
}
```

### Customers
```typescript
{
  id: UUID
  phone_number: string (unique)
  name: string
  outstanding_debt_cents: integer (The "Naya" credit ledger)
}
```

### Shifts
```typescript
{
  id: UUID
  opened_at: UnixTimestamp
  closed_at?: UnixTimestamp
  opening_cash_cents: integer
  actual_closing_cash_cents?: integer
  cashier_name?: string
}
```

---

## 🎮 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Development
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
```

### 4. First Login
- **Cashier PIN**: `1111` (POS only)
- **Manager PIN**: `5692` (POS + Back Office)
- **God Mode**: Press `Ctrl+Shift+F12` on login screen
- **Master Password**: `ASH2026GOD`

---

## 🔑 Keyboard Commands

### Global Shortcuts
| Key | Action |
|-----|--------|
| `F1` | Focus Product Search |
| `F4` | Remove Last Cart Item |
| `F5` | Park Current Bill |
| `F8` | Settle via Customer Credit |
| `F9` | Process Exact Cash Payment |
| `F10` | Toggle Refund Mode |
| `F11` | Switch Light/Dark Theme |
| `F12` | Open Split Payment Modal |

### Hidden Commands
| Key | Action |
|-----|--------|
| `Ctrl+Shift+F12` | Unlock Provider God Mode |

---

## 🧠 Business Logic Engines

### WAC Calculation
```typescript
WAC = (CurrentWAC × CurrentStock + NewCost × NewStock) / TotalStock
```

### Split Payment Validation
```typescript
∑(payments.amount_cents) === order.total_cents
```

### Time-Tamper Check
```typescript
newOrder.timestamp > MAX(orders.timestamp)
```

---

## 🎯 Cashier Workflow (4-Hour Mastery)

1. **Scan/Search Product** → Auto-adds to cart
2. **F9** → Instant cash checkout (drawer kicks)
3. **F10** → Toggle refund mode (negative quantities)
4. **F12** → Split between cash/card
5. **F11** → Change theme during long shifts

**No mouse required. Pure keyboard flow.**

---

## 🛡️ Security Features

### Hardware Lock
- Generates SHA-256 hash from:
  - User Agent
  - CPU Cores
  - Screen Resolution
  - Timezone Offset
- Stored in `AppSettings.hardware_fingerprint`
- Validates on every login

### AMC Expiry
- Stored as Unix timestamp in `AppSettings.amc_expiry_date`
- App kills itself if expired
- Only God Mode can override

### Backup System
- Manual JSON export via God Mode
- Filename format: `AshPoint_Backup_YYYY-MM-DD_HH-MM-SS.json`
- Contains full database snapshot

---

## 🎨 Design Philosophy

### Psychological Triggers
1. **Frosted Glass** → Premium, expensive feel
2. **High Contrast** → Reduces eye strain, increases focus
3. **Instant Feedback** → Every action has visual/audio response
4. **Authority Colors** → Blue (trust), Red (danger), Green (success)
5. **Zero Clutter** → Only essential info on screen

### Cashier Experience
- **Auto-focus** search input (cursor always ready)
- **Large touch targets** (minimum 44px)
- **Color-coded modes** (Refund mode = pulsing red badge)
- **Sound effects** (planned: beep on scan, cha-ching on checkout)

---

## 🚧 Roadmap (Tauri Migration)

### Phase 1: Rust Backend
- [ ] SQLCipher integration for true AES-256 encryption
- [ ] Real hardware fingerprinting (motherboard serial + CPU ID)
- [ ] RJ11 cash drawer kick via USB-Serial bridge

### Phase 2: Advanced Features
- [ ] Thermal receipt printer integration (ESC/POS)
- [ ] Customer display pole (RS-232)
- [ ] Multi-currency support
- [ ] Offline invoice generation (PDF)

### Phase 3: Business Intelligence
- [ ] Daily sales reports
- [ ] Stock level alerts
- [ ] Profit margin analytics
- [ ] Employee performance tracking

---

## 🤝 Contributing

This is a **demonstration project** showcasing enterprise POS architecture.  
For production deployments, contact the development team for Tauri migration.

---

## 📄 License

**Proprietary Software**  
© 2026 Ash Point Systems. All rights reserved.

**Hardware-locked licensing model:**
- Each installation generates unique fingerprint
- AMC-based subscription renewal
- Unauthorized redistribution prohibited

---

## 🎓 Credits

Built with psychological precision by an elite developer who understands:
- **Business**: Recurring revenue through hardware locks
- **Psychology**: UI/UX that creates cashier loyalty
- **Technology**: Zero-downtime architecture

**This isn't just software. It's a fortress.**

---

## 🆘 Support

### For Retailers
- Training: 4-hour cashier certification
- Support: Phone + Remote Desktop
- Updates: Automatic via AMC renewal

### For Service Providers (God Mode)
- Master Password: `ASH2026GOD`
- Backup before ANY changes
- Never expose God Mode to clients

---

**⚡ Built for speed. Secured for authority. Designed for profit.**
