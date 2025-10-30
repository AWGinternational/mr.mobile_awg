// Authentication-specific types using Prisma enums
import { UserRole, UserStatus, User as PrismaUser } from '../generated/prisma'

// Re-export Prisma enums for consistency
export { UserRole, UserStatus }

// Extended User type for authentication
export interface AuthUser extends Partial<PrismaUser> {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  status: UserStatus
  shops?: Array<{
    id: string
    name: string
    code: string
    permissions?: Record<string, any>
  }>
}

// NextAuth session types
export interface AuthSession {
  user: AuthUser
  expires: string
}

// Login credentials type
export interface LoginCredentials {
  email: string
  password: string
}

// Registration data type
export interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
}

// Password change type
export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
