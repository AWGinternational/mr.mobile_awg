import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  saleId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { saleId } = await params

    // Fetch the sale with all details
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                model: true
              }
            }
          }
        },
        shop: {
          select: {
            name: true,
            address: true,
            phone: true,
            gstNumber: true
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Format the receipt data
    const receipt = {
      sale: {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        saleDate: sale.saleDate,
        status: sale.status,
        paymentMethod: sale.paymentMethod,
        subtotal: Number(sale.subtotal),
        discountAmount: Number(sale.discountAmount),
        taxAmount: Number(sale.taxAmount),
        totalAmount: Number(sale.totalAmount),
        notes: sale.notes
      },
      shop: sale.shop,
      customer: sale.customer || {
        name: 'Walk-in Customer',
        phone: null,
        email: null
      },
      items: sale.items.map(item => ({
        productName: item.product.name,
        productSku: item.product.sku,
        productModel: item.product.model,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }

    // Generate HTML receipt
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${sale.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .shop-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .info-line {
      font-size: 12px;
      margin: 2px 0;
    }
    .section {
      margin: 15px 0;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: 12px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 14px;
      margin: 5px 0;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 11px;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">${sale.shop.name}</div>
    <div class="info-line">${sale.shop.address || ''}</div>
    <div class="info-line">Tel: ${sale.shop.phone || 'N/A'}</div>
    <div class="info-line">GST: ${sale.shop.gstNumber || 'N/A'}</div>
  </div>

  <div class="section">
    <div class="info-line"><strong>Invoice:</strong> ${sale.invoiceNumber}</div>
    <div class="info-line"><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleString()}</div>
    <div class="info-line"><strong>Customer:</strong> ${receipt.customer.name}</div>
    ${receipt.customer.phone ? `<div class="info-line"><strong>Phone:</strong> ${receipt.customer.phone}</div>` : ''}
    <div class="info-line"><strong>Payment:</strong> ${sale.paymentMethod}</div>
  </div>

  <div class="section">
    <div style="font-weight: bold; margin-bottom: 5px;">ITEMS</div>
    ${receipt.items.map(item => `
      <div class="item-row">
        <span>${item.productName} (${item.productSku})</span>
      </div>
      <div class="item-row" style="padding-left: 10px;">
        <span>${item.quantity} x PKR ${item.unitPrice.toLocaleString()}</span>
        <span>PKR ${item.totalPrice.toLocaleString()}</span>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="item-row">
      <span>Subtotal:</span>
      <span>PKR ${receipt.sale.subtotal.toLocaleString()}</span>
    </div>
    ${receipt.sale.discountAmount > 0 ? `
    <div class="item-row" style="color: green;">
      <span>Discount:</span>
      <span>- PKR ${receipt.sale.discountAmount.toLocaleString()}</span>
    </div>
    ` : ''}
    <div class="item-row">
      <span>Tax:</span>
      <span>PKR ${receipt.sale.taxAmount.toLocaleString()}</span>
    </div>
    <div class="total-row" style="border-top: 2px solid #000; padding-top: 5px; margin-top: 5px;">
      <span>TOTAL:</span>
      <span>PKR ${receipt.sale.totalAmount.toLocaleString()}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Powered by Mr. Mobile</p>
  </div>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    })

  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}