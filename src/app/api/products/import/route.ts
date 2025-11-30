import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProductType, ProductStatus } from '@/types'
import Papa from 'papaparse'

interface ImportProduct {
  name: string
  model: string
  sku: string
  barcode?: string
  description?: string
  costPrice: number
  sellingPrice: number
  minimumPrice?: number
  lowStockThreshold?: number
  reorderPoint?: number
  warranty?: number
  type: ProductType
  status: ProductStatus
  category: string  // Category name
  brand: string     // Brand name
  stock: number     // Initial stock quantity
}

export async function POST(request: NextRequest) {
  console.log('🚀 Import API called!')
  try {
    const session = await getServerSession(authOptions)
    console.log('👤 Session:', session?.user ? 'Authenticated' : 'Not authenticated')
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔐 PERMISSION CHECK: Only owners can import products
    if (session.user.role !== 'SHOP_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied',
        message: 'Only shop owners can bulk import products.'
      }, { status: 403 })
    }

    // Get the user's shop ID
    let currentShopId: string | null = null
    
    console.log('🔍 Getting shop ID for user:', {
      userId: session.user.id,
      role: session.user.role,
      shops: (session.user as any).shops
    })
    
    if (session.user.role === 'SHOP_OWNER' || session.user.role === 'SUPER_ADMIN') {
      const userShops = (session.user as any).shops || []
      currentShopId = userShops.length > 0 ? userShops[0].id : null
      console.log('🏪 Shop ID from user shops:', currentShopId)
    } else if (session.user.role === 'SHOP_WORKER') {
      // For shop workers, get shop from ShopWorker table
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        },
        select: { shopId: true }
      })
      currentShopId = worker?.shopId || null
      console.log('👷 Shop ID from worker record:', currentShopId)
    }
    
    if (!currentShopId) {
      console.error('❌ No shop ID found for user:', session.user.id)
      return NextResponse.json({ error: 'No shop assigned to user' }, { status: 400 })
    }
    
    console.log('✅ Using shop ID:', currentShopId)

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('📁 File received:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const fileContent = await file.text()
    console.log('📄 File content preview:', fileContent.substring(0, 200))
    
    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string, field: string) => {
        // Convert numeric fields
        if (['costPrice', 'sellingPrice', 'minimumPrice', 'lowStockThreshold', 'reorderPoint', 'warranty', 'stock'].includes(field)) {
          const num = parseFloat(value)
          return isNaN(num) ? 0 : num
        }
        return value
      }
    })
    
    console.log('📊 Parse result:', {
      data: parseResult.data.length,
      errors: parseResult.errors.length,
      meta: parseResult.meta
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        error: 'CSV parsing failed',
        details: parseResult.errors
      }, { status: 400 })
    }

    const products = parseResult.data as ImportProduct[]
    
    console.log('📊 Parsed products from CSV:', products.length)
    console.log('📊 First product sample:', products[0])
    console.log('📊 All product types found:', [...new Set(products.map(p => p.type))])
    console.log('📊 All categories found:', [...new Set(products.map(p => p.category))])
    console.log('📊 All brands found:', [...new Set(products.map(p => p.brand))])
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'No products found in file' }, { status: 400 })
    }

    // Get existing categories and brands
    const existingCategories = await prisma.category.findMany({
      where: { shopId: currentShopId },
      select: { id: true, name: true }
    })
    const existingBrands = await prisma.brand.findMany({
      where: { shopId: currentShopId },
      select: { id: true, name: true }
    })

    // Create maps for quick lookup
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]))
    const brandMap = new Map(existingBrands.map(b => [b.name.toLowerCase(), b.id]))

    // Collect unique categories and brands from import data
    const uniqueCategories = new Set<string>()
    const uniqueBrands = new Set<string>()
    
    products.forEach(product => {
      if (product.category) uniqueCategories.add(product.category.trim())
      if (product.brand) uniqueBrands.add(product.brand.trim())
    })

    // Create missing categories
    console.log('📁 Creating missing categories:', Array.from(uniqueCategories))
    console.log('🔍 Shop ID for category creation:', currentShopId)
    for (const categoryName of uniqueCategories) {
      if (!categoryMap.has(categoryName.toLowerCase())) {
        console.log(`Creating category: ${categoryName} for shop: ${currentShopId}`)
        try {
          const newCategory = await prisma.category.create({
            data: {
              name: categoryName,
              code: categoryName.substring(0, 3).toUpperCase(),
              shopId: currentShopId
            }
          })
          console.log(`✅ Category created: ${newCategory.id} - ${newCategory.name}`)
          categoryMap.set(categoryName.toLowerCase(), newCategory.id)
        } catch (error) {
          console.error(`❌ Failed to create category "${categoryName}":`, error)
          throw new Error(`Failed to create category "${categoryName}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        console.log(`Category already exists: ${categoryName}`)
      }
    }

    // Create missing brands
    console.log('🏷️ Creating missing brands:', Array.from(uniqueBrands))
    console.log('🔍 Shop ID for brand creation:', currentShopId)
    for (const brandName of uniqueBrands) {
      if (!brandMap.has(brandName.toLowerCase())) {
        console.log(`Creating brand: ${brandName} for shop: ${currentShopId}`)
        try {
          const newBrand = await prisma.brand.create({
            data: {
              name: brandName,
              code: brandName.substring(0, 3).toUpperCase(),
              shopId: currentShopId
            }
          })
          console.log(`✅ Brand created: ${newBrand.id} - ${newBrand.name}`)
          brandMap.set(brandName.toLowerCase(), newBrand.id)
        } catch (error) {
          console.error(`❌ Failed to create brand "${brandName}":`, error)
          throw new Error(`Failed to create brand "${brandName}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        console.log(`Brand already exists: ${brandName}`)
      }
    }

    const productsToCreate = []
    const errors = []
    const skippedDuplicates: string[] = []

    // Helper function to generate unique SKU
    const generateSKU = (name: string, model: string, index: number) => {
      const nameCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
      const modelCode = model.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
      const timestamp = Date.now().toString().slice(-6)
      return `${nameCode}-${modelCode}-${timestamp}-${index}`
    }

    // Helper function to generate unique barcode
    const generateBarcode = (index: number) => {
      const timestamp = Date.now().toString().slice(-10)
      return `${timestamp}${index.toString().padStart(4, '0')}`
    }

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const rowNumber = i + 2 // +2 because CSV is 1-indexed and has header

      try {
        // Validate required fields (name and model required, SKU can be auto-generated)
        if (!product.name || !product.model) {
          errors.push(`Row ${rowNumber}: Missing required fields (name or model) - name: "${product.name}", model: "${product.model}"`)
          continue
        }

        // Auto-generate SKU if missing or blank
        if (!product.sku || product.sku.trim() === '') {
          product.sku = generateSKU(product.name, product.model, i + 1)
          console.log(`Row ${rowNumber}: Auto-generated SKU: ${product.sku}`)
        }

        if (!product.category || !product.brand) {
          errors.push(`Row ${rowNumber}: Missing required fields (category or brand) - category: "${product.category}", brand: "${product.brand}"`)
          continue
        }

        if (!product.costPrice || !product.sellingPrice) {
          errors.push(`Row ${rowNumber}: Missing required price fields - costPrice: "${product.costPrice}", sellingPrice: "${product.sellingPrice}"`)
          continue
        }

        // Validate numeric fields
        if (product.costPrice <= 0 || product.sellingPrice <= 0) {
          errors.push(`Row ${rowNumber}: Prices must be greater than 0`)
          continue
        }

        if (product.sellingPrice < product.costPrice) {
          errors.push(`Row ${rowNumber}: Selling price cannot be less than cost price`)
          continue
        }

        // Map product type to valid enum value
        // Valid enum: MOBILE_PHONE, ACCESSORY, SIM_CARD, SERVICE
        // Any other type gets mapped to ACCESSORY (most generic for accessories/parts)
        const validTypes = ['MOBILE_PHONE', 'ACCESSORY', 'SIM_CARD', 'SERVICE']
        let resolvedType: ProductType = ProductType.ACCESSORY // Default
        
        if (product.type) {
          const typeUpper = String(product.type).toUpperCase().replace(/[^A-Z0-9_]/g, '_')
          
          if (validTypes.includes(typeUpper)) {
            // Exact match to enum
            resolvedType = typeUpper as ProductType
          } else {
            // Map common types to enum values
            const typeMapping: Record<string, ProductType> = {
              'PHONE': ProductType.MOBILE_PHONE,
              'MOBILE': ProductType.MOBILE_PHONE,
              'SMARTPHONE': ProductType.MOBILE_PHONE,
              'CELL_PHONE': ProductType.MOBILE_PHONE,
              'CELLPHONE': ProductType.MOBILE_PHONE,
              'BATTERY': ProductType.ACCESSORY,
              'CHARGER': ProductType.ACCESSORY,
              'CABLE': ProductType.ACCESSORY,
              'CASE': ProductType.ACCESSORY,
              'COVER': ProductType.ACCESSORY,
              'HEADPHONES': ProductType.ACCESSORY,
              'EARPHONES': ProductType.ACCESSORY,
              'EARBUDS': ProductType.ACCESSORY,
              'SCREEN_PROTECTOR': ProductType.ACCESSORY,
              'TEMPERED_GLASS': ProductType.ACCESSORY,
              'POWER_BANK': ProductType.ACCESSORY,
              'ADAPTER': ProductType.ACCESSORY,
              'HOLDER': ProductType.ACCESSORY,
              'STAND': ProductType.ACCESSORY,
              'SIM': ProductType.SIM_CARD,
              'SIMCARD': ProductType.SIM_CARD,
              'REPAIR': ProductType.SERVICE,
              'UNLOCK': ProductType.SERVICE,
              'UNLOCKING': ProductType.SERVICE,
            }
            
            resolvedType = typeMapping[typeUpper] || ProductType.ACCESSORY
            console.log(`Row ${rowNumber}: Mapped product type "${product.type}" -> ${resolvedType}`)
          }
        }
        
        // Update product type to resolved value
        product.type = resolvedType

        // Get category and brand IDs
        const categoryId = categoryMap.get(product.category.toLowerCase())
        const brandId = brandMap.get(product.brand.toLowerCase())

        console.log(`Row ${rowNumber}: Looking up category "${product.category}" -> ${categoryId}`)
        console.log(`Row ${rowNumber}: Looking up brand "${product.brand}" -> ${brandId}`)

        if (!categoryId || !brandId) {
          errors.push(`Row ${rowNumber}: Category or brand not found after creation`)
          continue
        }

        // Check for duplicate SKU - SKIP instead of error
        const existingProduct = await prisma.product.findUnique({
          where: {
            sku_shopId: {
              sku: product.sku,
              shopId: currentShopId
            }
          }
        })

        if (existingProduct) {
          skippedDuplicates.push(`Row ${rowNumber}: SKU "${product.sku}" already exists - SKIPPED`)
          console.log(`⏭️ Row ${rowNumber}: Skipping duplicate SKU "${product.sku}"`)
          continue
        }

        // Auto-generate barcode if missing or blank
        if (!product.barcode || product.barcode.trim() === '') {
          product.barcode = generateBarcode(i + 1)
          console.log(`Row ${rowNumber}: Auto-generated barcode: ${product.barcode}`)
        }

        // Check for duplicate barcode - try to generate new one if exists
        let barcodeAttempts = 0
        while (barcodeAttempts < 5) {
          const existingBarcode = await prisma.product.findUnique({
            where: {
              barcode_shopId: {
                barcode: product.barcode!,
                shopId: currentShopId
              }
            }
          })

          if (!existingBarcode) {
            break // Barcode is unique
          }

          // Generate a new barcode
          barcodeAttempts++
          product.barcode = generateBarcode(i + 1 + barcodeAttempts * 1000)
          console.log(`Row ${rowNumber}: Barcode collision, trying new one: ${product.barcode}`)
        }

        if (barcodeAttempts >= 5) {
          // Set barcode to null if we can't generate a unique one
          product.barcode = undefined
          console.log(`Row ${rowNumber}: Could not generate unique barcode, setting to null`)
        }

        // Prepare product data (without stock field)
        const productData = {
          name: product.name.trim(),
          model: product.model.trim(),
          sku: product.sku.trim(),
          barcode: product.barcode?.trim() || null,
          description: product.description?.trim() || null,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          minimumPrice: product.minimumPrice || null,
          lowStockThreshold: product.lowStockThreshold || 5,
          reorderPoint: product.reorderPoint || 10,
          warranty: product.warranty || 12,
          type: product.type || ProductType.MOBILE_PHONE,
          status: product.status || ProductStatus.ACTIVE,
          categoryId: categoryId,
          brandId: brandId,
          shopId: currentShopId
        }
        
        // Store stock quantity separately for inventory creation
        const stockQuantity = Math.max(1, Math.floor(product.stock || 1))

        productsToCreate.push({ productData, stockQuantity })

      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // If there are validation errors (not skipped duplicates), return them
    if (errors.length > 0 && productsToCreate.length === 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: errors,
        skippedDuplicates: skippedDuplicates,
        successCount: 0,
        errorCount: errors.length,
        skippedCount: skippedDuplicates.length
      }, { status: 400 })
    }

    // Create products individually for better error handling
    let createdCount = 0
    const creationErrors = []

    for (let i = 0; i < productsToCreate.length; i++) {
      const { productData, stockQuantity } = productsToCreate[i]
      const rowNumber = i + 2 // +2 because CSV is 1-indexed and has header
      
      try {
        console.log(`Creating product ${i + 1}:`, {
          name: productData.name,
          sku: productData.sku,
          categoryId: productData.categoryId,
          brandId: productData.brandId,
          stockQuantity: stockQuantity
        })
        
        // Create product and inventory items in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create the product
          const createdProduct = await tx.product.create({
            data: productData
          })
          
          // Create inventory items based on stock quantity
          console.log(`📦 Creating ${stockQuantity} inventory items for ${createdProduct.name}`)
          
          const inventoryItems = []
          for (let j = 0; j < stockQuantity; j++) {
            const inventoryItem = await tx.inventoryItem.create({
              data: {
                productId: createdProduct.id,
                shopId: currentShopId,
                batchNumber: `BATCH-${Date.now()}-${i + 1}-${j + 1}`,
                status: 'IN_STOCK',
                costPrice: productData.costPrice,
                purchaseDate: new Date() // Add current date as purchase date
              }
            })
            inventoryItems.push(inventoryItem)
          }
          
          return { product: createdProduct, inventoryCount: inventoryItems.length }
        })
        
        console.log(`✅ Product and ${result.inventoryCount} inventory items created successfully:`, result.product.id)
        createdCount++
        
      } catch (error) {
        console.error(`❌ Failed to create product ${i + 1}:`, error)
        creationErrors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Combine validation and creation errors
    const allErrors = [...errors, ...creationErrors]
    
    // Determine success status
    const isSuccess = createdCount > 0 || skippedDuplicates.length > 0
    let message = ''
    if (createdCount > 0) {
      message = `Successfully imported ${createdCount} product(s)`
    }
    if (skippedDuplicates.length > 0) {
      message += message ? `. Skipped ${skippedDuplicates.length} duplicate(s)` : `Skipped ${skippedDuplicates.length} duplicate(s)`
    }
    if (!message) {
      message = 'No products were imported'
    }
    
    console.log('📊 Import result:', {
      success: isSuccess,
      createdCount,
      skippedCount: skippedDuplicates.length,
      totalRows: products.length,
      errorCount: allErrors.length
    })
    
    return NextResponse.json({
      success: isSuccess,
      message: message,
      createdCount,
      skippedCount: skippedDuplicates.length,
      skippedDuplicates: skippedDuplicates.length > 0 ? skippedDuplicates : undefined,
      totalRows: products.length,
      errors: allErrors.length > 0 ? allErrors : undefined
    })

  } catch (error) {
    console.error('❌ Import API Error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Failed to import products',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
