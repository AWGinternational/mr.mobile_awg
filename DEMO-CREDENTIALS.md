# 🎯 Quick Reference: Demo Credentials

## 🚀 One-Command Setup
```bash
npm run db:setup:complete
```
This resets the database and seeds it with all demo data.

---

## 👤 Login Credentials

**All passwords:** `password123`  
**⚠️ IMPORTANT:** Use `.com` NOT `.pk` for all emails!

### 🔑 Super Admin
```
Email:    admin@mrmobile.com
Password: password123
```

### 🏪 Shop 1: Ali Mobile Center (Lahore)
```
Owner:    ali@mrmobile.com    (password: password123)
Worker 1: ahmed@mrmobile.com   (password: password123)
Worker 2: fatima@mrmobile.com  (password: password123)
```

### 🏪 Shop 2: Hassan Electronics (Karachi)
```
Owner:  hassan@mrmobile.com  (password: password123)
Worker: zain@mrmobile.com     (password: password123)
```

---

## 📊 What's Included

| Data Type | Shop 1 | Shop 2 | Total |
|-----------|--------|--------|-------|
| Products | 3 | 2 | 5 |
| Inventory | 16 units | 22 units | 38 units |
| Suppliers | 2 | 1 | 3 |
| Customers | 2 | 1 | 3 |
| Purchases | 1 | 1 | 2 |
| Sales | 1 | 1 | 2 |

---

## 🧪 Quick Tests

### Test Multitenancy
1. Login as **ali@mrmobile.com** → See Samsung S24, iPhone 15 Pro, Xiaomi 14 Pro
2. Logout and login as **hassan@mrmobile.com** → See Samsung A54, Xiaomi Redmi Note 13
3. ✅ **Different data = Multitenancy works!**

### Test Same Shop Access
1. Login as **ali@mrmobile.com** → Note the products
2. Logout and login as **ahmed@mrmobile.com** → See same products
3. ✅ **Same data = Shop isolation works!**

---

## 🛠️ Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run db:setup:complete` | Reset & seed everything |
| `npm run db:studio` | Open database GUI |
| `npm run db:migrate:reset` | Reset only (no seed) |
| `npm run db:seed:complete` | Seed only (no reset) |

---

## 📱 Demo Products

### Shop 1 (Lahore)
- **Samsung Galaxy S24** - PKR 205,000
- **iPhone 15 Pro** - PKR 430,000
- **Xiaomi 14 Pro** - PKR 165,000

### Shop 2 (Karachi)
- **Samsung Galaxy A54** - PKR 75,000
- **Xiaomi Redmi Note 13** - PKR 55,000

---

## 🎯 Testing Checklist

- [ ] Login as Super Admin
- [ ] Login as Shop 1 Owner
- [ ] Login as Shop 1 Worker
- [ ] Login as Shop 2 Owner
- [ ] Verify different shops show different data
- [ ] Verify same shop users see same data
- [ ] Create a new sale
- [ ] Add new inventory
- [ ] Generate a report

---

**All passwords: `password123`** 🔑
