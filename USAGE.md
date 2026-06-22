# 📖 Ash Point POS — Quick Usage Guide

## 🔐 First Time Setup

### Step 1: Login
1. Open the application
2. You'll see the **Login Screen**
3. Enter PIN: **`5692`**
4. Click **Unlock** or press `Enter`

### Step 2: Add Demo Products (God Mode)
1. On the **Login Screen**, press `Ctrl+Shift+F12`
2. Enter Master Password: **`ASH2026GOD`**
3. Click **"Add Demo Products"**
4. Click **"Exit"** to return to login
5. Login with your PIN again

---

## 💼 Daily Operations

### Opening a Shift (Manual)
1. Login to POS
2. Record opening cash amount
3. Start selling!

### Selling Products

#### Method 1: Barcode Scanner
1. Scanner must emit keystrokes ending with `Enter`
2. Point scanner at barcode
3. Product auto-adds to cart
4. Hear confirmation beep (planned)

#### Method 2: Manual Search
1. Press `F1` or click search box
2. Type product name or SKU
3. Click product from results
4. Product added to cart

### Processing Payments

#### Simple Cash Sale
1. Items in cart
2. Press `F9` or click **"Cash Payment"**
3. Confirm total
4. Cash drawer kicks open (Tauri version)
5. Cart clears automatically

#### Card Payment
1. Items in cart
2. Click **"Card Payment"**
3. Process card on terminal
4. Confirm payment
5. Cart clears

#### Split Payment
1. Items in cart
2. Press `F12` or click **"Split Payment"**
3. Enter cash amount (in cents)
4. Enter card amount (in cents)
5. **Total must equal order total**
6. Click **"Complete"**

#### Customer Credit (Naya)
1. Items in cart
2. Press `F8` or click **"Customer Credit"**
3. Enter/select customer phone number
4. Confirm credit extension
5. Updates customer's `outstanding_debt_cents`

### Refunds
1. Press `F10` to enter **Refund Mode**
2. Screen shows pulsing **"REFUND MODE"** badge
3. Scan/search products to refund
4. Quantities become **negative**
5. Process payment (cash/card)
6. Press `F10` again to exit refund mode

### Parking Bills (Hold Order)
1. Items in cart
2. Press `F5` or click **"Park Bill"**
3. Order saved with status `PARKED`
4. Cart clears
5. **Retrieve parked orders** (TODO: UI pending)

### Voiding Items
1. Last item in cart highlighted
2. Press `F4` to remove last item
3. Or click trash icon next to item

---

## 🎨 Theme Toggle

### Quick Switch
- Press `F11` at any time
- Instant light/dark mode toggle
- Preference saved automatically

### Benefits
- **Dark Mode**: Reduces eye strain during night shifts
- **Light Mode**: Better visibility in bright retail environments

---

## 🛡️ Provider Functions (God Mode)

### Accessing God Mode
1. **ONLY** from Login Screen
2. Press `Ctrl+Shift+F12`
3. Enter password: `ASH2026GOD`

### Backup Database
1. In God Mode, click **"Create Backup"**
2. JSON file downloads with timestamp
3. Store in secure location
4. Format: `AshPoint_Backup_YYYY-MM-DD_HH-MM-SS.json`

### Seed Demo Data
1. Click **"Add Demo Products"**
2. Adds 5 sample products:
   - Coca Cola 330ml ($1.50)
   - Lays Chips Classic ($2.50)
   - White Bread Loaf ($3.50)
   - Fresh Milk 1L ($4.50)
   - Basmati Rice 5kg ($12.00)
3. All have stock levels and WAC costs

### View Statistics
- **Products**: Total SKUs in system
- **Orders**: Completed transactions
- **Total Revenue**: Sum of all completed orders

---

## 🧮 Understanding Inventory

### Ghost Stock (Negative Inventory)
- Stock can go **negative** (e.g., `-5`)
- Indicates **backorders** or **pre-sold items**
- Useful for drop-shipping or just-in-time inventory

### WAC (Weighted Average Cost)
- Automatically calculated when new stock arrives
- Formula: `(OldWAC × OldQty + NewCost × NewQty) / TotalQty`
- Ensures accurate profit margins

### Min Stock Alert
- Set `min_stock_alert` per product
- **Visual warning** when stock falls below threshold (TODO)
- Triggers reorder notification

---

## 🔑 Complete Keyboard Shortcuts

| Key | Function | Context |
|-----|----------|---------|
| `F1` | Focus Search | POS Screen |
| `F4` | Void Last Item | POS Screen |
| `F5` | Park Bill | POS Screen |
| `F8` | Customer Credit | POS Screen |
| `F9` | Cash Payment | POS Screen |
| `F10` | Toggle Refund Mode | POS Screen |
| `F11` | Toggle Theme | Any Screen |
| `F12` | Split Payment | POS Screen |
| `Ctrl+Shift+F12` | God Mode | **Login Screen Only** |
| `Enter` | Confirm/Submit | All Inputs |
| `Esc` | Close Modal | Modals |

---

## ⚠️ Troubleshooting

### "Product not found" on scan
- Check barcode matches `product.sku` in database
- Use God Mode to verify SKU format
- Test with manual search first

### "Time tampering detected"
- Computer clock was adjusted backwards
- Orders must have chronological timestamps
- Fix system clock, then restart app

### "AMC Expired"
- Annual Maintenance Contract has expired
- Contact service provider for renewal
- God Mode can view expiry date

### "Hardware Mismatch"
- App installed on different computer
- License locked to original hardware
- Contact provider for license transfer

### Cart not clearing after payment
- Check browser console for errors
- Database may be locked
- Backup data, clear IndexedDB, restore

---

## 📊 Reports (Planned)

### Daily Z Report
- Total sales
- Payment breakdown (cash/card/credit)
- Shift totals
- **Currently manual export via God Mode**

### Stock Valuation
- Total inventory value (qty × WAC)
- Low stock alerts
- **TODO: Dedicated report screen**

### Customer Ledger
- Outstanding credit per customer
- Payment history
- **TODO: Customer management screen**

---

## 🎓 Training Checklist

### New Cashier (4-Hour Course)
- [ ] Login with PIN
- [ ] Scan/search products
- [ ] Process cash sale (F9)
- [ ] Process card sale
- [ ] Toggle refund mode (F10)
- [ ] Void items (F4)
- [ ] Park a bill (F5)
- [ ] Split payment (F12)
- [ ] Change theme (F11)
- [ ] Handle "product not found"
- [ ] Never share PIN

### Service Provider (1-Hour Course)
- [ ] God Mode access (`Ctrl+Shift+F12`)
- [ ] Database backup procedure
- [ ] Seed demo data
- [ ] Interpret system stats
- [ ] License renewal process
- [ ] Hardware fingerprint concepts
- [ ] **Never expose God Mode to clients**

---

## 🚀 Performance Tips

### For Smooth Operation
1. **Close other browser tabs** (if web version)
2. **Use latest Chrome/Edge** for best IndexedDB performance
3. **Regular backups** (weekly minimum)
4. **Monitor disk space** (database grows with orders)
5. **Restart app daily** after closing shift

### For Large Inventories (1000+ SKUs)
- Search indexing is automatic
- Consider product categories (TODO)
- Use consistent SKU format (e.g., `CAT-0001`)

---

## 🔒 Security Best Practices

### For Retailers
1. **Unique PINs** per cashier
2. **Change PINs monthly**
3. **Never share Master Password**
4. **Lock computer when away**
5. **Backup before ANY system changes**

### For Providers
1. **Document hardware fingerprint** at installation
2. **Set realistic AMC expiry dates**
3. **Test backups regularly**
4. **Keep Master Password in password manager**
5. **Always backup before God Mode actions**

---

## 📞 Support Contacts

### For Retailers
- **Training**: Book 4-hour on-site session
- **Support**: Phone/WhatsApp during business hours
- **Emergency**: Remote desktop support
- **Renewals**: AMC renewal 30 days before expiry

### For Providers
- **Technical Docs**: Full API documentation
- **Migration Guide**: Tauri v2 conversion steps
- **License Management**: Bulk license generator
- **Custom Development**: Feature requests

---

**🎯 Remember: Speed is revenue. Accuracy is reputation. Security is survival.**

**Master the F-keys. Never touch the mouse.**

**Your keyboard is your weapon. The cart is your battlefield.**

**Every second saved is profit earned.**

---

*Last Updated: 2026 | Ash Point POS v2.0.0*
