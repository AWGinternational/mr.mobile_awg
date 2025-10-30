import { NextRequest, NextResponse } from 'next/server'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json({
    success: false,
    message: 'POS Customer API temporarily disabled'
  }, { status: 503 })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json({
    success: false,
    message: 'POS Customer API temporarily disabled'
  }, { status: 503 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json({
    success: false,
    message: 'POS Customer API temporarily disabled'
  }, { status: 503 })
}