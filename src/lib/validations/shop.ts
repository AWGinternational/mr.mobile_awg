import { z } from 'zod'
import { ShopStatus } from '@/types'

// Shop Management Schemas
export const createShopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  code: z.string()
    .min(2, 'Shop code must be at least 2 characters')
    .max(10, 'Shop code must not exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Shop code must contain only uppercase letters and numbers'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  province: z.string().min(2, 'Province must be at least 2 characters'),
  postalCode: z.string().regex(/^[0-9]{5}$/, 'Invalid postal code').optional(),
  phone: z.string().regex(/^(\+92|92|0)?[0-9]{10}$/, 'Invalid Pakistani phone number'),
  email: z.string().email('Invalid email address').optional(),
  licenseNumber: z.string().min(5, 'License number must be at least 5 characters').optional(),
  gstNumber: z.string().regex(/^[0-9]{2}-[0-9]{7}-[0-9]{1}$/, 'Invalid GST number format (XX-XXXXXXX-X)').optional(),
  ownerId: z.string().cuid('Invalid owner ID'),
  settings: z.record(z.string(), z.any()).optional(),
})

export const updateShopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').optional(),
  province: z.string().min(2, 'Province must be at least 2 characters').optional(),
  postalCode: z.string().regex(/^[0-9]{5}$/, 'Invalid postal code').optional(),
  phone: z.string().regex(/^(\+92|92|0)?[0-9]{10}$/, 'Invalid Pakistani phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
  licenseNumber: z.string().min(5, 'License number must be at least 5 characters').optional(),
  gstNumber: z.string().regex(/^[0-9]{2}-[0-9]{7}-[0-9]{1}$/, 'Invalid GST number format (XX-XXXXXXX-X)').optional(),
  status: z.nativeEnum(ShopStatus).optional(),
  settings: z.record(z.string(), z.any()).optional(),
})

export const assignWorkerSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  permissions: z.record(z.string(), z.any()).optional(),
})

export const updateWorkerPermissionsSchema = z.object({
  permissions: z.record(z.string(), z.any()),
})

export type CreateShopInput = z.infer<typeof createShopSchema>
export type UpdateShopInput = z.infer<typeof updateShopSchema>
export type AssignWorkerInput = z.infer<typeof assignWorkerSchema>
export type UpdateWorkerPermissionsInput = z.infer<typeof updateWorkerPermissionsSchema>
