import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    customers: [],
    message: 'POS Customers API temporarily disabled'
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'POS Customers API temporarily disabled'
  }, { status: 503 })
}