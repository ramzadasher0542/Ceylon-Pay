# ⚡ Ash Point POS — 60-Second Quick Start

## 🎯 First Time User

### Step 1: Open the App
The login screen appears with a premium frosted glass design.

### Step 2: Add Demo Products
1. Press `Ctrl` + `Shift` + `F12`
2. Enter password: **`ASH2026GOD`**
3. Click **"Add Demo Products"**
4. Click **"Exit"**

### Step 3: Login
**Option A - Cashier (POS Only):**
1. Enter PIN: **`1111`**
2. Access: Sales interface only

**Option B - Manager (Full Access):**
1. Enter PIN: **`5692`**
2. Access: Back Office Dashboard + POS

### Step 4: Make Your First Sale
1. **Scan or Search:**
   - Type `COLA001` and press `Enter` (simulates barcode scanner)
   - OR press `F1`, search for "cola", click result

2. **Checkout:**
   - Press `F9` (Exact Cash Payment)
   - Confirm the total
   - Done! Cart clears automatically.

---

## ⌨️ Essential Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F1` | Search Products |
| `F4` | Remove Last Item |
| `F9` | **Cash Payment (Most Used)** |
| `F10` | Refund Mode |
| `F11` | Toggle Theme |
| `F12` | Split Payment |

### Hidden Shortcut
- `Ctrl+Shift+F12` (Login Screen Only) → God Mode

---

## 📦 Demo Products (Included)

| SKU | Product | Price |
|-----|---------|-------|
| `COLA001` | Coca Cola 330ml | $1.50 |
| `CHIPS001` | Lays Chips Classic | $2.50 |
| `BREAD001` | White Bread Loaf | $3.50 |
| `MILK001` | Fresh Milk 1L | $4.50 |
| `RICE001` | Basmati Rice 5kg | $12.00 |

---

## 🎮 Try These Workflows

### Simple Sale
1. Scan `COLA001`
2. Press `F9`
3. Done in **5 seconds**

### Multiple Items
1. Scan `COLA001`
2. Scan `CHIPS001`
3. Scan `BREAD001`
4. Press `F9`

### Refund
1. Press `F10` (activates Refund Mode)
2. Scan `COLA001`
3. Notice quantity is `-1` and price is negative
4. Press `F9` to process
5. Press `F10` again to exit Refund Mode

### Split Payment
1. Scan `RICE001` ($12.00 = 1200 cents)
2. Press `F12`
3. Enter cash: `1000` (cents)
4. Enter card: `200` (cents)
5. Click **"Complete"**

### Void Last Item
1. Scan `COLA001`
2. Scan `CHIPS001`
3. Oops! Wrong item
4. Press `F4` (chips removed)
5. Continue shopping

---

## 🎨 Theme Toggle

- **Dark Mode** (Default): Reduces eye strain, looks premium
- **Light Mode**: Better in bright stores
- Toggle anytime with `F11`

---

## 🛡️ God Mode Features

### Access
1. Logout from POS
2. On login screen: `Ctrl+Shift+F12`
3. Password: `ASH2026GOD`

### What You Can Do
- **Create Backup**: Export database to JSON
- **Add Demo Products**: Quick setup for testing
- **View Stats**: Products, orders, revenue
- **Check License**: Hardware fingerprint, AMC expiry

### ⚠️ Warning
God Mode has unrestricted access. Always backup before changes.

---

## 📱 Barcode Scanner Setup

### Supported Scanners
- Any USB scanner that emits keyboard input
- Must end scans with `Enter` key
- Tested with: Honeywell, Zebra, Symbol

### Configuration
1. Plug scanner into USB
2. Set to **Keyboard Emulation Mode**
3. Configure suffix: `Enter` (CR)
4. No driver installation needed

### Test Scanner
1. Open POS search box
2. Scan a barcode
3. If product adds to cart → working!

---

## 💾 Database Location

### Browser Version (Current)
- **Storage**: IndexedDB (browser storage)
- **Location**: Browser's internal database
- **Backup**: Export via God Mode

### Tauri Version (Future)
- **Storage**: SQLCipher encrypted database
- **Location**: `C:\ProgramData\AshPoint\pos.db` (Windows)
- **Backup**: Auto-export to `C:\Dropbox\AshPoint_Backups\`

---

## 🔧 Troubleshooting

### Issue: "Product not found" when scanning
**Fix:** SKU in database must exactly match barcode

### Issue: Can't access God Mode
**Fix:** Must be on **login screen**, not POS screen

### Issue: Theme doesn't persist
**Fix:** Browser may be blocking localStorage. Check privacy settings.

### Issue: Scan input goes to wrong place
**Fix:** Search box must have `barcode-input` class (auto-handled)

---

## 📚 Learn More

- **Full Manual**: See `USAGE.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Sales Demo**: See `DEMO_GUIDE.md`
- **Main Docs**: See `README.md`

---

## 🎯 4-Hour Cashier Training Path

### Hour 1: Basics
- [ ] Login/logout
- [ ] Scan products
- [ ] Process cash payment (F9)
- [ ] Void items (F4)

### Hour 2: Intermediate
- [ ] Manual product search (F1)
- [ ] Split payments (F12)
- [ ] Theme toggle (F11)

### Hour 3: Advanced
- [ ] Refund mode (F10)
- [ ] Park bills (F5)
- [ ] Customer credit (F8)

### Hour 4: Certification
- [ ] 10 transactions in 5 minutes
- [ ] 1 refund
- [ ] 1 split payment
- [ ] 2 error recoveries

**Target: 30-second average transaction time**

---

## 💡 Pro Tips

1. **Keep fingers on F-keys**: F1, F4, F9, F10, F11, F12
2. **Never touch the mouse**: Keyboard-only workflow is 3x faster
3. **Use refund mode for returns**: Don't create new orders
4. **Backup weekly**: God Mode → Create Backup
5. **Master F9**: Exact cash is 90% of transactions

---

## 🚀 Ready to Go Pro?

### For Retailers
- **License**: Hardware-locked, one-time fee
- **AMC**: Annual support + updates
- **Training**: 4-hour on-site certification
- **Support**: Phone + remote desktop

### For Service Providers
- **White Label**: Rebrand as your own
- **Territory Rights**: Exclusive geographic licensing
- **Source Access**: Full codebase + Tauri migration guide
- **Commission**: 30% revenue share on your sales

---

## 📞 Support

### Quick Questions
- Check `USAGE.md` first
- 90% of questions answered there

### Technical Support
- Email: support@ashpoint.systems (example)
- Response time: <4 hours

### Emergency Support
- Phone: (555) 123-4567 (example)
- Available: 9 AM - 9 PM local time

---

**🎉 You're ready! Press `F9` and start selling.**

**Remember:** Speed is revenue. Keyboard is king. God Mode is power.

**Welcome to Ash Point.**
