const fs = require('fs')
const path = require('path')

// Read the corrected CSV file
const csvPath = path.join(__dirname, '../public/corrected-import.csv')
const csvContent = fs.readFileSync(csvPath, 'utf8')

console.log('📄 Corrected CSV content:')
console.log(csvContent)
console.log('')

// Parse and validate the data
const lines = csvContent.trim().split('\n')
const headers = lines[0].split(',')
const dataRows = lines.slice(1)

console.log('📋 Headers:', headers)
console.log('📊 Data rows:', dataRows.length)
console.log('')

dataRows.forEach((row, index) => {
  const values = row.split(',')
  const product = {}
  
  headers.forEach((header, i) => {
    product[header.trim()] = values[i]?.trim() || ''
  })
  
  console.log(`📱 Product ${index + 1}:`)
  console.log(`   Name: "${product.name}"`)
  console.log(`   Type: "${product.type}"`)
  console.log(`   Category: "${product.category}"`)
  console.log(`   Brand: "${product.brand}"`)
  console.log(`   Stock: "${product.stock}"`)
  console.log('')
})

console.log('✅ CSV validation complete!')
console.log('')
console.log('🔧 To fix your import issue:')
console.log('1. Use the corrected-import.csv file instead of your current file')
console.log('2. Or manually fix your CSV by changing:')
console.log('   - "MOBILE_F" → "MOBILE_PHONE"')
console.log('   - "Smartphoi" → "Smartphones"')
console.log('   - Make sure all field values are complete and not truncated')
