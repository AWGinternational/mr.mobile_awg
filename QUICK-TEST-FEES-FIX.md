# 🧪 Quick Test: Mobile Services Fees Fix

## 🎯 Quick Test (2 Minutes)

### Test 1: Empty Default Fields ✅
1. Login: `ali@mrmobile.com` / `password123`
2. Go to: **Settings** → **Service Fees & Commission**
3. **Expected:** All fee inputs are **EMPTY** (no 1, 1.5, 2, etc.)
4. **Expected:** Placeholders show: "Enter percentage (e.g., 1.5)"

### Test 2: Correct Percentage Calculation ✅
1. In Service Fees page:
   - Find **EasyPaisa - Sending**
   - Click **Percentage (%)** button
   - Enter: `16` in fee field
   - Click **Save Fees Configuration**

2. Go to: **Mobile Services**
3. Click: **EasyPaisa Cash In** card
4. Enter amount: `40000`
5. **Expected Commission:** `Rs 6,400.00` ✅ (NOT 400 or 640)
6. **Expected Display:** "Commission (16%)"

### Test 3: Fixed Fee Calculation ✅
1. Go back to: **Settings** → **Service Fees**
2. Find: **Mobile Load**
3. Click: **Fixed (PKR)** button
4. Enter: `10`
5. Click: **Save**

6. Go to: **Mobile Services**
7. Click: **Mobile Load** card
8. Select any provider (Jazz, Telenor, etc.)
9. Enter amount: `500`
10. **Expected Commission:** `Rs 10.00` ✅ (fixed, not percentage)
11. **Expected Display:** "Commission (PKR 10)"

---

## 📊 Test Calculations

### Example 1: EasyPaisa 16% on 40,000
```
Amount: 40,000
Fee: 16%
Formula: (40,000 × 16) / 100 = 6,400
Expected: Rs 6,400.00 ✅
```

### Example 2: Mobile Load PKR 10 (Fixed)
```
Amount: 500
Fee: PKR 10 (fixed)
Formula: 10 (regardless of amount)
Expected: Rs 10.00 ✅
```

### Example 3: JazzCash 1.5% on 25,000
```
Amount: 25,000
Fee: 1.5%
Formula: (25,000 × 1.5) / 100 = 375
Expected: Rs 375.00 ✅
```

---

## ✅ Pass Criteria

- ✅ Fee inputs are empty (not showing 1, 1.5, 2, etc.)
- ✅ Placeholders guide users
- ✅ EasyPaisa 40,000 at 16% = **6,400 PKR** (not 400 or 640)
- ✅ Mobile Load shows fixed fee (not percentage of amount)
- ✅ Commission display shows fee type: "(16%)" or "(PKR 10)"
- ✅ Changes in settings reflect immediately in Mobile Services

---

## 🚨 Known Issues (FIXED)

| Issue | Status | Fix |
|-------|--------|-----|
| Hardcoded fees (10, 20, 26) | ✅ Fixed | Now fetches from shop settings |
| Wrong formula `(amount/1000)*rate` | ✅ Fixed | Now `(amount*rate)/100` for % |
| Default values showing (1.5, 2, etc.) | ✅ Fixed | All defaults = 0, inputs empty |
| Commission showing wrong on 40,000 | ✅ Fixed | Now shows 6,400 correctly |

---

## 🔄 Quick Commands

```bash
# Clear cache and restart (if needed)
rm -rf .next && npm run dev

# Test as Shop 1 Owner
Email: ali@mrmobile.com
Password: password123

# Test as Shop 2 Owner (different fees)
Email: hassan@mrmobile.com
Password: password123
```

---

**Status:** ✅ All issues fixed and ready to test!
