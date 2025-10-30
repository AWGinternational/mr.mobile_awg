import { z } from 'zod'
import { ProductType, ProductStatus } from '@/types'

// Product Management Schemas
export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  model: z.string().min(1, 'Model is required'),
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  barcode: z.string().optional(),
  type: z.nativeEnum(ProductType),
  description: z.string().optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  images: z.array(z.string().url()).optional(),
  warranty: z.number().int().min(0).max(120).optional(), // 0-120 months
  costPrice: z.number().positive('Cost price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  minimumPrice: z.number().positive('Minimum price must be positive').optional(),
  markupPercentage: z.number().min(0).max(1000).optional(), // 0-1000%
  categoryId: z.string().cuid('Invalid category ID'),
  brandId: z.string().cuid('Invalid brand ID'),
  lowStockThreshold: z.number().int().min(0).default(5),
  reorderPoint: z.number().int().min(0).default(10),
}).refine((data) => {
  if (data.minimumPrice && data.minimumPrice > data.sellingPrice) {
    return false
  }
  if (data.sellingPrice <= data.costPrice) {
    return false
  }
  return true
}, {
  message: "Selling price must be greater than cost price and minimum price must not exceed selling price",
  path: ["sellingPrice"],
})

export const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
  model: z.string().min(1, 'Model is required').optional(),
  barcode: z.string().optional(),
  type: z.nativeEnum(ProductType).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  description: z.string().optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  images: z.array(z.string().url()).optional(),
  warranty: z.number().int().min(0).max(120).optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  sellingPrice: z.number().positive('Selling price must be positive').optional(),
  minimumPrice: z.number().positive('Minimum price must be positive').optional(),
  markupPercentage: z.number().min(0).max(1000).optional(),
  categoryId: z.string().cuid('Invalid category ID').optional(),
  brandId: z.string().cuid('Invalid brand ID').optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
})

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  code: z.string()
    .min(2, 'Category code must be at least 2 characters')
    .max(20, 'Category code must not exceed 20 characters')
    .regex(/^[A-Z0-9_]+$/, 'Category code must contain only uppercase letters, numbers, and underscores'),
  description: z.string().optional(),
  parentId: z.string().cuid('Invalid parent category ID').optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').optional(),
  description: z.string().optional(),
  parentId: z.string().cuid('Invalid parent category ID').optional(),
  isActive: z.boolean().optional(),
})

// Brand Schemas
export const createBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  code: z.string()
    .min(2, 'Brand code must be at least 2 characters')
    .max(20, 'Brand code must not exceed 20 characters')
    .regex(/^[A-Z0-9_]+$/, 'Brand code must contain only uppercase letters, numbers, and underscores'),
  logo: z.string().url('Invalid logo URL').optional(),
  description: z.string().optional(),
})

export const updateBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters').optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Product Filter Schema
export const productFilterSchema = z.object({
  categoryId: z.string().cuid().optional(),
  brandId: z.string().cuid().optional(),
  type: z.nativeEnum(ProductType).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  inStock: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>
