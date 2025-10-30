#!/usr/bin/env tsx
// Comprehensive System Audit Script
import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function comprehensiveAudit() {
  console.log('🔍 COMPREHENSIVE SYSTEM AUDIT REPORT')
  console.log('═'.repeat(60))
  
  try {
    // Database Audit
    console.log('\n📊 DATABASE AUDIT:')
    
    const users = await prisma.user.findMany()
    const shops = await prisma.shop.findMany()
    const products = await prisma.product.findMany()
    const categories = await prisma.category.findMany()
    const brands = await prisma.brand.findMany()
    const inventory = await prisma.inventoryItem.findMany()
    const customers = await prisma.customer.findMany()
    const sales = await prisma.sale.findMany()
    
    console.log(`✅ Users: ${users.length}`)
    console.log(`✅ Shops: ${shops.length}`)
    console.log(`✅ Products: ${products.length}`)
    console.log(`✅ Categories: ${categories.length}`)
    console.log(`✅ Brands: ${brands.length}`)
    console.log(`✅ Inventory Items: ${inventory.length}`)
    console.log(`✅ Customers: ${customers.length}`)
    console.log(`✅ Sales: ${sales.length}`)
    
    // API Audit
    console.log('\n🔌 API AUDIT:')
    const apiPath = './src/app/api'
    const apiRoutes = []
    
    function scanDirectory(dir: string, prefix = '') {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, `${prefix}/${item}`)
        } else if (item === 'route.ts') {
          apiRoutes.push(`${prefix}`)
        }
      }
    }
    
    scanDirectory(apiPath)
    
    console.log(`✅ API Routes Found: ${apiRoutes.length}`)
    apiRoutes.forEach(route => console.log(`  - ${route}`))
    
    // Component Audit
    console.log('\n🧩 COMPONENT AUDIT:')
    const componentPath = './src/components'
    const componentCount = countFilesRecursively(componentPath, '.tsx')
    console.log(`✅ Components: ${componentCount}`)
    
    // Page Audit
    console.log('\n📄 PAGE AUDIT:')
    const appPath = './src/app'
    const pageFiles = findFiles(appPath, 'page.tsx')
    console.log(`✅ Pages: ${pageFiles.length}`)
    pageFiles.forEach(page => console.log(`  - ${page}`))
    
    // Business Module Coverage
    console.log('\n📋 BUSINESS MODULE COVERAGE:')
    const requiredModules = [
      'POS System',
      'Supplier Management', 
      'Product Management',
      'Category Management',
      'Inventory Management',
      'Sales Management',
      'Payment Integration',
      'Daily Closing Module',
      'Loan Module'
    ]
    
    const implementedModules = []
    
    // Check for POS
    if (fs.existsSync('./src/app/pos')) implementedModules.push('POS System')
    
    // Check for Products
    if (fs.existsSync('./src/app/api/products')) implementedModules.push('Product Management')
    
    // Check for Inventory
    if (fs.existsSync('./src/app/api/inventory')) implementedModules.push('Inventory Management')
    
    // Check for Sales
    if (fs.existsSync('./src/app/api/sales')) implementedModules.push('Sales Management')
    
    console.log(`✅ Implemented: ${implementedModules.length}/${requiredModules.length}`)
    implementedModules.forEach(module => console.log(`  ✅ ${module}`))
    
    const missingModules = requiredModules.filter(m => !implementedModules.includes(m))
    missingModules.forEach(module => console.log(`  ❌ ${module}`))
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function countFilesRecursively(dir: string, extension: string): number {
  if (!fs.existsSync(dir)) return 0
  
  let count = 0
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      count += countFilesRecursively(fullPath, extension)
    } else if (item.endsWith(extension)) {
      count++
    }
  }
  
  return count
}

function findFiles(dir: string, fileName: string): string[] {
  if (!fs.existsSync(dir)) return []
  
  const results: string[] = []
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      results.push(...findFiles(fullPath, fileName))
    } else if (item === fileName) {
      results.push(fullPath.replace('./src/app/', '/'))
    }
  }
  
  return results
}

comprehensiveAudit()
