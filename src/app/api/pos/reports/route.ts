import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    reports: [],
    message: 'POS Reports API temporarily disabled'
  })
}