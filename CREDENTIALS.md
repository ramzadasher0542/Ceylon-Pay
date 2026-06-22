# 🔐 Ash Point POS — Access Credentials

## 🎯 Default Login Credentials

### Cashier Access
```
PIN: 1111
Role: CASHIER
Access: POS interface only (no reports, no back office)
```

**Login Flow:**
1. Open application
2. Enter `1111` in PIN field
3. Press `Enter` or click **Unlock**
4. Access granted to POS interface
5. No "Back Office" button visible

---

### Manager Access
```
PIN: 2026
Role: MANAGER
Access: POS + Back Office Dashboard (no Settings)
```

**Login Flow:**
1. Open application
2. Enter `2026` in PIN field
3. Press `Enter` or click **Unlock**
4. Redirected to Back Office Dashboard
5. Can view: Dashboard, Inventory, Sales, Debt, Audit
6. Cannot access: Settings tab (Admin only)

---

### Admin Access
```
PIN: 5692
Role: ADMIN
Access: Full System Control (POS + Back Office + Settings)
```

**Login Flow:**
1. Open application
2. Enter `5692` in PIN field
3. Press `Enter` or click **Unlock**
4. Redirected to Back Office Dashboard
5. Full access to all modules INCLUDING Settings tab
6. Can configure: Modules, Business, Hardware, Email, Tax, RBAC

---

### Provider God Mode
```
Shortcut:  Ctrl + Shift + F12  (on login screen only)
Password:  ASH2026GOD
```

**Access Flow:**
1. On login screen, press `Ctrl+Shift+F12`
2. God Mode screen appears
3. Enter password: `ASH2026GOD`
4. Full system access granted

---

## 🔑 Credential Security

### Cashier PIN (5692)
- **Purpose**: Daily POS operations
- **Scope**: Sales, refunds, cart management
- **Limitations**: Cannot access God Mode, settings, or backups
- **Change Frequency**: Monthly recommended
- **Storage**: Hardcoded in `LoginScreen.tsx` (line 87)

### Master Password (ASH2026GOD)
- **Purpose**: Provider/admin access
- **Scope**: Database backup, data seeding, system statistics, license management
- **Limitations**: None (full unrestricted access)
- **Change Frequency**: Never share with clients
- **Storage**: Hardcoded in `GodModeScreen.tsx` (line 10)

---

## 🛡️ Security Best Practices

### For Production Deployment

#### 1. Change the Cashier PIN
```typescript
// src/components/LoginScreen.tsx (line 87)
const AUTHORIZED_PIN = '5692'; // ← Change this
```

**Recommended:**
- Use unique PIN per cashier
- Store in encrypted database (future: multi-user support)
- Never use sequential numbers (1234, 0000, etc.)

#### 2. Rotate Master Password
```typescript
// src/components/GodModeScreen.tsx (line 10)
const MASTER_PASSWORD = 'ASH2026GOD'; // ← Change this
```

**Recommended:**
- 12+ characters minimum
- Mix of uppercase, lowercase, numbers, symbols
- Store in password manager (1Password, Bitwarden)
- Never write down or email

#### 3. Hide God Mode Shortcut
```typescript
// Remove or obfuscate Ctrl+Shift+F12 in production
// Or require hardware token for access
```

---

## 🔐 Multi-User Setup (Future Enhancement)

### Database Schema Addition
```typescript
interface User {
  id: string;
  pin_hash: string;  // SHA-256 of PIN
  name: string;
  role: 'CASHIER' | 'MANAGER' | 'ADMIN';
  permissions: {
    can_void: boolean;
    can_refund: boolean;
    can_discount: boolean;
    can_view_reports: boolean;
  };
}
```

### Login Flow
1. Enter PIN
2. Hash PIN → lookup in `users` table
3. Load permissions for session
4. Restrict UI based on role

---

## 📊 Audit Trail (Planned)

### Track All Actions
```typescript
interface AuditLog {
  id: string;
  timestamp: number;
  user_pin: string;  // Who did it
  action: 'LOGIN' | 'SALE' | 'REFUND' | 'VOID' | 'BACKUP';
  details: string;   // JSON of action data
}
```

**Why?**
- Prevent internal theft
- Investigate discrepancies
- Compliance requirements (PCI-DSS, etc.)

---

## 🚨 Emergency Access

### Lost Master Password
**Solution:**
1. Inspect source code (`GodModeScreen.tsx`)
2. Read hardcoded password
3. OR: Edit source, rebuild, redeploy

**Prevention:**
- Store in password manager
- Document in secure wiki
- Share with 2+ trusted admins

### Forgotten Cashier PIN
**Solution:**
1. Access God Mode
2. Future: Reset PIN via user management
3. Current: Edit `LoginScreen.tsx`, rebuild

---

## 🔄 Credential Rotation Schedule

### Recommended Frequency

| Credential | Change Every | Priority |
|------------|--------------|----------|
| Cashier PIN | 30 days | Medium |
| Master Password | 90 days | High |
| Hardware Fingerprint | Never (device-locked) | N/A |
| License Key | Annual (AMC renewal) | Low |

---

## 🎓 User Training on Security

### Cashier Training (15 minutes)
- [ ] Never share your PIN
- [ ] Lock screen when leaving register (`Logout` button)
- [ ] Report suspicious login attempts
- [ ] Don't write PIN on paper/phone
- [ ] Change PIN if compromised

### Manager Training (30 minutes)
- [ ] Master Password is sacred (never share with cashiers)
- [ ] God Mode is for providers only
- [ ] Always backup before God Mode actions
- [ ] Monitor audit logs weekly (future)
- [ ] Report to provider if Master Password leaks

---

## 🛠️ Developer Notes

### Where Credentials Are Stored

```
src/components/LoginScreen.tsx
  Line 87: const AUTHORIZED_PIN = '5692';

src/components/GodModeScreen.tsx
  Line 10: const MASTER_PASSWORD = 'ASH2026GOD';

src/lib/db.ts
  Line 60-61: Encryption key derivation (simulated)

src/lib/hardware-fingerprint.ts
  Line 12-19: Fingerprint generation logic
```

### How to Change Credentials

1. **Edit source files** (see paths above)
2. **Rebuild application**: `npm run build`
3. **Test new credentials** before deployment
4. **Document changes** in internal wiki
5. **Notify all authorized users**

---

## 📞 Support Contacts

### Credential Issues
- **Locked Out**: Contact provider immediately
- **Suspected Breach**: Rotate all credentials within 1 hour
- **New User Setup**: God Mode → User Management (future)

### Emergency Override
- **Provider Hotline**: (555) 123-4567 (example)
- **Email**: security@ashpoint.systems (example)
- **Response Time**: <30 minutes for credential emergencies

---

## ⚠️ Security Warnings

### DO NOT
- ❌ Share Master Password with clients
- ❌ Write credentials on sticky notes
- ❌ Email/text credentials in plaintext
- ❌ Use same PIN across multiple stores
- ❌ Ignore failed login attempts

### ALWAYS
- ✅ Use unique credentials per deployment
- ✅ Store Master Password in encrypted vault
- ✅ Rotate credentials on schedule
- ✅ Enable 2FA when available (future)
- ✅ Monitor access logs (future)

---

## 🎯 Quick Reference Card

**Print and store in secure location:**

```
┌─────────────────────────────────────┐
│   ASH POINT POS ACCESS CARD         │
├─────────────────────────────────────┤
│  Cashier PIN:    5692               │
│  God Mode:       Ctrl+Shift+F12     │
│  Master Pass:    ASH2026GOD         │
├─────────────────────────────────────┤
│  Emergency:      (555) 123-4567     │
│  Last Updated:   [DATE]             │
└─────────────────────────────────────┘
```

---

## 🔒 Compliance Checklist

### PCI-DSS (If Processing Cards)
- [ ] Encrypt all credentials at rest
- [ ] Use TLS for all network transmission
- [ ] Implement 2FA for admin access
- [ ] Audit all access attempts
- [ ] Rotate credentials quarterly

### GDPR (If EU Customers)
- [ ] Hash all PINs before storage
- [ ] Allow users to request data deletion
- [ ] Log consent for data processing
- [ ] Encrypt personal data (customer names, phones)

---

**🔐 Security is not optional. It's survival.**

**Protect these credentials like nuclear launch codes.**

**Because in business, they are.**

---

*Last Updated: 2026 | Ash Point POS v2.0.0*  
*Credential Version: 1.0 (Initial Deployment)*
