// Debug environment variables in NextAuth context
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/\/\/[^@]*@/, '//***@') : 'NOT_SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***SET***' : 'NOT_SET',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? '***SET***' : 'NOT_SET',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? '***SET***' : 'NOT_SET'
  }

  // Test database connection
  let dbTest = 'NOT_TESTED'
  try {
    const { PrismaClient } = await import('@/generated/prisma')
    const prisma = new PrismaClient()
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT current_database(), current_user`
    dbTest = `SUCCESS: ${JSON.stringify(result)}`
    await prisma.$disconnect()
  } catch (error) {
    dbTest = `ERROR: ${error instanceof Error ? error.message : String(error)}`
  }

  return NextResponse.json({
    environment: envDebug,
    databaseTest: dbTest,
    timestamp: new Date().toISOString()
  })
}
