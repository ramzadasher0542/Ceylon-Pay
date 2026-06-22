# 📊 Ash Point POS — Back Office Command Center

## 🎯 Overview

The Back Office is a **manager-only** dashboard providing real-time business intelligence, inventory control, and loss prevention tools.

**Access Level:** Manager PIN `5692` only  
**Features:** Dashboard, Inventory, Sales Reports, Debt Recovery, Audit Trail, Settings

---

## 🔑 Access Control

### Role Hierarchy

```
┌─────────────────────────────────────┐
│  CASHIER (PIN: 1111)                │
│  ✅ POS Sales Interface             │
│  ❌ No Reports                      │
│  ❌ No Back Office                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  MANAGER (PIN: 5692)                │
│  ✅ Full POS Access                 │
│  ✅ Back Office Dashboard           │
│  ✅ All Reports                     │
│  ✅ Inventory Management            │
│  ✅ Audit Trail ("Snitch Log")      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  PROVIDER (Ctrl+Shift+F12)          │
│  ✅ God Mode                         │
│  ✅ Database Backup                 │
│  ✅ System Settings                 │
└─────────────────────────────────────┘
```

---

## 📊 Dashboard — Live Pulse

### Real-Time Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Today's Sales** | Total revenue since midnight | Sum of completed orders today |
| **Gross Profit** | Selling price - Cost price (FIFO) | Revenue × Estimated margin |
| **Total Orders** | Number of transactions | Count of completed orders |
| **Cash in Drawer** | Current shift's cash | Opening + Cash sales - Payouts |
| **Low Stock Alerts** | Items below minimum | Products where stock ≤ min_alert |
| **Discounts Given** | Total discount amount | Sum of discount field (planned) |

### Quick Actions

- **Stock Count**: Launch physical inventory count
- **Daily Report**: Generate end-of-day Z report
- **Manage Staff**: Add/edit cashier PINs (planned)
- **Send SMS**: Bulk debt recovery messages

---

## 📦 Inventory Management

### Master Stock Ledger

**Real-Time Visibility:**
- Current stock levels
- Cost basis (WAC or FIFO)
- Reorder points
- Supplier information

**Features:**
- Search by SKU/Name
- Filter by low stock
- Sort by value/quantity
- Export to CSV

### Employee Stock Adjustments

**Security Toggle:**
```typescript
settings.allow_stock_adjustments = true/false
```

**When Enabled:**
- Forces reason code selection
- Logs user PIN
- Records old/new quantity
- Timestamps every change

**Reason Codes:**
- `WASTAGE` — Expired/spoiled goods
- `DAMAGE` — Broken items
- `THEFT` — Confirmed employee theft
- `COUNT_CORRECTION` — Physical count variance
- `RETURN_TO_VENDOR` — RTV deduction
- `OTHER` — Requires notes

**Audit Trail:**
```typescript
{
  timestamp: Date.now(),
  user_pin: "5692",
  product_id: "abc123",
  quantity_change: -5,
  reason: "WASTAGE",
  reason_notes: "Milk expired 2 days ago",
  old_stock: 20,
  new_stock: 15
}
```

### Wastage & Damage Tracking

**Separate from Theft:**
- Dedicated wastage log
- Doesn't mask employee theft patterns
- Tracks loss by category
- Identifies problem suppliers

**Monthly Report:**
- Total wastage value
- Top wasted products
- Wastage % of revenue
- Trend analysis

### Kitting & Bundling

**Example: Plumbing Repair Kit**

**Kit Product:**
```
SKU: KIT-PLUMB-001
Name: "Emergency Plumbing Kit"
Price: $49.99
```

**Components:**
```typescript
[
  { product_id: "PIPE-PVC-12", quantity: 2 },  // 2× PVC pipes
  { product_id: "GLUE-001", quantity: 1 },     // 1× PVC glue
  { product_id: "TAPE-001", quantity: 1 }      // 1× Teflon tape
]
```

**On Sale:**
- Customer buys 1 kit
- System auto-deducts 2 pipes, 1 glue, 1 tape
- Stock levels update instantly
- Profit calculated on component costs

### Barcode Generation

**Auto-SKU for Loose Items:**

**Use Case:** Customer brings in loose screws to weigh
1. Weigh item: 250g
2. System generates SKU: `BULK-SCREW-250G-20240115`
3. Print sticky label to thermal printer
4. Stick on product bag
5. Scan at checkout

**Label Format:**
```
┌─────────────────────────┐
│ BULK SCREWS - 250g      │
│ ▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃       │ (barcode)
│ BULK-SCREW-250G-001     │
│ $12.50                  │
└─────────────────────────┘
```

---

## 💰 Purchase Orders (PO) — Optional Module

**Enable in Settings:**
```typescript
settings.enable_purchase_orders = true
```

### Create PO

**Fields:**
- Supplier name
- Expected delivery date
- Line items (product, qty, cost)
- Total PO value
- Notes

**Status Flow:**
```
PENDING → RECEIVED → COMPLETE
         ↓
      CANCELLED
```

### Receive Stock

**Process:**
1. Select pending PO
2. Scan items as they arrive
3. Mark quantities received
4. System updates:
   - Stock levels (+qty)
   - Stock batches (for FIFO)
   - Product costs (recalculate WAC)

**Partial Receipts:**
- Ordered: 100 units
- Received: 75 units
- Status: Partial (auto-creates backorder)

---

## 🔄 Return to Vendor (RTV)

**Use Case:** Supplier sent damaged goods

**Process:**
1. Create RTV record
2. Link to original PO
3. Specify damaged items
4. Deduct from stock
5. Log supplier credit amount

**Impact:**
- Stock reduces
- Supplier debt increases
- Next PO auto-deducts credit

---

## 🎁 Loyalty Program — Optional Module

**Enable in Settings:**
```typescript
settings.enable_loyalty_program = true
```

### Card Tiers

| Tier | Requirement | Discount | Color |
|------|-------------|----------|-------|
| Bronze | 0-499 pts | 0% | 🟤 |
| Silver | 500-999 pts | 5% | ⚪ |
| Gold | 1000-4999 pts | 10% | 🟡 |
| Platinum | 5000+ pts | 15% | 💎 |

### Points Earning

**Rule:** $1 spent = 1 point

**Example:**
- Customer spends $50
- Earns 50 points
- Current balance: 350 → 400 points
- Tier: Bronze (needs 100 more for Silver)

### Points Redemption

**Conversion:** 100 points = $1 discount

**At Checkout:**
1. Scan loyalty card
2. Total: $25.00
3. Customer redeems 500 points
4. Discount: $5.00
5. New total: $20.00
6. New balance: 400 - 500 = -100 (if allowed)

---

## 🕵️ The "Snitch" Log — Audit Trail

### What Gets Logged

| Action | Trigger | Data Captured |
|--------|---------|---------------|
| **Void** | F4 or manual remove | User PIN, product, timestamp |
| **Drawer Kick** | F9 cash payment | User PIN, order total, time |
| **Discount** | Price override | User PIN, old/new price, reason |
| **Refund** | F10 refund mode | User PIN, items, total |
| **Stock Adjust** | Inventory change | User PIN, qty change, reason |
| **Login** | Any PIN entry | User PIN, timestamp, role |

### Suspicious Pattern Detection

**Red Flags:**
- Multiple voids by same cashier
- Frequent drawer kicks without sales
- Large discounts without manager approval
- Stock adjustments at odd hours
- Login attempts outside shift

**Weekly Report:**
```
Cashier PIN 1111:
- 15 voids this week (avg: 3)
- $127 in discounts (avg: $20)
⚠️ REVIEW REQUIRED
```

### Loss Prevention Digest

**Daily Email (Auto-Send):**
```
Subject: Daily Loss Prevention Report

Total Voids: 12 ($348.50)
Top Voider: PIN 1111 (8 voids)

Discounts Given: $276.00
Top Discounter: PIN 5692 (Manager)

Drawer Kicks: 47
Expected: 45 sales
⚠️ 2 extra kicks detected

Wastage Logged: $89.00 (3% of sales)
```

---

## 💸 Debt Recovery (Naya Management)

### Credit Ledger

**Customer Record:**
```typescript
{
  id: "cust-123",
  phone: "+1234567890",
  name: "John Doe",
  outstanding_debt: 15000, // $150.00
  credit_limit: 50000,     // $500.00
  last_payment: 1704067200,
  created_at: 1672531200
}
```

### Debt Tracking

**On Credit Sale:**
1. Customer buys $50 on credit
2. `outstanding_debt` += 5000 cents
3. Receipt shows: "Balance Due: $200.00"

**On Payment:**
1. Customer pays $100 cash
2. `outstanding_debt` -= 10000 cents
3. New balance: $100.00

### Partial Settlements

**Flexible Payments:**
- Allow any amount (even $5)
- Track payment history
- Show last payment date
- Calculate days overdue

### Automated SMS Reminders

**Integration:**
```typescript
// Example: Twilio API
const smsConfig = {
  api_key: settings.sms_api_key,
  from_number: "+1234567890"
};
```

**Monthly Blast:**
```
Dear [Name],

Your current balance with [Store Name] is $[Amount].

Please settle at your earliest convenience.

Thank you!
```

**One-Click Send:**
1. Click "Send Monthly Reminders"
2. System queries all customers with debt > $0
3. Sends SMS to each
4. Logs sent timestamp
5. Shows success/failure report

**Advanced:**
- Schedule auto-send (1st of month)
- Filter by debt amount (only >$100)
- Personalized messages per tier
- Track response rate

---

## ⚙️ Module Settings

### Feature Toggles

```typescript
{
  allow_stock_adjustments: true,
  enable_purchase_orders: false,
  enable_loyalty_program: false,
  enable_sms_reminders: false,
  require_void_reason: true,
  require_discount_approval: true,
  max_discount_percent: 20,
  auto_backup_enabled: true,
  backup_frequency_hours: 24
}
```

### Stock Adjustment Control

**When `allow_stock_adjustments = false`:**
- Only God Mode can adjust stock
- Prevents employee theft via fake adjustments
- All changes must go through manager

**When `allow_stock_adjustments = true`:**
- Cashiers can adjust with reason
- Every change is logged
- Manager reviews audit trail

---

## 📈 FIFO Costing (vs WAC)

### Weighted Average Cost (WAC)

**How it Works:**
```
Stock Batches:
- Batch 1: 10 units @ $5 = $50
- Batch 2: 20 units @ $6 = $120

WAC = ($50 + $120) / (10 + 20) = $5.67 per unit
```

**Pros:**
- Simple calculation
- Good for identical items
- Smooths price fluctuations

**Cons:**
- Not GAAP compliant
- Ignores inflation
- Inaccurate for perishables

### First-In, First-Out (FIFO)

**How it Works:**
```
Stock Batches (in order received):
1. Batch A: 10 units @ $5 (oldest)
2. Batch B: 20 units @ $6

Sale of 15 units:
- Use 10 from Batch A ($5) = $50
- Use 5 from Batch B ($6) = $30
- Total COGS: $80
- Avg cost: $80/15 = $5.33
```

**Pros:**
- GAAP compliant
- Accurate for perishables
- Matches physical flow

**Cons:**
- Complex tracking
- Requires batch database
- More storage needed

### Ash Point Implementation

**Current:** WAC (simple, fast)  
**Planned:** FIFO (accurate, professional)

**Migration Path:**
1. Add `StockBatch` table
2. Track each receipt separately
3. On sale, deduct from oldest batch first
4. Calculate profit per batch
5. Show true gross margin

---

## 🎯 Manager Workflows

### Daily Opening Checklist
- [ ] Login with Manager PIN (5692)
- [ ] Review overnight sales (if 24/7)
- [ ] Check low stock alerts
- [ ] Review yesterday's voids/discounts
- [ ] Open new shift (record opening cash)

### Mid-Day Tasks
- [ ] Monitor dashboard (sales vs target)
- [ ] Respond to low stock alerts (create POs)
- [ ] Review cashier void patterns
- [ ] Process customer credit requests

### End-of-Day Closing
- [ ] Close shift (count cash drawer)
- [ ] Compare cash vs system total
- [ ] Investigate discrepancies
- [ ] Generate daily Z report
- [ ] Backup database (God Mode)
- [ ] Send SMS to debtors (if month-end)

---

## 🚀 Future Enhancements

### Phase 1 (Current Release)
- ✅ Dashboard with live stats
- ✅ Role-based access (Cashier vs Manager)
- ✅ Basic audit trail structure

### Phase 2 (Next Sprint)
- [ ] Full inventory management UI
- [ ] Stock adjustment form with reasons
- [ ] FIFO cost calculation engine
- [ ] Wastage tracking reports

### Phase 3 (Q2 2026)
- [ ] Purchase Order workflow
- [ ] Return to Vendor processing
- [ ] Loyalty card enrollment
- [ ] Points redemption at checkout

### Phase 4 (Q3 2026)
- [ ] SMS API integration (Twilio)
- [ ] Automated debt recovery blasts
- [ ] Advanced analytics dashboard
- [ ] AI-powered theft detection

---

## 📞 Support

### For Managers
- Training: 2-hour Back Office certification
- Access: Manager PIN required
- Support: Phone/email during business hours

### For Providers
- God Mode: Full system access
- Customization: White-label branding
- Integration: API development available

---

## 🎓 Manager Training Curriculum

### Module 1: Dashboard (30 min)
- Understanding live metrics
- Interpreting gross profit
- Responding to alerts

### Module 2: Inventory (45 min)
- Master stock ledger
- Stock adjustments
- Wastage vs theft differentiation
- Kitting/bundling setup

### Module 3: Loss Prevention (30 min)
- Reading the Snitch Log
- Identifying suspicious patterns
- Weekly void review
- Cash drawer reconciliation

### Module 4: Debt Recovery (15 min)
- Credit ledger management
- SMS reminder system
- Partial payment processing
- Overdue account handling

**Total Training Time:** 2 hours  
**Certification Test:** 20 questions (80% pass rate)

---

**🎯 The Back Office isn't just software.**

**It's your command center. Your early warning system. Your profit protector.**

**Login: 5692**  
**Access: Granted**  
**Control: Total**

---

*Ash Point POS v2.0.0 | Back Office Module | Manager's Manual*
