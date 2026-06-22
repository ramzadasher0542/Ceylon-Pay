# ⚙️ ASH POINT POS — System Settings Guide

## 🔐 Access Control

**Settings Access:** Admin Only (PIN: 5692)

**Who Can Access:**
- ✅ Admin (5692) — Full control
- ❌ Manager (2026) — Settings tab hidden
- ❌ Cashier (1111) — No back office access

---

## 📊 Settings Overview

### 6 Configuration Tabs

1. **Modules** — Feature toggles (PO, RTV, Loyalty, Stock Adjustments)
2. **Business** — Store identity (Name, BRN, TIN, Address, Footer)
3. **Hardware** — Thermal printer, cash drawer, barcode scanner
4. **Email/SMS** — SMTP config, Z-report automation, debt recovery
5. **Tax Config** — VAT, SSCL, inclusive/exclusive pricing
6. **RBAC** — Role-based access control matrix

---

## 1️⃣ MODULES TAB

### Feature Toggles

#### Purchase Orders (PO)
```
[ ] Enable Purchase Orders
```

**When Enabled:**
- Track incoming stock from suppliers
- Create PO documents with line items
- Mark items as PENDING → RECEIVED → COMPLETE
- Update stock levels automatically on receipt
- Calculate WAC/FIFO costs from PO prices

**Use Case:** Hardware stores with 50+ suppliers

---

#### Return to Vendor (RTV)
```
[ ] Enable Return to Vendor
```

**When Enabled:**
- Log damaged/defective goods
- Link to original PO
- Deduct from stock
- Track supplier credit amounts
- Auto-deduct credit from next PO

**Use Case:** High-value items (electronics, appliances)

---

#### Customer Loyalty Program
```
[ ] Enable Customer Loyalty Program
```

**When Enabled:**
- Enroll customers with cards
- Earn points ($1 = 1 point)
- Redeem points (100 pts = $1 discount)
- Tier system (Bronze/Silver/Gold/Platinum)
- Auto-apply discounts at checkout

**Use Case:** Repeat-customer businesses (grocery, pharmacy)

---

#### Staff Stock Adjustments
```
[ ] Enable Staff Stock Adjustments
```

**When Enabled:**
- Employees can adjust inventory
- Must select reason code
- Logs user PIN + timestamp
- Tracks old/new quantity
- Audit trail for every change

**⚠️ Warning:** Disable if employee theft suspected

**Reason Codes:**
- WASTAGE (expired/spoiled)
- DAMAGE (broken items)
- THEFT (confirmed)
- COUNT_CORRECTION (physical count variance)
- RETURN_TO_VENDOR
- OTHER (requires notes)

---

## 2️⃣ BUSINESS TAB

### Business Identity

**Required Fields:**
```
Store Name: Ash Point Hardware
Business Registration Number (BRN): 123456789
Tax Identification Number (TIN): TIN987654321
Address Line 1: 123 Main Street
City: Business City
Phone Number: +1234567890
```

**Optional Fields:**
```
Address Line 2: Suite 200
Postal Code: 12345
Email: info@ashpoint.com
```

### Receipt Footer
```
Footer Text: "Powered by Ash Point Solutions | Contact: +1234567890"
```

**Appears on:**
- Thermal receipt printouts
- Email invoices
- PDF exports

---

## 3️⃣ HARDWARE TAB

### Thermal Printer Configuration

**Enable Thermal Printer:**
```
[✓] Enable Thermal Printer
```

**Settings:**
- **Driver Type:** WINDOWS | LINUX | ESC_POS
- **Paper Width:** 58mm | 80mm
- **COM Port:** COM3 (Windows) or /dev/ttyUSB0 (Linux)
- **Baud Rate:** 9600 (standard) | 115200 (high-speed)

**Supported Printers:**
- Epson TM-T20
- Star TSP143
- Citizen CT-S310
- Generic ESC/POS compatible

**Test Print:** Click "Print Test Receipt" to verify

---

### Cash Drawer Configuration

**Enable Cash Drawer:**
```
[✓] Enable Cash Drawer
```

**Settings:**
- **Connection Type:** RJ11 (standard) | USB
- **COM Port:** COM3 or same as printer
- **Kick Code:** `1B7000FA` (ESC/POS default)

**Alternative Codes:**
- Epson: `1B7000FA`
- Star: `1B0705FF`
- Custom: Enter hex code from manual

**Test Kick:** Click "Test Drawer" to verify

---

### Barcode Scanner (Auto-Detected)

**No configuration needed** — USB scanners work automatically.

**Supported Types:**
- USB HID (plug-and-play)
- Bluetooth (pair first)
- Wireless (with USB dongle)

**Setup:**
1. Plug in scanner
2. Configure to emit keyboard input
3. Set suffix to `Enter` (CR)
4. Test by scanning product barcode

---

## 4️⃣ EMAIL/SMS TAB

### SMTP Configuration (Email Reports)

**Enable Email Reports:**
```
[✓] Enable Email Reports
```

**Settings:**
```
SMTP Server: smtp.gmail.com
Port: 587 (TLS) or 465 (SSL)
Sender Email: yourstore@gmail.com
App Password: xxxx xxxx xxxx xxxx
```

**Gmail Setup:**
1. Enable 2FA on Gmail
2. Generate App Password (not regular password)
3. Use 16-character code (spaces removed)

**Auto-send Z-Report:**
```
[✓] Auto-send Z-Report (End of Day)
```

**Recipient Emails:**
```
owner@company.com, manager@company.com
```

**Triggers:**
- Daily Z-report at shift close
- Weekly summary (Sunday night)
- Monthly profit report (1st of month)

---

### SMS Configuration (Debt Recovery)

**SMS API Key:**
```
Enter API Key: twilio_abc123xyz...
```

**Supported Providers:**
- Twilio (recommended)
- Vonage (Nexmo)
- AWS SNS
- Custom REST API

**Use Cases:**
- Monthly debt reminders
- Payment confirmation receipts
- Shift alerts to manager
- Low stock notifications

---

## 5️⃣ TAX CONFIG TAB

### VAT (Value Added Tax)

**Enable VAT:**
```
[✓] Enable VAT
```

**Settings:**
```
VAT Rate (%): 15
[✓] VAT Inclusive Pricing
```

**VAT Inclusive:**
- ✅ Enabled: Price already includes VAT
  - Display: $10.00 (incl. VAT $1.30)
  - Customer pays: $10.00

- ❌ Disabled: VAT added at checkout
  - Display: $10.00 + 15% VAT
  - Customer pays: $11.50

**Calculation:**
```typescript
// Inclusive
VAT = Price × (Rate / (100 + Rate))
VAT = $10.00 × (15 / 115) = $1.30

// Exclusive
VAT = Price × (Rate / 100)
VAT = $10.00 × 0.15 = $1.50
```

---

### SSCL (Special Sales & Consumption Levy)

**Enable SSCL:**
```
[✓] Enable SSCL
```

**Settings:**
```
SSCL Rate (%): 2.5
```

**Applied On:**
- Luxury goods
- Alcohol
- Tobacco
- High-value electronics

**Stacked with VAT:**
```
Product: $100.00
VAT (15%): +$15.00
SSCL (2.5%): +$2.50
Total: $117.50
```

---

### Costing Method

**Fixed: FIFO (First-In, First-Out)**

```
⚠️ Hardcoded for accurate gross profit
Cannot be changed to WAC or LIFO
```

**Why FIFO?**
- GAAP compliant
- Accurate for perishables
- Matches physical stock flow
- Prevents profit manipulation

**How It Works:**
1. Receive Batch A: 10 units @ $5
2. Receive Batch B: 20 units @ $6
3. Sell 15 units:
   - Deduct 10 from Batch A ($50 COGS)
   - Deduct 5 from Batch B ($30 COGS)
   - Total COGS: $80 (not average)

---

## 6️⃣ RBAC TAB

### Role-Based Access Control

**3 Default Roles:**

#### CASHIER (PIN: 1111)
```
✅ POS Access
❌ Back Office
❌ Settings
✅ Void Items
❌ Discounts (0% max)
❌ Refunds
❌ Stock Adjustments
❌ Reports
❌ User Management
❌ Close Shift
```

**Use Case:** Front-desk staff, part-time workers

---

#### MANAGER (PIN: 2026)
```
✅ POS Access
✅ Back Office
❌ Settings
✅ Void Items
✅ Discounts (20% max)
✅ Refunds
✅ Stock Adjustments (if enabled)
✅ Reports
❌ User Management
✅ Close Shift
```

**Use Case:** Store managers, shift supervisors

---

#### ADMIN (PIN: 5692)
```
✅ POS Access
✅ Back Office
✅ Settings
✅ Void Items
✅ Discounts (100% max)
✅ Refunds
✅ Stock Adjustments
✅ Reports
✅ User Management
✅ Close Shift
```

**Use Case:** Store owners, IT administrators

---

### Customizing Permissions

**⚠️ Currently Hardcoded**

**Future Enhancement:**
- Dynamic permission matrix per user
- Custom discount limits per cashier
- Time-based access restrictions
- Department-specific access

**To Change Now:**
Edit `src/lib/db-types.ts` → `DEFAULT_PERMISSIONS`

---

## 🔐 Provider God Mode

**Access:** `Ctrl+Shift+F12` → Password: `ASH2026GOD`

**Additional Controls:**
- Database raw SQL access
- Hardware fingerprint regeneration
- AMC expiry date override
- Cloud sync server URL
- License activation keys
- System-level debugging

**⚠️ Never share with clients!**

---

## 💾 Saving Settings

**Auto-save:** Changes saved immediately to database

**Manual Save:**
- Click **"Save All Changes"** button (top-right)
- Confirmation alert appears
- Settings persist across restarts

**Backup:**
- Settings included in database backups (God Mode)
- Export settings JSON separately (planned)

---

## 🔄 Cloud Sync Configuration (Future)

**Offline-to-Cloud Engine:**

```
[✓] Enable Cloud Sync
```

**Settings:**
```
Server URL: https://sync.ashpoint.cloud
API Key: [Auto-generated]
Sync Interval: 60 minutes
Last Sync: 2026-01-15 14:30:00
```

**How It Works:**
1. POS runs 100% offline
2. Background service detects internet
3. Encrypts local SQLite database
4. Pushes backup to secure cloud server
5. Logs sync timestamp

**Security:**
- AES-256 encryption before upload
- TLS 1.3 transport encryption
- Zero-knowledge architecture
- Provider cannot decrypt data

---

## 🎓 Admin Training Checklist

### Settings Mastery (2 hours)

**Module 1: Module Toggles (15 min)**
- [ ] Enable/disable PO system
- [ ] Test RTV workflow
- [ ] Configure loyalty tiers
- [ ] Set stock adjustment rules

**Module 2: Business Setup (20 min)**
- [ ] Enter store details
- [ ] Configure receipt footer
- [ ] Upload thermal logo (planned)
- [ ] Test receipt print

**Module 3: Hardware (30 min)**
- [ ] Install thermal printer driver
- [ ] Configure COM ports
- [ ] Test drawer kick
- [ ] Troubleshoot scanner

**Module 4: Email/SMS (20 min)**
- [ ] Set up Gmail App Password
- [ ] Test Z-report email
- [ ] Configure Twilio API
- [ ] Send test SMS

**Module 5: Tax Setup (15 min)**
- [ ] Calculate VAT rate
- [ ] Choose inclusive/exclusive
- [ ] Configure SSCL
- [ ] Test receipt with taxes

**Module 6: RBAC Review (20 min)**
- [ ] Understand role hierarchy
- [ ] Change PINs in code (future: UI)
- [ ] Test each role's access
- [ ] Document custom permissions

**Certification:** "Ash Point Admin Certified"

---

## 🚨 Common Issues

### Issue: Settings not saving
**Fix:** Check browser console for errors, ensure IndexedDB not blocked

### Issue: Thermal printer not detected
**Fix:** Verify COM port, check baud rate, reinstall driver

### Issue: SMTP connection fails
**Fix:** Use App Password (not regular), check firewall port 587

### Issue: SMS not sending
**Fix:** Verify API key, check account balance (Twilio credits)

### Issue: VAT calculation incorrect
**Fix:** Toggle inclusive/exclusive, recalculate manually

---

## 📞 Support

**For Admins:**
- Settings Training: 2-hour session
- Hardware Setup: Remote/on-site
- Customization: Available via provider

**For Providers:**
- God Mode documentation
- White-label branding
- Custom module development

---

**⚙️ Settings are power.**

**Configure once. Profit forever.**

**Admin PIN: 5692**  
**Settings Tab: Unlocked**

---

*Ash Point POS v2.2 | System Settings Module | Admin Manual*
