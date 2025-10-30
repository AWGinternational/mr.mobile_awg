# 📍 Add Worker Button - Exact Location Guide

## 🎯 Where is the Add Worker Button?

### Visual Location:
```
┌─────────────────────────────────────────────────────────────────┐
│  Settings → Worker Management Page                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [← Back]  👥 Worker Management                          │  │
│  │           Manage worker accounts (1/2 workers)            │  │
│  │                                                            │  │
│  │                           [+ Add Worker] 🛡️ Shield Icon   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Worker Card 1]  [Worker Card 2]                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Navigation:

1. **Login** as Shop Owner
   - Email: `ali@mrmobile.com`
   - Password: `password123`

2. **Click Sidebar** → Settings (gear icon)

3. **Click** "Shop Settings" card

4. **Click** "Worker Management" card (shows worker icon 👥)

5. **Look Top Right** of the blue header section
   - Next to the Shield (🛡️) icon
   - White button with blue text
   - Says "Add Worker" with plus icon

### Button Appearance:

**When Visible (< 2 workers):**
```tsx
┌─────────────────────┐
│  + Add Worker       │  ← White background
└─────────────────────┘     Blue text
```

**When Hidden (2 workers):**
- Button completely disappears
- See "(2/2 workers)" in description
- Must delete a worker to add new one

### Code Location:
File: `src/app/settings/workers/page.tsx`  
Lines: ~438-450

```tsx
<div className="flex items-center gap-4">
  {canAddMoreWorkers && (
    <Button
      onClick={() => setAddWorkerDialogOpen(true)}
      className="bg-white text-indigo-600 hover:bg-gray-100"
    >
      <UserPlus className="h-4 w-4 mr-2" />
      Add Worker
    </Button>
  )}
  <Shield className="h-16 w-16 text-white/20" />
</div>
```

### Screenshot Guide:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [←]  👥 Worker Management                    [+ Add Worker] 🛡️ ┃
┃      Manage accounts (1/2 workers)                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     ↑                                              ↑
  Back Button                              ADD WORKER BUTTON HERE!
```

## 🎨 Button States

### State 1: Visible (0 or 1 workers)
- **Color**: White background, indigo text
- **Icon**: Plus sign (UserPlus)
- **Text**: "Add Worker"
- **Hover**: Light gray background
- **Clickable**: ✅ Yes

### State 2: Hidden (2 workers)
- **Display**: None (button removed from DOM)
- **Reason**: Maximum limit reached
- **Counter shows**: "(2/2 workers)"

## 🔍 How to Find It

### If You Can't See the Button:

1. **Check Worker Count**
   - Look at header text
   - If it says "(2/2 workers)" → Button is hidden
   - Must deactivate or delete a worker first

2. **Check You're Shop Owner**
   - Workers cannot see this button
   - Only Shop Owners can add workers

3. **Check Navigation Path**
   ```
   Dashboard → Settings (sidebar) 
            → Shop Settings 
            → Worker Management 
            → [Add Worker button in header]
   ```

## 🧪 Quick Test

```bash
# Login as shop owner
Email: ali@mrmobile.com
Password: password123

# Navigate
Sidebar → Settings → Shop Settings → Worker Management

# Look for button
Top right corner of blue header
Next to shield icon
```

## 📱 Mobile View

On mobile/tablet:
```
┌─────────────────────────┐
│ [←] 👥 Worker Mgmt     │
│ (1/2 workers)           │
│                         │
│ [+ Add Worker]          │
│         🛡️              │
└─────────────────────────┘
```

Button moves below the title on smaller screens.
