import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { generateTempPassword } from '@/utils/password-generator'
import { parseCSV, validateShopOwnerCSV, validateWorkerCSV } from '@/lib/csv-utils'
import { sendWelcomeEmail } from '@/lib/email'

// POST /api/users/bulk/import - Bulk import users from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Super Admin can bulk import
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin required.' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { csvData, userType } = body

    if (!csvData || !userType) {
      return NextResponse.json({ 
        error: 'Missing required fields: csvData, userType' 
      }, { status: 400 })
    }

    if (!['SHOP_OWNER', 'SHOP_WORKER'].includes(userType)) {
      return NextResponse.json({ 
        error: 'Invalid userType. Must be SHOP_OWNER or SHOP_WORKER' 
      }, { status: 400 })
    }

    // Parse CSV
    let parsedData: Record<string, string>[]
    try {
      parsedData = parseCSV(csvData)
    } catch (err) {
      return NextResponse.json({ 
        error: 'Invalid CSV format',
        details: err instanceof Error ? err.message : 'Unknown error'
      }, { status: 400 })
    }

    // Validate data
    const validation = userType === 'SHOP_OWNER' 
      ? validateShopOwnerCSV(parsedData)
      : validateWorkerCSV(parsedData)

    if (!validation.valid) {
      return NextResponse.json({
        error: 'Validation failed',
        validationErrors: validation.errors,
        validRowsCount: validation.validRows.length,
        totalRows: parsedData.length
      }, { status: 400 })
    }

    // Process imports
    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[]
    }

    for (const row of validation.validRows) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: row.email },
              { cnic: row.cnic }
            ]
          }
        })

        if (existingUser) {
          results.skipped.push({
            row,
            reason: 'User already exists with this email or CNIC'
          })
          continue
        }

        // Generate password
        const tempPassword = generateTempPassword()
        const hashedPassword = await bcrypt.hash(tempPassword, 12)

        // Create user based on type
        if (userType === 'SHOP_OWNER') {
          const newUser = await prisma.user.create({
            data: {
              name: row.name,
              email: row.email,
              phone: row.phone,
              cnic: row.cnic,
              address: row.address,
              city: row.city,
              province: row.province,
              businessName: row.businessName || null,
              role: 'SHOP_OWNER',
              status: 'ACTIVE',
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })

          // Send welcome email (async, don't wait)
          sendWelcomeEmail({
            name: newUser.name,
            email: newUser.email,
            password: tempPassword,
            role: 'SHOP_OWNER',
            businessName: newUser.businessName || undefined
          }).catch(err => console.error('Email error:', err))

          results.success.push({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            tempPassword
          })

        } else if (userType === 'SHOP_WORKER') {
          // Verify shop exists
          const shop = await prisma.shop.findUnique({
            where: { id: row.shopId },
            include: { owner: true }
          })

          if (!shop) {
            results.failed.push({
              row,
              error: `Shop not found: ${row.shopId}`
            })
            continue
          }

          // Create worker
          const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                name: row.name,
                email: row.email,
                phone: row.phone,
                cnic: row.cnic,
                address: row.address,
                city: row.city,
                province: row.province,
                role: 'SHOP_WORKER',
                status: 'ACTIVE',
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })

            await tx.shopWorker.create({
              data: {
                shopId: row.shopId,
                userId: newUser.id,
                permissions: {},
                isActive: true,
                joinedAt: new Date()
              }
            })

            return newUser
          })

          // Send welcome email (async, don't wait)
          sendWelcomeEmail({
            name: result.name,
            email: result.email,
            password: tempPassword,
            role: 'SHOP_WORKER',
            businessName: shop.name
          }).catch(err => console.error('Email error:', err))

          results.success.push({
            id: result.id,
            email: result.email,
            name: result.name,
            shopId: row.shopId,
            tempPassword
          })
        }

      } catch (err) {
        results.failed.push({
          row,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk import completed',
      summary: {
        total: parsedData.length,
        succeeded: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      results
    }, { status: 200 })

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

