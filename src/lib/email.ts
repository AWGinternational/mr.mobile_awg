import nodemailer from 'nodemailer'

// Email Configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG)
  }
  return transporter
}

// Email sending interface
interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email using NodeMailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Skip email in development if not configured
    if (!process.env.SMTP_USER) {
      console.log('📧 Email System Not Configured - Would send:', {
        to: options.to,
        subject: options.subject,
      })
      return true
    }

    const transporter = getTransporter()
    
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Mr. Mobile'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
    })

    console.log('✅ Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER) {
      console.log('⚠️ Email not configured')
      return false
    }

    const transporter = getTransporter()
    await transporter.verify()
    console.log('✅ Email server is ready')
    return true
  } catch (error) {
    console.error('❌ Email server verification failed:', error)
    return false
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Welcome email with credentials for new users
 */
export async function sendWelcomeEmail(params: {
  name: string
  email: string
  password: string
  role: string
  businessName?: string
}): Promise<boolean> {
  const roleDisplay = params.role === 'SHOP_OWNER' ? 'Shop Owner' : 'Shop Worker'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credential-row { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
        .credential-label { font-weight: bold; color: #667eea; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Mr. Mobile!</h1>
          <p>Your account has been created successfully</p>
        </div>
        
        <div class="content">
          <h2>Hello ${params.name}! 👋</h2>
          
          <p>Welcome to Mr. Mobile POS System! Your account has been created as a <strong>${roleDisplay}</strong>.</p>
          
          ${params.businessName ? `<p>Business: <strong>${params.businessName}</strong></p>` : ''}
          
          <div class="credentials">
            <h3 style="margin-top: 0; color: #667eea;">🔐 Your Login Credentials</h3>
            
            <div class="credential-row">
              <div class="credential-label">Email Address:</div>
              <div style="font-size: 16px; font-weight: 500;">${params.email}</div>
            </div>
            
            <div class="credential-row">
              <div class="credential-label">Temporary Password:</div>
              <div style="font-size: 18px; font-family: monospace; font-weight: bold; color: #dc2626;">${params.password}</div>
            </div>
            
            <div class="credential-row">
              <div class="credential-label">Login URL:</div>
              <div><a href="${process.env.NEXTAUTH_URL}/login">${process.env.NEXTAUTH_URL}/login</a></div>
            </div>
          </div>
          
          <div class="warning">
            ⚠️ <strong>Important Security Notice:</strong><br>
            Please change your password immediately after your first login for security purposes.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/login" class="button">
              Login to Your Account →
            </a>
          </div>
          
          <h3>🚀 Getting Started</h3>
          <ol>
            <li>Click the login button above or visit the login URL</li>
            <li>Enter your email and temporary password</li>
            <li>Change your password from the settings page</li>
            <li>Start managing your mobile shop business!</li>
          </ol>
          
          <h3>📞 Need Help?</h3>
          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Mr. Mobile POS System. All rights reserved.</p>
          <p style="font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: params.email,
    subject: `Welcome to Mr. Mobile - Your ${roleDisplay} Account`,
    html,
  })
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(params: {
  name: string
  email: string
  tempPassword: string
  resetBy: string
}): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .password-box { background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .password { font-size: 24px; font-family: monospace; font-weight: bold; color: #dc2626; letter-spacing: 2px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
          <p>Your password has been reset</p>
        </div>
        
        <div class="content">
          <h2>Hello ${params.name},</h2>
          
          <p>Your password has been reset by <strong>${params.resetBy}</strong>.</p>
          
          <div class="password-box">
            <h3 style="margin-top: 0; color: #dc2626;">Your New Temporary Password</h3>
            <div class="password">${params.tempPassword}</div>
          </div>
          
          <div class="warning">
            ⚠️ <strong>Security Notice:</strong><br>
            • This is a temporary password<br>
            • Please change it immediately after login<br>
            • Do not share this password with anyone<br>
            • If you didn't request this reset, contact support immediately
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/login" class="button">
              Login Now →
            </a>
          </div>
          
          <h3>🔒 Security Best Practices</h3>
          <ul>
            <li>Use a strong, unique password</li>
            <li>Never share your credentials with anyone</li>
            <li>Change your password regularly</li>
            <li>Logout from shared devices</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Mr. Mobile POS System. All rights reserved.</p>
          <p style="font-size: 12px; color: #9ca3af;">If you didn't request this, please contact support immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: params.email,
    subject: '🔐 Your Password Has Been Reset - Mr. Mobile',
    html,
  })
}

/**
 * Shop activation notification
 */
export async function sendShopActivationEmail(params: {
  ownerName: string
  ownerEmail: string
  shopName: string
  shopCode: string
  shopCity: string
}): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .shop-info { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Shop Successfully Created!</h1>
          <p>Your mobile shop is now active</p>
        </div>
        
        <div class="content">
          <h2>Congratulations ${params.ownerName}! 🎊</h2>
          
          <p>Your shop has been successfully created and activated in the Mr. Mobile system.</p>
          
          <div class="shop-info">
            <h3 style="margin-top: 0; color: #10b981;">🏪 Shop Details</h3>
            
            <div class="info-row">
              <strong>Shop Name:</strong> ${params.shopName}
            </div>
            
            <div class="info-row">
              <strong>Shop Code:</strong> <span style="font-family: monospace; font-weight: bold;">${params.shopCode}</span>
            </div>
            
            <div class="info-row">
              <strong>Location:</strong> ${params.shopCity}
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/owner" class="button">
              Go to Dashboard →
            </a>
          </div>
          
          <h3>✨ What's Next?</h3>
          <ol>
            <li>Add workers to your shop</li>
            <li>Add your mobile products inventory</li>
            <li>Configure shop settings</li>
            <li>Start making sales!</li>
          </ol>
          
          <h3>📞 Support</h3>
          <p>Need help getting started? Contact our support team anytime.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Mr. Mobile POS System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: params.ownerEmail,
    subject: `🎉 ${params.shopName} is Now Active! - Mr. Mobile`,
    html,
  })
}

/**
 * Low stock alert email
 */
export async function sendLowStockAlert(params: {
  ownerEmail: string
  shopName: string
  products: Array<{ name: string; stock: number; threshold: number }>
}): Promise<boolean> {
  const productsList = params.products.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #dc2626; font-weight: bold;">${p.stock}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.threshold}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
        th { background: #f59e0b; color: white; padding: 12px; text-align: left; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Low Stock Alert</h1>
          <p>${params.shopName}</p>
        </div>
        
        <div class="content">
          <p>The following products are running low on stock:</p>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Current Stock</th>
                <th style="text-align: center;">Threshold</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/owner" class="button">
              View Inventory →
            </a>
          </div>
          
          <p style="margin-top: 20px;">⏰ <strong>Action Required:</strong> Please restock these items soon to avoid running out.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Mr. Mobile POS System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: params.ownerEmail,
    subject: `⚠️ Low Stock Alert - ${params.shopName}`,
    html,
  })
}

