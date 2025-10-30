import { prisma } from '@/lib/db'
import { AuditAction } from '@/types'

export interface AuditLogData {
  userId: string
  action: AuditAction
  tableName: string
  recordId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export interface AuthAuditData {
  userId?: string
  email: string
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED'
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

/**
 * Create a general audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        tableName: data.tableName,
        recordId: data.recordId,
        oldValues: data.oldValues || {},
        newValues: data.newValues || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking main functionality
  }
}

/**
 * Create authentication-specific audit log
 */
export async function createAuthAuditLog(data: AuthAuditData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || 'anonymous',
        action: AuditAction.LOGIN, // Use LOGIN instead of AUTH_EVENT
        tableName: 'authentication',
        recordId: data.email,
        newValues: {
          authAction: data.action,
          email: data.email,
          timestamp: new Date(),
          ...data.metadata
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to create auth audit log:', error)
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs({
  userId,
  action,
  tableName,
  startDate,
  endDate,
  page = 1,
  limit = 50
}: {
  userId?: string
  action?: AuditAction
  tableName?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const skip = (page - 1) * limit
  
  const whereClause: any = {}
  
  if (userId) whereClause.userId = userId
  if (action) whereClause.action = action
  if (tableName) whereClause.tableName = tableName
  if (startDate || endDate) {
    whereClause.createdAt = {}
    if (startDate) whereClause.createdAt.gte = startDate
    if (endDate) whereClause.createdAt.lte = endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where: whereClause })
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Get authentication activity summary
 */
export async function getAuthActivitySummary(userId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const authLogs = await prisma.auditLog.findMany({
    where: {
      userId,
      tableName: 'authentication',
      createdAt: {
        gte: startDate
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  const summary = {
    totalLogins: 0,
    failedLogins: 0,
    lastLogin: null as Date | null,
    uniqueIPs: new Set<string>(),
    loginsByDay: {} as Record<string, number>
  }

  authLogs.forEach(log => {
    const authAction = (log.newValues as any)?.authAction
    const day = log.createdAt.toISOString().split('T')[0]
    
    if (authAction === 'LOGIN_SUCCESS') {
      summary.totalLogins++
      if (!summary.lastLogin || log.createdAt > summary.lastLogin) {
        summary.lastLogin = log.createdAt
      }
    } else if (authAction === 'LOGIN_FAILED') {
      summary.failedLogins++
    }

    if (log.ipAddress) {
      summary.uniqueIPs.add(log.ipAddress)
    }

    summary.loginsByDay[day] = (summary.loginsByDay[day] || 0) + 1
  })

  return {
    ...summary,
    uniqueIPCount: summary.uniqueIPs.size,
    uniqueIPs: Array.from(summary.uniqueIPs)
  }
}

/**
 * Helper to extract IP and User Agent from request
 */
export function getRequestInfo(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const userAgent = request.headers.get('user-agent')
  
  let ipAddress = 'unknown'
  if (forwarded) {
    ipAddress = forwarded.split(',')[0].trim()
  } else if (realIP) {
    ipAddress = realIP
  }

  return {
    ipAddress,
    userAgent: userAgent || 'unknown'
  }
}
