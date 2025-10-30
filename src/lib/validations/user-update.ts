import { z } from 'zod'
import { FormValidator } from '@/utils/form-validation'
import { UserRole, UserStatus } from '@/types'

// User update validation schema
export const updateUserSchema = z.object({
  // Personal Information
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .transform(val => val.trim())
    .optional(),
  
  phone: z.string()
    .refine(val => FormValidator.validatePhoneNumber(val) === null, {
      message: 'Phone number must be in format +92-XXX-XXXXXXX'
    })
    .optional(),
  
  cnic: z.string()
    .refine(val => FormValidator.validateCNIC(val) === null, {
      message: 'CNIC must be in format 42101-1234567-8'
    })
    .optional(),
  
  // Address Information
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters')
    .optional(),
  
  province: z.string()
    .min(2, 'Province must be at least 2 characters')
    .max(50, 'Province must be less than 50 characters')
    .optional(),
  
  // Business Information (Optional for shop owners)
  businessName: z.string()
    .max(200, 'Business name must be less than 200 characters')
    .optional()
    .nullable(),
  
  // System fields (Admin only)
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional()
})

// Validation for status change specifically
export const statusChangeSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
    .default('')
})

// Type exports
export type UpdateUserData = z.infer<typeof updateUserSchema>
export type StatusChangeData = z.infer<typeof statusChangeSchema>