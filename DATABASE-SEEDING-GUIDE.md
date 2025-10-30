# 🌱 Database Seeding Guide
**Complete Demo Environment Setup**

---

## 📋 Overview

This guide explains how to seed your database with comprehensive demo data including:
- **1 Super Admin** (full system access)
- **2 Complete Shops** with owners, workers, products, inventory, sales, and more
- **Full multitenancy** demonstration with isolated shop data

---

## 🚀 Quick Start

### **Option 1: Complete Reset & Seed (Recommended)**

This will reset your database, apply all migrations, and seed with demo data:

```bash
npm run db:setup:complete
```

### **Option 2: Manual Steps**

If you prefer to run steps individually:

```bash
# Step 1: Reset database and apply migrations
npm run db:migrate:reset

# Step 2: Run the complete seeding script
npm run db:seed:complete
```

---

## 👤 Demo User Credentials

After seeding, you can log in with these accounts:

### **🔑 Super Admin** (Full System Access)
```
Email: admin@mrmobile.com
Password: password123
Role: SUPER_ADMIN
Access: All shops and system settings
```

---

### **🏪 Shop 1: Ali Mobile Center (Lahore)**

#### **👔 Shop Owner**
```
Email: ali@mrmobile.com
Password: password123
Role: SHOP_OWNER
Access: Full access to Ali Mobile Center
```

#### **👷 Worker 1**
```
Email: ahmed@mrmobile.com
Password: password123
Role: SHOP_WORKER
Access: Can create sales, view reports
Shop: Ali Mobile Center
```

#### **👷 Worker 2**
```
Email: fatima@mrmobile.com
Password: password123
Role: SHOP_WORKER
Access: Can create sales, manage inventory
Shop: Ali Mobile Center
```

---

### **🏪 Shop 2: Hassan Electronics (Karachi)**

#### **👔 Shop Owner**
```
Email: hassan@mrmobile.com
Password: password123
Role: SHOP_OWNER
Access: Full access to Hassan Electronics
```

#### **👷 Worker**
```
Email: zain@mrmobile.com
Password: password123
Role: SHOP_WORKER
Access: Can create sales, view reports, manage inventory
Shop: Hassan Electronics
```

---

## 📊 Seeded Data Summary

### **Shop 1: Ali Mobile Center**
- **Location:** Lahore, Punjab
- **Products:** 3 (Samsung S24, iPhone 15 Pro, Xiaomi 14 Pro)
- **Inventory Items:** 16 units
- **Suppliers:** 2 (Mobile World Distributors, Tech Hub Supplies)
- **Customers:** 2
- **Purchases:** 1 (Samsung S24 batch)
- **Sales:** 1 (Samsung S24 sold)
- **Daily Closing:** 1 entry
- **Categories:** Smartphones, Accessories, Smart Watches
- **Brands:** Samsung, Apple, Xiaomi, Oppo

### **Shop 2: Hassan Electronics**
- **Location:** Karachi, Sindh
- **Products:** 2 (Samsung A54, Xiaomi Redmi Note 13)
- **Inventory Items:** 22 units
- **Suppliers:** 1 (Karachi Mobile Traders)
- **Customers:** 1
- **Purchases:** 1 (Samsung A54 batch)
- **Sales:** 1 (Samsung A54 sold)
- **Daily Closing:** 1 entry
- **Categories:** Smartphones, Accessories
- **Brands:** Samsung, Xiaomi, Vivo

---

## 🧪 Testing Multitenancy

### **Test 1: Same Shop Users See Same Data**

1. Log in as `ali@mrmobile.com`
2. View products, inventory, sales
3. Log out and log in as `ahmed@mrmobile.com` (worker in same shop)
4. **Expected:** Should see identical products, inventory, and sales data

### **Test 2: Different Shop Users Cannot See Each Other's Data**

1. Log in as `ali@mrmobile.com` (Shop 1 - Lahore)
2. Note the products and inventory (Samsung S24, iPhone 15 Pro, Xiaomi 14 Pro)
3. Log out and log in as `hassan@mrmobile.com` (Shop 2 - Karachi)
4. **Expected:** Should see completely different products (Samsung A54, Xiaomi Redmi Note 13)

### **Test 3: Super Admin Access**

1. Log in as `admin@mrmobile.com`
2. **Expected:** Should be able to access all shops and system settings

### **Test 4: Worker Permissions**

1. Log in as `ahmed@mrmobile.com` (Worker)
2. Try to create a sale (should work)
3. Try to access sensitive settings (should be restricted)

---

## 📝 NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run db:setup:complete` | **Recommended:** Reset DB, apply migrations, and seed |
| `npm run db:migrate:reset` | Reset database and apply all migrations |
| `npm run db:seed:complete` | Run the complete seeding script |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

---

## 🔍 Verify Seeded Data

### **Option 1: Using Prisma Studio** (Recommended)

```bash
npm run db:studio
```

This opens a web interface where you can browse all tables and data.

### **Option 2: Using Database Queries**

```bash
npx tsx -e "
import { PrismaClient } from './src/generated/prisma'
const prisma = new PrismaClient()

async function check() {
  const users = await prisma.user.count()
  const shops = await prisma.shop.count()
  const products = await prisma.product.count()
  const inventory = await prisma.inventoryItem.count()
  
  console.log('Users:', users)
  console.log('Shops:', shops)
  console.log('Products:', products)
  console.log('Inventory:', inventory)
  
  await prisma.\$disconnect()
}

check()
"
```

---

## 🛠️ Troubleshooting

### **Problem: "Cannot find module" error**

**Solution:** Generate Prisma Client first:
```bash
npm run db:generate
```

### **Problem: Migration conflicts**

**Solution:** Reset migrations and start fresh:
```bash
npm run db:migrate:reset
npm run db:seed:complete
```

### **Problem: "Table does not exist" error**

**Solution:** Make sure migrations are applied:
```bash
npx prisma migrate dev
npm run db:seed:complete
```

### **Problem: Seeding fails mid-way**

**Solution:** The script cleans all data first, so you can safely re-run:
```bash
npm run db:seed:complete
```

---

## 📂 File Locations

- **Seed Script:** `/prisma/seed.ts`
- **Schema:** `/prisma/schema.prisma`
- **Migrations:** `/prisma/migrations/`

---

## 🎯 What Gets Created

### **Users (7 total)**
1. Super Admin
2. Shop 1 Owner
3. Shop 1 Worker 1
4. Shop 1 Worker 2
5. Shop 2 Owner
6. Shop 2 Worker 1

### **Shops (2 total)**
1. Ali Mobile Center (Lahore)
2. Hassan Electronics (Karachi)

### **Business Data**
- 6 Categories (3 per shop)
- 7 Brands (4 for Shop 1, 3 for Shop 2)
- 3 Suppliers (2 for Shop 1, 1 for Shop 2)
- 5 Products (3 for Shop 1, 2 for Shop 2)
- 38 Inventory Items (16 for Shop 1, 22 for Shop 2)
- 3 Customers (2 for Shop 1, 1 for Shop 2)
- 2 Purchases (1 per shop)
- 2 Sales (1 per shop)
- 2 Daily Closings (1 per shop)

---

## 🔐 Security Notes

- **Password:** All demo accounts use `password123`
- **Production:** Change all passwords before deploying to production
- **Email Verification:** All demo accounts are pre-verified
- **Super Admin:** Protect this account with strong authentication in production

---

## 🚀 Next Steps After Seeding

1. **Login:** Use any of the demo credentials above
2. **Test Features:** 
   - Create new products
   - Make sales transactions
   - Generate reports
   - Add inventory
   - Manage customers
3. **Verify Multitenancy:**
   - Switch between shop accounts
   - Confirm data isolation
4. **Explore:** 
   - Open Prisma Studio to see all data
   - Test different user roles and permissions

---

## 📞 Need Help?

If seeding fails or you encounter issues:

1. Check the console output for error messages
2. Verify your database connection in `.env`
3. Make sure PostgreSQL is running
4. Try resetting the database: `npm run db:migrate:reset`
5. Re-run the seed: `npm run db:seed:complete`

---

## 🎉 Success Output

When seeding completes successfully, you'll see:

```
═══════════════════════════════════════════════
✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨
═══════════════════════════════════════════════

👤 USERS CREATED:
  🔑 Super Admin: admin@mrmobile.com
  🏪 Shop 1 - Ali Mobile Center (Lahore)
     👔 Owner: ali@mrmobile.com
     👷 Worker 1: ahmed@mrmobile.com
     👷 Worker 2: fatima@mrmobile.com
  🏪 Shop 2 - Hassan Electronics (Karachi)
     👔 Owner: hassan@mrmobile.com
     👷 Worker 1: zain@mrmobile.com

📊 DATA CREATED:
  🏪 Shops: 2
  📂 Categories: 6
  🏷️  Brands: 7
  🚚 Suppliers: 3
  📱 Products: 5
  📦 Inventory Items: 38
  👥 Customers: 3
  🛒 Purchases: 2
  💰 Sales: 2
  📊 Daily Closings: 2

🔐 MULTITENANCY VERIFICATION:
  ✅ All data is shop-isolated
  ✅ Shop 1 users can only access Shop 1 data
  ✅ Shop 2 users can only access Shop 2 data
  ✅ Super Admin can access all shops

🚀 READY TO TEST!
```

---

**Happy Testing! 🎊**
