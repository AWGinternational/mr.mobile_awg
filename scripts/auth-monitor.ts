#!/usr/bin/env tsx

/**
 * 🔍 REAL-TIME AUTHENTICATION MONITOR
 * Monitors authentication events in real-time
 */

import { prisma } from '../src/lib/db'

async function monitorAuth() {
  console.log('🔍 REAL-TIME AUTHENTICATION MONITOR')
  console.log('='.repeat(50))
  console.log('Monitoring authentication events...')
  console.log('Press Ctrl+C to stop monitoring\n')
  
  let lastLogId = ''
  
  // Get the latest audit log ID to start monitoring from
  try {
    const latestLog = await prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    })
    lastLogId = latestLog?.id || ''
  } catch (error) {
    console.log('⚠️  Audit logging may not be available')
  }
  
  // Monitor function
  const monitor = async () => {
    try {
      // Check for new audit logs
      const newLogs = await prisma.auditLog.findMany({
        where: lastLogId ? {
          id: { gt: lastLogId }
        } : {},
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { email: true, role: true }
          }
        }
      })
      
      if (newLogs.length > 0) {
        lastLogId = newLogs[0].id
        
        for (const log of newLogs.reverse()) {
          const timestamp = log.createdAt.toISOString()
          const userInfo = log.user ? `${log.user.email} (${log.user.role})` : 'Unknown'
          const values = log.newValues as any
          
          console.log(`[${timestamp}] ${log.action}`)
          console.log(`  User: ${userInfo}`)
          if (values?.ipAddress) console.log(`  IP: ${values.ipAddress}`)
          if (values?.userAgent) console.log(`  Agent: ${values.userAgent.substring(0, 50)}...`)
          if (values?.reason) console.log(`  Reason: ${values.reason}`)
          console.log()
        }
      }
      
      // Check active sessions (simplified)
      const sessionCount = await prisma.session.count()
      if (sessionCount > 0) {
        process.stdout.write(`\r🟢 Active Sessions: ${sessionCount} | Last Check: ${new Date().toLocaleTimeString()}`)
      } else {
        process.stdout.write(`\r⚪ No Active Sessions | Last Check: ${new Date().toLocaleTimeString()}`)
      }
      
    } catch (error) {
      console.error('\n❌ Monitoring error:', error)
    }
  }
  
  // Start monitoring
  const interval = setInterval(monitor, 2000) // Check every 2 seconds
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    clearInterval(interval)
    console.log('\n\n🛑 Stopping authentication monitor...')
    await prisma.$disconnect()
    process.exit(0)
  })
  
  // Initial check
  await monitor()
  
  console.log('\n📊 MONITORING ACTIVE - Try logging in with different users to see events!')
  console.log('🎯 Test URLs:')
  console.log('   • Login: http://localhost:3000/login')
  console.log('   • Admin: admin@mrmobile.pk / password123')
  console.log('   • Owner: owner@mrmobile.pk / password123')
  console.log('   • Worker: worker@mrmobile.pk / password123')
  console.log()
}

monitorAuth().catch(console.error)
