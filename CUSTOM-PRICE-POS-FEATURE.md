# Custom Price Override Feature in POS

## ✅ Feature Complete

This feature allows shop workers and owners to sell products at prices different from the system's selling price during POS transactions.

## 📋 What Was Implemented

### 1. Database Changes
- **Added `customPrice` field** to CartItem model in Prisma schema
  - Type: `Decimal?` (optional, 10 digits, 2 decimal places)
  - Allows storing custom prices separate from product's sellingPrice
  - Falls back to product.sellingPrice if no custom price set

### 2. API Updates (`/api/pos/cart`)

#### GET Endpoint
- Returns cart items with:
  - `unitPrice`: Current effective price (custom or system)
  - `originalPrice`: Product's system selling price
  - `isCustomPrice`: Boolean flag indicating if price is customized

#### POST Endpoint (Add to Cart)
- Accepts optional `unitPrice` parameter
- Creates cart item with custom price if provided
- Defaults to product.sellingPrice if not provided

#### PUT Endpoint (Update Cart)
- Now accepts BOTH `quantity` and `unitPrice` parameters
- Can update quantity, price, or both in single request
- Validates: quantity > 0, unitPrice > 0

### 3. Frontend POS Interface (`/dashboard/pos`)

#### Visual Features
- **Click to Edit**: Price is clickable with hover effect
- **Inline Editing**: Input field appears when price is clicked
- **Keyboard Shortcuts**:
  - `Enter` to save new price
  - `Escape` to cancel editing
- **Visual Indicator**: "(Custom)" badge shown for modified prices
- **Tooltip**: Shows original price on hover of custom price badge

#### User Experience
1. User adds product to cart
2. Click on the green price in cart item
3. Input field appears with current price
4. Type new price and press Enter (or click ✓ button)
5. Price updates immediately
6. Orange "(Custom)" badge appears next to price
7. Hover over badge to see original system price

### 4. Price Flow Throughout System

```
Product Creation
    ↓
  costPrice: 3000  →  sellingPrice: 3800 (system price)
    ↓
  Add to POS Cart
    ↓
  Cart Item: unitPrice = 3800 (default)
    ↓
  User Edits Price  →  unitPrice = 4000 (custom)
    ↓
  customPrice stored in database = 4000
    ↓
  Checkout  →  Sale created with unitPrice = 4000
    ↓
  Receipt shows: PKR 4,000 (actual selling price)
```

## 🎯 Use Cases

1. **Negotiated Prices**: Customer negotiates lower/higher price
2. **Bulk Discounts**: Selling in quantity at reduced rate
3. **Special Offers**: Quick price adjustments for promotions
4. **Market Fluctuations**: Adjust for real-time market changes
5. **VIP Customers**: Special pricing for regular customers

## 💾 Database Schema

```prisma
model CartItem {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  shopId      String
  quantity    Int
  customPrice Decimal? @db.Decimal(10, 2) // 🆕 Custom price override
  addedAt     DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user      User     @relation(...)
  product   Product  @relation(...)
  shop      Shop     @relation(...)
}
```

## 🔒 Security & Validation

- ✅ User authentication required
- ✅ Shop isolation enforced
- ✅ Price must be > 0
- ✅ Only affects current cart session
- ✅ Audit trail maintained through sale records

## 📱 Mobile Responsive

- Touch-friendly click target
- Keyboard accessible
- Works on all screen sizes

## 🧪 Testing Steps

1. **Add Product to Cart**
   ```
   1. Go to POS page
   2. Search for a product (e.g., "Samsung Galaxy")
   3. Click "Add to Cart"
   4. Product appears in cart with system price
   ```

2. **Edit Price**
   ```
   1. Click on the green price (e.g., "PKR 3,800")
   2. Input field appears
   3. Type new price: 4500
   4. Press Enter or click ✓
   5. Price updates to "PKR 4,500 (Custom)"
   ```

3. **Complete Sale**
   ```
   1. Add customer details
   2. Select payment method
   3. Click "Complete Sale"
   4. Receipt shows custom price (PKR 4,500)
   ```

4. **Verify in Database**
   ```sql
   SELECT * FROM cart_items 
   WHERE customPrice IS NOT NULL;
   
   SELECT * FROM sales s
   JOIN sale_items si ON s.id = si.saleId
   WHERE si.unitPrice != si.product.sellingPrice;
   ```

## 🔄 API Examples

### Add Product with Custom Price
```javascript
POST /api/pos/cart
{
  "productId": "clxy123...",
  "quantity": 2,
  "unitPrice": 4500  // Optional custom price
}
```

### Update Only Price
```javascript
PUT /api/pos/cart
{
  "productId": "clxy123...",
  "unitPrice": 5000  // New custom price
}
```

### Update Quantity and Price
```javascript
PUT /api/pos/cart
{
  "productId": "clxy123...",
  "quantity": 3,
  "unitPrice": 4800
}
```

## 📊 Impact on Reports

- Sales reports show actual selling price (custom or system)
- Profit calculation uses: `unitPrice - costPrice`
- Original system price preserved in Product table
- Price history maintained through sale records

## ⚙️ Configuration

No configuration needed - feature is always available in POS.

## 🚀 Deployment Status

- ✅ Database migration applied
- ✅ Prisma client regenerated
- ✅ API endpoints updated
- ✅ Frontend UI implemented
- ✅ Build successful
- ⏳ Ready to test on localhost
- ⏳ Awaiting user commit approval

## 📝 Notes

- Custom price only affects current cart session
- Original product.sellingPrice remains unchanged
- Custom prices are NOT saved as permanent price changes
- Each sale can have different custom prices
- Workers have full access to price editing
- No approval workflow required for price changes
