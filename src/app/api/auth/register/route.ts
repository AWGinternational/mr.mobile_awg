import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations/auth'
import { UserRole, UserStatus, AuditAction } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Create user with hashed password
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        phone: validatedData.phone,
        role: validatedData.role || UserRole.SHOP_WORKER,
        status: UserStatus.INACTIVE, // Requires admin approval
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      }
    })
    
    // Log user creation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.CREATE,
        tableName: 'users',
        recordId: user.id,
        newValues: {
          name: user.name,
          email: user.email,
          role: user.role,
          registrationSource: 'web',
        },
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Please wait for admin approval.',
      data: user
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
