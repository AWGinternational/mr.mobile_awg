// Shop Configuration API - Manage shop-specific POS settings
// GET /api/shop/configuration - Get shop configuration
// PUT /api/shop/configuration - Update shop configuration

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GSTMode, CommissionType, PaymentMethod } from '@/types/pos'
import { z } from 'zod'

// Shop configuration validation schema
const shopConfigurationSchema = z.object({
  // GST Configuration
  gstMode: z.nativeEnum(GSTMode).default(GSTMode.AUTO),
  gstRate: z.number().min(0).max(100).default(17.00),
  gstNumber: z.string().optional(),
  autoCalculateGST: z.boolean().default(true),
  
  // Commission Configuration
  enableCommissions: z.boolean().default(true),
  defaultCommissionType: z.nativeEnum(CommissionType).default(CommissionType.PERCENTAGE),
  defaultCommissionRate: z.number().min(0).max(100).default(2.50),
  tieredCommissionRates: z.array(z.object({
    minAmount: z.number().min(0),
    maxAmount: z.number().min(0),
    rate: z.number().min(0).max(100),
  })).default([]),
  
  // Return Policy
  returnPolicyDays: z.number().int().min(0).max(365).default(7),
  allowReturnWithoutReceipt: z.boolean().default(false),
  restockingFee: z.number().min(0).max(100).default(0.00),
  
  // POS Settings
  requireCustomerInfo: z.boolean().default(false),
  defaultPaymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  allowPartialPayments: z.boolean().default(true),
  printReceiptsByDefault: z.boolean().default(true),
  
  // Offline Settings
  enableOfflineMode: z.boolean().default(true),
  offlineSyncInterval: z.number().int().min(60).max(3600).default(300), // 1 minute to 1 hour
  maxOfflineTransactions: z.number().int().min(10).max(1000).default(100),
  
  // Business Hours
  businessHours: z.object({
    monday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean(),
    }),
    tuesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean(),
    }),
    wednesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean(),
    }),
    thursday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean(),
    }),
    friday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean(),
    }),
    saturday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean(),
    }),
    sunday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean(),
    }),
  }).default({
    monday: { open: "09:00", close: "21:00", closed: false },
    tuesday: { open: "09:00", close: "21:00", closed: false },
    wednesday: { open: "09:00", close: "21:00", closed: false },
    thursday: { open: "09:00", close: "21:00", closed: false },
    friday: { open: "09:00", close: "21:00", closed: false },
    saturday: { open: "09:00", close: "21:00", closed: false },
    sunday: { open: "10:00", close: "20:00", closed: false },
  }),
  
  // Currency and Locale
  currency: z.string().length(3).default('PKR'),
  locale: z.string().default('ur-PK'),
  timezone: z.string().default('Asia/Karachi'),
})

// GET /api/shop/configuration - Get shop configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's shop ID (assuming shop owner or worker)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedShops: {
          select: { id: true }
        },
        workerShops: {
          select: { shopId: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine shop ID
    let shopId: string | null = null
    if (user.ownedShops.length > 0) {
      shopId = user.ownedShops[0].id
    } else if (user.workerShops.length > 0) {
      shopId = user.workerShops[0].shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop associated with user' }, { status: 400 })
    }

    // Get shop configuration from shop settings
    let shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { 
        id: true, 
        name: true, 
        settings: true
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Get configuration from shop settings, use defaults if not set
    const shopConfig = {
      ...shopConfigurationSchema.parse({}), // Use default values
      ...(shop.settings as object || {}), // Override with actual settings
    }

    return NextResponse.json({
      success: true,
      configuration: shopConfig,
    })

  } catch (error) {
    console.error('Error fetching shop configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/shop/configuration - Update shop configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const configData = shopConfigurationSchema.parse(body)

    // Get user's shop ID (only shop owners can update configuration)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedShops: {
          select: { id: true }
        }
      }
    })

    if (!user || user.ownedShops.length === 0) {
      return NextResponse.json(
        { error: 'Only shop owners can update configuration' },
        { status: 403 }
      )
    }

    const shopId = user.ownedShops[0].id

    // Validate tiered commission rates
    if (configData.tieredCommissionRates.length > 0) {
      for (let i = 0; i < configData.tieredCommissionRates.length; i++) {
        const tier = configData.tieredCommissionRates[i]
        if (tier.minAmount >= tier.maxAmount) {
          return NextResponse.json(
            { error: `Invalid tier ${i + 1}: minimum amount must be less than maximum amount` },
            { status: 400 }
          )
        }
        
        // Check for overlapping tiers
        for (let j = i + 1; j < configData.tieredCommissionRates.length; j++) {
          const otherTier = configData.tieredCommissionRates[j]
          if (
            (tier.minAmount >= otherTier.minAmount && tier.minAmount < otherTier.maxAmount) ||
            (tier.maxAmount > otherTier.minAmount && tier.maxAmount <= otherTier.maxAmount)
          ) {
            return NextResponse.json(
              { error: `Overlapping commission tiers: ${i + 1} and ${j + 1}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Validate business hours
    for (const [day, schedule] of Object.entries(configData.businessHours)) {
      if (!schedule.closed && schedule.open >= schedule.close) {
        return NextResponse.json(
          { error: `Invalid business hours for ${day}: opening time must be before closing time` },
          { status: 400 }
        )
      }
    }

    // Update shop configuration by storing in shop settings
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        settings: configData,
      },
      select: {
        id: true,
        name: true,
        settings: true,
      }
    })

    return NextResponse.json({
      success: true,
      configuration: {
        ...configData,
        shopId,
        id: shopId,
      },
      message: 'Shop configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating shop configuration:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Note: Product type configurations will be implemented when the ProductTypeConfiguration model is added to the schema
