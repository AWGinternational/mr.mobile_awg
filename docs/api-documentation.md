# Mobile Shop Management System - API Documentation

## 🚀 Complete API Endpoint Specifications

This document provides comprehensive API documentation for the mobile shop management system, including authentication, business logic, and AI-powered features.

---

## 🔐 Authentication & Authorization

### Base URL Structure
```
Master System: https://api.mobileshop.com/master
Shop Systems: https://api.mobileshop.com/shop/{shop_code}
AI Services: https://api.mobileshop.com/ai
```

### Authentication Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Shop-Code: SH001  // Required for shop-specific APIs
X-Request-ID: uuid  // For request tracing
```

---

## 👑 Super Admin APIs

### 1. Super Admin Authentication

#### POST /master/auth/login
```http
POST /master/auth/login
Content-Type: application/json

{
  "email": "admin@mobileshop.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@mobileshop.com",
      "name": "Super Admin",
      "role": "super_admin"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}
```

### 2. Shop Management

#### POST /master/shops
Create a new shop account
```http
POST /master/shops
Authorization: Bearer <SUPER_ADMIN_TOKEN>

{
  "shop_name": "Mobile Hub Karachi",
  "owner_name": "Ahmad Khan",
  "owner_email": "ahmad@mobilehub.com",
  "owner_phone": "+923001234567",
  "owner_cnic": "42101-1234567-1",
  "address": "Shop 123, Saddar Town, Karachi",
  "city": "Karachi"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shop": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "shop_code": "SH001",
      "shop_name": "Mobile Hub Karachi",
      "database_name": "shop_sh001_db",
      "owner_email": "ahmad@mobilehub.com",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "initial_credentials": {
      "email": "ahmad@mobilehub.com",
      "temporary_password": "TempPass123!",
      "change_password_required": true
    }
  }
}
```

#### GET /master/shops
List all shops with analytics
```http
GET /master/shops?page=1&limit=10&status=active&search=karachi

Authorization: Bearer <SUPER_ADMIN_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shops": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "shop_code": "SH001",
        "shop_name": "Mobile Hub Karachi",
        "owner_name": "Ahmad Khan",
        "city": "Karachi",
        "is_active": true,
        "subscription_expires_at": "2024-12-31T23:59:59Z",
        "analytics": {
          "total_sales_last_30_days": 2500000.00,
          "total_orders_last_30_days": 150,
          "active_users": 3,
          "total_products": 1250
        },
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10
    }
  }
}
```

#### DELETE /master/shops/{shop_id}
Delete shop (with double confirmation)
```http
DELETE /master/shops/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <SUPER_ADMIN_TOKEN>

{
  "confirmation": "DELETE_SHOP_PERMANENTLY",
  "reason": "Shop closure requested by owner"
}
```

---

## 🏪 Shop Authentication APIs

### 1. Shop User Authentication

#### POST /shop/{shop_code}/auth/login
```http
POST /shop/SH001/auth/login

{
  "email": "ahmad@mobilehub.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "456e7890-e12c-34d5-b678-789012345000",
      "email": "ahmad@mobilehub.com",
      "name": "Ahmad Khan",
      "role": "shop_owner",
      "permissions": {
        "products": ["create", "read", "update", "delete"],
        "sales": ["create", "read", "update", "delete"],
        "reports": ["read"],
        "users": ["create", "read", "update", "deactivate"]
      },
      "shop": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "code": "SH001",
        "name": "Mobile Hub Karachi"
      }
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}
```

### 2. User Management

#### POST /shop/{shop_code}/users
Create worker account
```http
POST /shop/SH001/users
Authorization: Bearer <SHOP_OWNER_TOKEN>

{
  "name": "Fatima Ali",
  "email": "fatima@mobilehub.com",
  "phone": "+923001234568",
  "role": "manager",
  "permissions": {
    "products": ["create", "read", "update"],
    "sales": ["create", "read", "update"],
    "inventory": ["create", "read", "update"],
    "customers": ["create", "read", "update"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "789e0123-e45f-67g8-h901-234567890000",
      "name": "Fatima Ali",
      "email": "fatima@mobilehub.com",
      "role": "manager",
      "is_active": true,
      "temporary_password": "TempWorker456!",
      "change_password_required": true,
      "created_at": "2024-01-15T14:30:00Z"
    }
  }
}
```

---

## 📱 Product Management APIs

### 1. Products

#### POST /shop/{shop_code}/products
Create new product
```http
POST /shop/SH001/products
Authorization: Bearer <SHOP_TOKEN>

{
  "sku": "IPH15-256-BLK", // Optional, auto-generated if not provided
  "name": "iPhone 15 256GB Black",
  "brand_id": "550e8400-e29b-41d4-a716-446655440001",
  "category_id": "550e8400-e29b-41d4-a716-446655440002",
  "product_type": "mobile",
  "specifications": {
    "model": "iPhone 15",
    "storage_capacity": "256GB",
    "ram": "6GB",
    "color": "Black",
    "network_type": "5G",
    "operating_system": "iOS 17",
    "display_size": "6.1 inch",
    "camera": "48MP Main + 12MP Ultra Wide",
    "battery": "3349 mAh"
  },
  "cost_price": 180000.00,
  "selling_price": 220000.00,
  "markup_percentage": 22.22,
  "min_selling_price": 200000.00,
  "track_imei": true,
  "low_stock_threshold": 3,
  "reorder_point": 5,
  "reorder_quantity": 10,
  "images": [
    "https://images.mobileshop.com/products/iphone15-black-1.jpg",
    "https://images.mobileshop.com/products/iphone15-black-2.jpg"
  ],
  "is_featured": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "321e6543-e87a-12b3-c456-567890123000",
      "sku": "IPH15-256-BLK",
      "name": "iPhone 15 256GB Black",
      "brand": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Apple"
      },
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Smartphones"
      },
      "cost_price": 180000.00,
      "selling_price": 220000.00,
      "markup_percentage": 22.22,
      "current_stock": 0,
      "created_at": "2024-01-15T15:30:00Z"
    }
  }
}
```

#### GET /shop/{shop_code}/products
List products with advanced filtering
```http
GET /shop/SH001/products?page=1&limit=20&brand=apple&category=smartphones&in_stock=true&sort=name&order=asc&search=iphone

Authorization: Bearer <SHOP_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "321e6543-e87a-12b3-c456-567890123000",
        "sku": "IPH15-256-BLK",
        "name": "iPhone 15 256GB Black",
        "brand": "Apple",
        "category": "Smartphones",
        "selling_price": 220000.00,
        "stock": {
          "available": 15,
          "total": 20,
          "sold": 5,
          "reserved": 0
        },
        "status": "in_stock",
        "is_featured": true,
        "ai_insights": {
          "predicted_sales_next_month": 8,
          "reorder_suggestion": "Order 5 more units",
          "trend": "increasing"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_items": 50
    },
    "filters": {
      "brands": ["Apple", "Samsung", "Xiaomi"],
      "categories": ["Smartphones", "Accessories"],
      "price_ranges": [
        {"min": 0, "max": 50000, "count": 120},
        {"min": 50000, "max": 150000, "count": 80},
        {"min": 150000, "max": 300000, "count": 45}
      ]
    }
  }
}
```

---

## 📦 Inventory Management APIs

### 1. Inventory Items

#### POST /shop/{shop_code}/inventory/items
Add inventory item with IMEI
```http
POST /shop/SH001/inventory/items
Authorization: Bearer <SHOP_TOKEN>

{
  "product_id": "321e6543-e87a-12b3-c456-567890123000",
  "imei_1": "123456789012345",
  "imei_2": "123456789012346", // For dual SIM
  "serial_number": "F2LX1234ABCD",
  "cost_price": 180000.00,
  "selling_price": 220000.00,
  "supplier_id": "789e0123-e45f-67g8-h901-234567890001",
  "received_date": "2024-01-15",
  "warranty_months": 12,
  "condition_status": "new",
  "location": "shelf_a1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inventory_item": {
      "id": "654e9876-e21d-43f5-g678-890123456000",
      "product": {
        "id": "321e6543-e87a-12b3-c456-567890123000",
        "name": "iPhone 15 256GB Black",
        "sku": "IPH15-256-BLK"
      },
      "imei_1": "123456789012345",
      "imei_2": "123456789012346",
      "serial_number": "F2LX1234ABCD",
      "cost_price": 180000.00,
      "selling_price": 220000.00,
      "status": "in_stock",
      "warranty_end_date": "2025-01-15",
      "location": "shelf_a1",
      "created_at": "2024-01-15T16:00:00Z"
    }
  }
}
```

#### GET /shop/{shop_code}/inventory/stock-summary
Get stock summary with AI insights
```http
GET /shop/SH001/inventory/stock-summary?low_stock=true&ai_insights=true

Authorization: Bearer <SHOP_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_products": 125,
      "total_stock_value": 15750000.00,
      "low_stock_products": 8,
      "out_of_stock_products": 3,
      "damaged_items": 2
    },
    "products": [
      {
        "product_id": "321e6543-e87a-12b3-c456-567890123000",
        "name": "iPhone 15 256GB Black",
        "sku": "IPH15-256-BLK",
        "stock": {
          "total": 20,
          "available": 15,
          "sold": 5,
          "damaged": 0,
          "reserved": 0
        },
        "value": {
          "cost_value": 2700000.00,
          "selling_value": 3300000.00,
          "potential_profit": 600000.00
        },
        "ai_insights": {
          "predicted_sales_next_30_days": 12,
          "stockout_risk": 0.15,
          "reorder_suggestion": {
            "should_reorder": true,
            "suggested_quantity": 8,
            "optimal_reorder_date": "2024-01-25",
            "reasoning": "High demand expected due to seasonal trend"
          }
        },
        "alerts": [
          {
            "type": "low_stock",
            "message": "Stock below threshold (15 < 20)",
            "severity": "medium"
          }
        ]
      }
    ]
  }
}
```

---

## 💰 Sales & POS APIs

### 1. Sales Transaction

#### POST /shop/{shop_code}/sales
Create new sale
```http
POST /shop/SH001/sales
Authorization: Bearer <SHOP_TOKEN>

{
  "customer": {
    "name": "Hassan Ahmed",
    "phone": "+923001234569",
    "email": "hassan@example.com" // Optional
  },
  "items": [
    {
      "inventory_item_id": "654e9876-e21d-43f5-g678-890123456000",
      "quantity": 1,
      "unit_price": 220000.00,
      "discount_amount": 5000.00
    },
    {
      "product_id": "789e0123-e45f-67g8-h901-234567890002", // Accessory without IMEI
      "quantity": 2,
      "unit_price": 3500.00,
      "discount_amount": 0.00
    }
  ],
  "payments": [
    {
      "method": "cash",
      "amount": 150000.00
    },
    {
      "method": "jazzcash",
      "amount": 72000.00,
      "phone_number": "+923001234569",
      "transaction_id": "JC123456789"
    }
  ],
  "discount_amount": 5000.00,
  "notes": "Regular customer, provided additional warranty"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": "987e6543-e21a-45b6-c789-012345678000",
      "sale_number": "SAL-2024-001",
      "customer": {
        "id": "456e7890-e12c-34d5-b678-789012345001",
        "name": "Hassan Ahmed",
        "phone": "+923001234569"
      },
      "items": [
        {
          "product_name": "iPhone 15 256GB Black",
          "imei_1": "123456789012345",
          "quantity": 1,
          "unit_price": 220000.00,
          "discount_amount": 5000.00,
          "total_amount": 215000.00,
          "profit_amount": 35000.00
        },
        {
          "product_name": "iPhone Case Premium",
          "quantity": 2,
          "unit_price": 3500.00,
          "total_amount": 7000.00,
          "profit_amount": 2000.00
        }
      ],
      "totals": {
        "subtotal": 227000.00,
        "discount": 5000.00,
        "tax": 0.00,
        "total": 222000.00,
        "paid": 222000.00,
        "change": 0.00,
        "profit": 37000.00
      },
      "payments": [
        {
          "method": "cash",
          "amount": 150000.00,
          "status": "completed"
        },
        {
          "method": "jazzcash",
          "amount": 72000.00,
          "transaction_id": "JC123456789",
          "status": "completed"
        }
      ],
      "receipt_url": "https://receipts.mobileshop.com/SH001/SAL-2024-001.pdf",
      "sale_date": "2024-01-15",
      "created_at": "2024-01-15T17:30:00Z"
    },
    "ai_recommendations": {
      "cross_sell": [
        {
          "product_name": "AirPods Pro",
          "reason": "90% of iPhone customers buy wireless earphones",
          "confidence": 0.89
        }
      ],
      "customer_insights": {
        "likely_return_customer": true,
        "next_purchase_prediction": "2025-01-15",
        "recommended_follow_up": "Call for iPhone 16 pre-order"
      }
    }
  }
}
```

### 2. Returns & Exchanges

#### POST /shop/{shop_code}/sales/{sale_id}/return
Process return (requires approval for workers)
```http
POST /shop/SH001/sales/987e6543-e21a-45b6-c789-012345678000/return
Authorization: Bearer <WORKER_TOKEN>

{
  "items": [
    {
      "sale_item_id": "111e2222-e33a-44b5-c666-777888999000",
      "return_quantity": 1,
      "reason": "customer_change_mind",
      "condition": "like_new"
    }
  ],
  "refund_method": "cash",
  "notes": "Customer changed mind, phone in perfect condition"
}
```

**Response (Worker Request):**
```json
{
  "success": true,
  "data": {
    "approval_request": {
      "id": "333e4444-e55a-66b7-c888-999000111000",
      "type": "return_processing",
      "status": "pending",
      "requested_by": {
        "id": "789e0123-e45f-67g8-h901-234567890000",
        "name": "Fatima Ali",
        "role": "worker"
      },
      "return_details": {
        "total_refund_amount": 215000.00,
        "items_count": 1,
        "reason": "customer_change_mind"
      },
      "expires_at": "2024-01-16T17:30:00Z",
      "created_at": "2024-01-15T17:30:00Z"
    }
  }
}
```

---

## 📊 AI-Powered Analytics APIs

### 1. Sales Predictions

#### GET /shop/{shop_code}/ai/sales-forecast
Get AI sales predictions
```http
GET /shop/SH001/ai/sales-forecast?period=next_month&product_id=321e6543-e87a-12b3-c456-567890123000

Authorization: Bearer <SHOP_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast_period": "next_month",
    "forecast_date": "2024-02-01 to 2024-02-29",
    "overall_prediction": {
      "total_sales_amount": 3250000.00,
      "total_units": 42,
      "confidence_score": 0.87,
      "trend": "increasing",
      "percentage_change": "+15.2%"
    },
    "product_predictions": [
      {
        "product_id": "321e6543-e87a-12b3-c456-567890123000",
        "product_name": "iPhone 15 256GB Black",
        "predicted_units": 8,
        "predicted_revenue": 1760000.00,
        "confidence_score": 0.92,
        "factors": {
          "historical_trend": "strong",
          "seasonal_factor": 1.15,
          "market_demand": "high",
          "inventory_availability": "adequate"
        },
        "recommendations": [
          "Maintain current inventory level",
          "Consider promotional pricing for bulk sales"
        ]
      }
    ],
    "seasonal_insights": {
      "current_season": "winter_sales",
      "peak_demand_dates": ["2024-02-14", "2024-02-23"],
      "recommended_actions": [
        "Increase iPhone stock by 20%",
        "Prepare Valentine's Day bundles",
        "Schedule staff for high-traffic days"
      ]
    }
  }
}
```

### 2. Customer Behavior Analysis

#### GET /shop/{shop_code}/ai/customer-insights/{customer_id}
Get AI customer analysis
```http
GET /shop/SH001/ai/customer-insights/456e7890-e12c-34d5-b678-789012345001

Authorization: Bearer <SHOP_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "456e7890-e12c-34d5-b678-789012345001",
      "name": "Hassan Ahmed",
      "phone": "+923001234569"
    },
    "behavior_analysis": {
      "customer_segment": "high_value",
      "loyalty_score": 8.5,
      "purchase_frequency": "every_18_months",
      "average_order_value": 225000.00,
      "preferred_brands": ["Apple", "Samsung"],
      "preferred_price_range": {
        "min": 150000.00,
        "max": 300000.00
      }
    },
    "predictions": {
      "next_purchase_date": "2025-07-15",
      "next_purchase_likelihood": 0.78,
      "churn_risk": 0.12,
      "lifetime_value": 850000.00,
      "upsell_opportunities": [
        {
          "product": "iPhone 16 Pro",
          "probability": 0.85,
          "expected_date": "2024-09-20",
          "reasoning": "Customer upgrades to latest iPhone annually"
        }
      ]
    },
    "recommendations": {
      "engagement_strategy": "premium_customer",
      "suggested_actions": [
        "Send iPhone 16 pre-order notification",
        "Offer trade-in program",
        "Invite to VIP customer events"
      ],
      "optimal_contact_time": "evening_weekdays",
      "preferred_communication": "whatsapp"
    }
  }
}
```

### 3. Smart Inventory Suggestions

#### GET /shop/{shop_code}/ai/reorder-suggestions
Get AI-powered reorder suggestions
```http
GET /shop/SH001/ai/reorder-suggestions?priority=high&category=smartphones

Authorization: Bearer <SHOP_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "product_id": "321e6543-e87a-12b3-c456-567890123000",
        "product_name": "iPhone 15 256GB Black",
        "current_stock": 15,
        "suggested_order_quantity": 10,
        "priority": "high",
        "reasoning": {
          "demand_forecast": 25,
          "current_velocity": 2.1,
          "lead_time_days": 7,
          "safety_stock_needed": 6,
          "seasonal_adjustment": 1.2
        },
        "financial_impact": {
          "investment_required": 1800000.00,
          "expected_revenue": 2200000.00,
          "expected_profit": 400000.00,
          "roi_percentage": 22.22,
          "payback_period_days": 45
        },
        "risk_analysis": {
          "stockout_probability": 0.78,
          "overstock_risk": 0.15,
          "market_volatility": "low",
          "competitor_activity": "normal"
        },
        "optimal_order_date": "2024-01-20",
        "confidence_score": 0.91
      }
    ],
    "summary": {
      "total_investment": 5400000.00,
      "expected_profit": 1200000.00,
      "high_priority_items": 3,
      "medium_priority_items": 5,
      "low_priority_items": 2
    }
  }
}
```

---

## 📈 Financial & Reporting APIs

### 1. Daily Closing

#### POST /shop/{shop_code}/daily-closing
Initiate daily closing
```http
POST /shop/SH001/daily-closing
Authorization: Bearer <SHOP_OWNER_TOKEN>

{
  "closing_date": "2024-01-15",
  "actual_cash": 245000.00,
  "expenses": [
    {
      "category": "utilities",
      "description": "Electricity bill",
      "amount": 5000.00,
      "payment_method": "cash"
    }
  ],
  "notes": "Normal trading day, slight cash overage"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "daily_closing": {
      "id": "777e8888-e99a-00b1-c222-333444555000",
      "closing_date": "2024-01-15",
      "sales_summary": {
        "total_sales_amount": 1250000.00,
        "total_sales_count": 15,
        "total_discount": 25000.00
      },
      "payment_breakdown": {
        "cash_sales": 750000.00,
        "jazzcash_sales": 300000.00,
        "easypaisa_sales": 125000.00,
        "credit_sales": 75000.00
      },
      "load_breakdown": {
        "jazz_load": 15000.00,
        "zong_load": 12000.00,
        "telenor_load": 8000.00,
        "uload": 5000.00
      },
      "cash_reconciliation": {
        "opening_cash": 50000.00,
        "cash_received": 750000.00,
        "cash_paid_out": 5000.00,
        "expected_cash": 795000.00,
        "actual_cash": 245000.00,
        "variance": 550000.00,
        "variance_status": "overage"
      },
      "profit_analysis": {
        "total_cost": 875000.00,
        "gross_profit": 375000.00,
        "total_expenses": 5000.00,
        "net_profit": 370000.00,
        "profit_margin": 29.6
      },
      "status": "pending_approval",
      "requires_variance_approval": true
    },
    "ai_insights": {
      "performance_vs_prediction": "+12% above forecast",
      "profit_trend": "improving",
      "recommendations": [
        "Investigate cash variance - possible bank deposit not recorded",
        "iPhone sales performing well - consider increasing stock"
      ]
    }
  }
}
```

### 2. Advanced Reports

#### GET /shop/{shop_code}/reports/sales-analytics
Get comprehensive sales analytics
```http
GET /shop/SH001/reports/sales-analytics?period=last_30_days&group_by=product&include_ai=true

Authorization: Bearer <SHOP_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2023-12-16",
      "end_date": "2024-01-15",
      "days": 30
    },
    "summary": {
      "total_revenue": 12750000.00,
      "total_profit": 2550000.00,
      "total_orders": 180,
      "average_order_value": 70833.33,
      "profit_margin": 20.0,
      "growth_vs_previous_period": 15.2
    },
    "top_products": [
      {
        "product_id": "321e6543-e87a-12b3-c456-567890123000",
        "product_name": "iPhone 15 256GB Black",
        "units_sold": 25,
        "revenue": 5500000.00,
        "profit": 875000.00,
        "profit_margin": 15.9,
        "ai_insights": {
          "trend": "strong_growth",
          "next_month_forecast": 28,
          "recommendation": "Increase inventory by 20%"
        }
      }
    ],
    "sales_trends": {
      "daily_sales": [
        {"date": "2024-01-15", "revenue": 425000.00, "orders": 6},
        {"date": "2024-01-14", "revenue": 380000.00, "orders": 5}
      ],
      "peak_hours": ["14:00-16:00", "19:00-21:00"],
      "peak_days": ["Friday", "Saturday", "Sunday"]
    },
    "ai_analytics": {
      "market_insights": [
        "iPhone demand increased 25% after New Year",
        "Accessories sales correlate strongly with phone sales",
        "Weekend sales 40% higher than weekdays"
      ],
      "optimization_suggestions": [
        "Schedule more staff during peak hours",
        "Bundle accessories with phone sales",
        "Implement weekend promotional pricing"
      ]
    }
  }
}
```

---

## 🔔 Notification & Approval APIs

### 1. Approval Workflow

#### GET /shop/{shop_code}/approvals/pending
Get pending approval requests
```http
GET /shop/SH001/approvals/pending?type=product_update&priority=high

Authorization: Bearer <SHOP_OWNER_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pending_approvals": [
      {
        "id": "333e4444-e55a-66b7-c888-999000111000",
        "type": "product_update",
        "priority": "medium",
        "requester": {
          "id": "789e0123-e45f-67g8-h901-234567890000",
          "name": "Fatima Ali",
          "role": "manager"
        },
        "request_details": {
          "table_name": "products",
          "record_id": "321e6543-e87a-12b3-c456-567890123000",
          "product_name": "iPhone 15 256GB Black",
          "changes": {
            "selling_price": {
              "from": 220000.00,
              "to": 215000.00
            }
          },
          "reason": "Competitor price match"
        },
        "expires_at": "2024-01-16T14:30:00Z",
        "created_at": "2024-01-15T14:30:00Z"
      }
    ],
    "summary": {
      "total_pending": 5,
      "high_priority": 1,
      "medium_priority": 3,
      "low_priority": 1,
      "expiring_soon": 2
    }
  }
}
```

#### POST /shop/{shop_code}/approvals/{approval_id}/respond
Approve or reject request
```http
POST /shop/SH001/approvals/333e4444-e55a-66b7-c888-999000111000/respond
Authorization: Bearer <SHOP_OWNER_TOKEN>

{
  "action": "approve", // approve, reject
  "notes": "Approved - competitor analysis confirms price adjustment needed"
}
```

---

## 🛡️ Security & Validation

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      },
      {
        "field": "phone",
        "message": "Phone number must start with +92"
      }
    ]
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Rate Limiting
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

### Webhook Events
```json
{
  "event": "sale.completed",
  "shop_code": "SH001",
  "data": {
    "sale_id": "987e6543-e21a-45b6-c789-012345678000",
    "total_amount": 222000.00,
    "customer_phone": "+923001234569"
  },
  "timestamp": "2024-01-15T17:30:00Z"
}
```

---

This comprehensive API documentation provides:
- ✅ Complete authentication flow for all user types
- ✅ Full CRUD operations for all business entities
- ✅ AI-powered analytics and predictions
- ✅ Worker approval workflow implementation
- ✅ Real-time inventory and sales management
- ✅ Pakistani market-specific payment methods
- ✅ Comprehensive error handling and security
- ✅ Performance optimization and caching strategies

**Next Document**: AI/ML Architecture and Implementation Strategy
