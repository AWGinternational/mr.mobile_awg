# 🧪 My Requests - Quick Test Guide

## 🎯 Quick Test (5 Minutes)

### Test Credentials
```
Worker Account:
Email: worker@shop.com
Password: password123

Owner Account:
Email: owner@shop.com
Password: password123
```

---

## ✅ Test Steps

### 1. Submit Approval Request (as Worker)

```bash
1. Login as worker (worker@shop.com / password123)
2. Start your shift
3. Go to Products page
4. Click "Categories" tab
5. Click Edit (pencil icon) on any category
6. Change the name slightly
7. Click "Request Approval" button
8. Enter reason: "Testing approval notification system"
9. Submit
```

**Expected:**
- ✅ Success message appears
- ✅ Modal closes
- ✅ Request sent to owner

---

### 2. Check My Requests Page (as Worker)

```bash
1. Click "My Requests" in sidebar (2nd item)
```

**Expected:**
- ✅ Page loads with header "📝 My Approval Requests"
- ✅ Stats show: Pending: 1
- ✅ See your request with yellow "Pending Review" badge
- ✅ See status message: "⏰ Awaiting Review"
- ✅ See your reason: "Testing approval notification system"
- ✅ Auto-refresh starts (check console for interval)

---

### 3. Approve Request (as Owner)

```bash
1. Logout worker
2. Login as owner (owner@shop.com / password123)
3. Go to Dashboard
4. See "Pending Approvals: 1" card
5. Click the approval card
6. See your worker's request
7. Click "Approve" button
8. Confirm approval
```

**Expected:**
- ✅ Success message appears
- ✅ Request disappears from pending list
- ✅ Approval recorded in database

---

### 4. Verify Notification (as Worker)

```bash
1. Logout owner
2. Login as worker again
3. Go to "My Requests" page
4. Wait up to 30 seconds (or manually refresh)
```

**Expected:**
- ✅ Status badge changes from yellow to green ✅
- ✅ Status changes from "Pending Review" to "Approved"
- ✅ Green success box appears with:
   - "✅ Request Approved!"
   - "Approved by [Owner Name]"
   - Approval timestamp
- ✅ Stats update: Pending: 0, Approved: 1

---

### 5. Test Rejection (as Worker + Owner)

```bash
Worker:
1. Submit another approval request
2. Reason: "Testing rejection flow"

Owner:
3. Go to Approvals page
4. Click "Reject" on the new request
5. Enter reason: "This is a test rejection"
6. Confirm

Worker:
7. Go to My Requests page
8. Wait 30 seconds or refresh
```

**Expected:**
- ✅ Status badge is red ❌
- ✅ Red rejection box appears with:
   - "❌ Request Rejected"
   - "Rejected by [Owner Name]"
   - Rejection reason: "This is a test rejection"
- ✅ Stats update: Pending: 0, Approved: 1, Rejected: 1

---

### 6. Test Filters

```bash
1. Click "PENDING" filter button
```
**Expected:** Only pending requests shown (should be 0)

```bash
2. Click "APPROVED" filter button
```
**Expected:** Only approved requests shown (should be 1)

```bash
3. Click "REJECTED" filter button
```
**Expected:** Only rejected requests shown (should be 1)

```bash
4. Click "ALL" filter button
```
**Expected:** All requests shown (should be 2 total)

---

### 7. Test Sidebar (Both Roles)

```bash
As Worker:
```
**Expected:**
- ✅ "My Requests" menu item is visible
- ✅ Icon is ClipboardCheck (clipboard with checkmark)
- ✅ Color is blue
- ✅ It's the 2nd menu item (after Dashboard)

```bash
As Owner:
```
**Expected:**
- ✅ "My Requests" menu item is NOT visible
- ✅ "Team" menu is visible instead
- ✅ "Team > Approvals" submenu exists

---

## 🎨 Visual Checks

### Status Message Colors

**Pending (Yellow):**
```
✅ Background: yellow-50
✅ Border: yellow-200
✅ Text: yellow-900
✅ Icon: Clock (yellow-600)
```

**Approved (Green):**
```
✅ Background: green-50
✅ Border: green-200
✅ Text: green-900
✅ Icon: CheckCircle (green-600)
```

**Rejected (Red):**
```
✅ Background: red-50
✅ Border: red-200
✅ Text: red-900
✅ Icon: XCircle (red-600)
```

---

## 📱 Mobile Test

```bash
1. Resize browser to mobile width (375px)
```

**Expected:**
- ✅ Stats cards stack vertically
- ✅ Sidebar hidden (hamburger menu)
- ✅ Cards are full width
- ✅ Text is readable
- ✅ Buttons are tap-friendly (min 44px)
- ✅ No horizontal scroll

---

## 🔄 Auto-Refresh Test

```bash
1. Open My Requests page (with 1 pending request)
2. Keep page open
3. In another tab/window, login as owner
4. Approve the pending request
5. Switch back to worker's My Requests page
6. Wait 30 seconds (don't refresh manually)
```

**Expected:**
- ✅ Page automatically updates after 30 seconds
- ✅ Status changes from Pending to Approved
- ✅ No page reload (smooth update)
- ✅ Stats update automatically
- ✅ Console shows auto-refresh log

---

## 🚨 Error Cases

### Test 1: Unauthorized Access
```bash
1. Logout completely
2. Go to /my-requests directly
```
**Expected:** Redirected to login page

### Test 2: Owner Access
```bash
1. Login as owner
2. Try to access /my-requests directly
```
**Expected:** Should show access denied or redirect (owner doesn't need this page)

### Test 3: Network Error
```bash
1. Open Network tab in DevTools
2. Set throttling to "Offline"
3. Try to load My Requests
```
**Expected:** Error message displayed gracefully

---

## ✅ Checklist

After testing, verify:

- [ ] Worker can see "My Requests" in sidebar
- [ ] Owner does NOT see "My Requests" in sidebar
- [ ] Pending requests show yellow badge
- [ ] Approved requests show green badge and approval message
- [ ] Rejected requests show red badge and rejection reason
- [ ] Stats cards show correct counts
- [ ] Filters work correctly (All, Pending, Approved, Rejected)
- [ ] Auto-refresh updates status after 30 seconds
- [ ] Manual refresh button works
- [ ] Mobile responsive layout works
- [ ] Dark mode works (if enabled)
- [ ] No console errors
- [ ] Page loads quickly
- [ ] Request details are displayed correctly
- [ ] Reviewer information shows correctly
- [ ] Timestamps are formatted correctly

---

## 🎯 Performance Check

```bash
1. Open DevTools Performance tab
2. Record page load
3. Check metrics
```

**Expected:**
- ✅ Page load < 2 seconds
- ✅ Auto-refresh fetch < 500ms
- ✅ No memory leaks
- ✅ Smooth animations
- ✅ No layout shifts

---

## 🐛 Common Issues & Fixes

### Issue: "My Requests" not showing in sidebar
**Fix:** Check if logged in as worker (not owner)

### Issue: Status not updating after 30 seconds
**Fix:** Check console for errors, verify auto-refresh is running

### Issue: Can't see rejection reason
**Fix:** Ensure owner entered a rejection reason when rejecting

### Issue: Wrong status showing
**Fix:** Clear cache and refresh, or check database directly

### Issue: Stats counts wrong
**Fix:** Refresh page, verify database query is correct

---

## 🎉 Success Criteria

All tests pass if:
1. ✅ Workers see all their requests
2. ✅ Approval notifications appear correctly
3. ✅ Rejection reasons are displayed
4. ✅ Auto-refresh works without manual intervention
5. ✅ Filters show correct requests
6. ✅ Mobile layout is usable
7. ✅ No errors in console
8. ✅ Page is fast and responsive

---

## 📞 Quick Troubleshooting

**Problem:** Page shows "No requests found" but I just submitted one  
**Solution:** Check if you're logged in as the same worker who submitted

**Problem:** Auto-refresh not working  
**Solution:** Check browser console for errors, verify interval is set

**Problem:** Can't see approval message  
**Solution:** Wait 30 seconds or manually refresh with the refresh button

**Problem:** Sidebar doesn't show "My Requests"  
**Solution:** Ensure you're logged in as SHOP_WORKER, not SHOP_OWNER

**Problem:** Stats showing wrong numbers  
**Solution:** Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

---

## 🚀 Ready to Test!

1. Follow steps 1-7 above
2. Check all visual elements
3. Verify auto-refresh works
4. Test on mobile
5. Mark checklist items

**Estimated Time:** 5-10 minutes

**Result:** Complete confidence in approval notification system! 🎉
