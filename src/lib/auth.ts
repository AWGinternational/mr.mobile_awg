import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
// import { rateLimit } from '@/lib/rate-limit' // Temporarily disabled for debugging
import { UserRole, UserStatus, AuditAction } from '@/types'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: process.env.NODE_ENV === 'production' ? 8 * 60 * 60 : 24 * 60 * 60, // 8h prod, 24h dev
    updateAge: 60 * 60, // Update session every hour
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'john@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials, req) {
        console.log('🔐 NextAuth authorize called with:', { 
          email: credentials?.email, 
          passwordLength: credentials?.password?.length 
        })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          throw new Error('Email and password are required')
        }

        // Get client IP for rate limiting (only on failed attempts)
        const clientIP = req?.headers?.['x-forwarded-for'] || 
                        req?.headers?.['x-real-ip'] || 
                        'unknown'
        
        const ipAddress = Array.isArray(clientIP) ? clientIP[0] : clientIP

        try {
          // Query user from database with shops
          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email.toLowerCase(),
              status: UserStatus.ACTIVE // Only allow active users
            },
            include: {
              ownedShops: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              },
              workerShops: {
                select: {
                  id: true,
                  permissions: true,
                  shop: {
                    select: {
                      id: true,
                      name: true,
                      code: true
                    }
                  }
                }
              }
            }
          })

          console.log('🔍 Database user lookup result:', { 
            found: !!user, 
            email: credentials.email,
            userRole: user?.role,
            userId: user?.id
          })

          if (!user) {
            console.log('❌ User not found in database')
            console.log('⚠️  Failed login attempt for:', credentials.email)
            
            // Apply rate limiting for failed login attempts (temporarily disabled)
            // const rateLimitResult = await rateLimit.login.check(ipAddress)
            // if (!rateLimitResult.success) {
            //   console.log('❌ Rate limit exceeded for IP:', ipAddress)
            //   throw new Error('Too many failed login attempts. Please try again later.')
            // }
            
            // Cannot log to audit_logs table because userId is required
            // and the user doesn't exist. Consider logging to a separate
            // failed_login_attempts table or security logs in the future.
            
            throw new Error('Invalid email or password')
          }

          // Verify password using bcrypt
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          if (!isValidPassword) {
            console.log('❌ Invalid password for user:', user.email)
            
            // Apply rate limiting for failed password attempts (temporarily disabled)
            // const rateLimitResult = await rateLimit.login.check(ipAddress)
            // if (!rateLimitResult.success) {
            //   console.log('❌ Rate limit exceeded for IP:', ipAddress)
            //   throw new Error('Too many failed login attempts. Please try again later.')
            // }
            
            // Log failed password attempt
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: AuditAction.LOGIN,
                tableName: 'users',
                recordId: user.id,
                newValues: {
                  email: user.email,
                  reason: 'Invalid password',
                  ipAddress: ipAddress,
                  userAgent: req?.headers?.['user-agent'] || 'unknown',
                  timestamp: new Date(),
                  success: false
                },
              },
            }).catch(err => console.error('Failed login audit log failed:', err))
            throw new Error('Invalid email or password')
          }

          // Check if user account is active
          if (user.status !== UserStatus.ACTIVE) {
            console.log('❌ User account not active:', user.status)
            // Log inactive account login attempt
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: AuditAction.LOGIN,
                tableName: 'users',
                recordId: user.id,
                newValues: {
                  email: user.email,
                  reason: `Account status: ${user.status}`,
                  ipAddress: ipAddress,
                  userAgent: req?.headers?.['user-agent'] || 'unknown',
                  timestamp: new Date(),
                  success: false
                },
              },
            }).catch(err => console.error('Failed login audit log failed:', err))
            throw new Error(`Account is ${String(user.status).toLowerCase()}. Please contact administrator.`)
          }

          // Build shops array based on user role
          let shops: Array<{id: string, name: string, code: string, permissions?: any}> = []
          
          if (user.role === UserRole.SHOP_OWNER && user.ownedShops) {
            shops = user.ownedShops.map(shop => ({
              id: shop.id,
              name: shop.name,
              code: shop.code
            }))
          } else if (user.role === UserRole.SHOP_WORKER && user.workerShops) {
            shops = user.workerShops.map(ws => ({
              id: ws.shop.id,
              name: ws.shop.name,
              code: ws.shop.code,
              permissions: ws.permissions
            }))
          }

          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone || undefined, // Convert null to undefined
            role: user.role,
            status: user.status as 'ACTIVE',
            shops
          }

          console.log('✅ Authentication successful, returning user:', {
            id: returnUser.id,
            email: returnUser.email,
            name: returnUser.name,
            role: returnUser.role,
            status: returnUser.status,
            shopsCount: shops.length
          })

          // Log successful login with enhanced metadata
          const userAgent = req?.headers?.['user-agent'] || 'unknown'
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: AuditAction.LOGIN,
              tableName: 'users',
              recordId: user.id,
              newValues: {
                loginTime: new Date(),
                ipAddress: Array.isArray(clientIP) ? clientIP[0] : clientIP,
                userAgent: userAgent,
                email: user.email,
                role: user.role
              },
            },
          }).catch(err => console.error('Audit log failed:', err))

          return returnUser

        } catch (error) {
          console.error('💥 Authentication error:', error)
          console.error('   Error details:', error instanceof Error ? error.message : 'Unknown error')
          
          // Cannot log to audit_logs table because userId is required
          // and we may not have a valid user. The error is already logged to console.
          // Consider implementing a separate security_events table for failed auth attempts.
          
          // Re-throw the error so NextAuth can handle it properly
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log('🔑 JWT callback called:', { 
        hasUser: !!user, 
        trigger, 
        tokenSub: token.sub,
        userRole: user ? (user as any).role : 'N/A'
      })
      
      // Persist user data in JWT token
      if (user) {
        token.role = (user as any).role
        token.status = (user as any).status
        token.shops = (user as any).shops
        token.phone = (user as any).phone
        token.name = (user as any).name
        
        console.log('💾 Stored in JWT token:', {
          role: token.role,
          status: token.status,
          phone: token.phone,
          name: token.name
        })
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        // Update token with new session data
        if (session.name) token.name = session.name
        if (session.phone !== undefined) token.phone = session.phone
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      console.log('📋 Session callback called:', { 
        hasToken: !!token, 
        tokenRole: token.role,
        sessionUserId: session.user?.id
      })
      
      // Send properties to client
      if (token && session.user) {
        session.user.id = token.sub as string
        ;(session.user as any).role = token.role
        ;(session.user as any).status = token.status
        ;(session.user as any).shops = token.shops
        ;(session.user as any).phone = token.phone
        // Update name if available in token
        if (token.name) {
          session.user.name = token.name as string
        }
        
        console.log('📤 Session user object:', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role,
          status: (session.user as any).status
        })
      }

      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow all sign-ins for demo
      return true
    },
    async redirect({ url, baseUrl }) {
      // Handle role-based redirection after sign-in
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      phone?: string
      role: string
      status: string
      shops: Array<{
        id: string
        name: string
        code: string
        permissions?: Record<string, any>
      }>
    }
  }

  interface User {
    id: string
    email: string
    name: string
    phone?: string
    role: string
    status: string
    shops: Array<{
      id: string
      name: string
      code: string
      permissions?: Record<string, any>
    }>
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    status: string
    shops: Array<{
      id: string
      name: string
      code: string
      permissions?: Record<string, any>
    }>
    phone?: string
  }
}
