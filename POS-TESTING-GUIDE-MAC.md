# POS Keyboard Shortcuts - Testing Guide for Mac 🍎

**Quick Test Checklist** - Test these on your Mac in the POS system!

---

## ✅ Basic Navigation (Test First)

1. **Open POS page** → Click search box (should auto-focus)
2. **Press ↓ arrow** → Should highlight first product with blue ring
3. **Press ↓ again** → Should move to second product
4. **Press ↑ arrow** → Should go back to first product
5. **Press Enter** → Should add selected product to cart
6. **Check cart** → Product should appear in cart sidebar ✅

---

## ✅ Quick Quantity (1-9 Keys)

1. **Press number 3** → Green indicator should appear in top-right saying "× 3"
2. **Press ↓ then Enter** → Should add 3 units of product to cart
3. **Check cart** → Should show quantity 3 ✅
4. **Wait 2 seconds** → Green indicator should auto-hide

---

## ✅ Mac Shortcuts (⌘ Key)

### Complete Sale (⌘+Enter)
1. **Add products to cart** 
2. **Press ⌘+Enter anywhere** → Should open checkout/complete sale
3. **Check if checkout processed** ✅

### Print Receipt (⌘+P)
1. **Complete a sale first**
2. **Press ⌘+P** → Should generate and print receipt
3. **Check if receipt appears** ✅
4. **Important:** Should NOT open browser print dialog (we prevent that!)

---

## ✅ Calculator Mode (= Key)

1. **Press = key** → Calculator modal should appear
2. **Click: 1, 0, 0, +, 5, 0** → Should show "100+50" in display
3. **Click = button** → Should show "150"
4. **Click "USE as Discount"** → Should apply to discount field
5. **Press Escape** → Calculator should close ✅

---

## ✅ Recent Products Section

1. **Complete a few sales** (add different products)
2. **Go back to POS page** → Should see "Recently Sold Products" section at top
3. **Should show last 5 unique products** with quick add buttons
4. **Click any quick add button** → Should add to cart instantly ✅

---

## ✅ Customer Field Jump (F2)

1. **Press F2 key** → Should jump focus to "Phone number" input field
2. **Start typing** → Should search customers (if any exist)
3. **Type and test** ✅

---

## ✅ Visual Indicators

1. **Selected product** → Should have:
   - ✅ Blue ring around card
   - ✅ Slight scale effect (bigger)
   - ✅ "Selected" badge in top-right
   - ✅ Counter showing "1 / X" where X is total products

2. **Keyboard shortcuts panel** → Should show in cart sidebar:
   - ✅ All shortcuts listed
   - ✅ Mac symbols (⌘ not Ctrl)
   - ✅ White rounded key badges

---

## 🐛 Troubleshooting

### If ⌘+P opens browser print dialog:
- This is expected! We prevent default, but sometimes browser catches it first
- Receipt should still generate before the dialog
- Just close the dialog

### If number keys don't work:
- Make sure search box is NOT focused (click somewhere else first)
- Try clicking on the product grid area, then press number

### If arrow keys don't work:
- Click in the search box first to focus it
- Make sure you have products loaded

### If recent products don't show:
- Complete at least one sale first
- Refresh the page
- Check if you have products in your shop

---

## 📊 Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Arrow navigation | Products highlight with blue ring | ⬜ |
| Enter key | Adds product to cart | ⬜ |
| Number keys 1-9 | Green quantity indicator appears | ⬜ |
| ⌘+Enter | Completes sale/checkout | ⬜ |
| ⌘+P | Prints last receipt | ⬜ |
| = key | Opens calculator | ⬜ |
| F2 key | Jumps to customer field | ⬜ |
| Recent products | Shows last 5 products | ⬜ |
| Calculator USE | Applies to discount | ⬜ |
| Escape | Closes calculator | ⬜ |

---

## 🎯 Performance Expectations

- **Keyboard response:** Instant (< 100ms)
- **Product selection:** Smooth animation
- **Cart updates:** Near-instant
- **Recent products load:** < 500ms
- **Calculator operations:** Instant

---

## ✅ All Tests Passed?

If all tests work correctly, you have a fully functional keyboard-driven POS system! 🎉

**Speed improvement:** Should be able to complete a sale in ~10-15 seconds with keyboard vs ~30 seconds with mouse only.

---

**Happy Testing! 🚀**
