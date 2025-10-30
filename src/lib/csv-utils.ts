/**
 * CSV Utilities for Bulk Import/Export
 * Handles user data import/export with validation
 */

// ============================================================================
// CSV PARSING & GENERATION
// ============================================================================

/**
 * Convert CSV string to array of objects
 */
export function parseCSV(csvString: string): Record<string, string>[] {
  const lines = csvString.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    const values = parseCSVLine(line)
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}`)
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    data.push(row)
  }

  return data
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current.trim())
  return result
}

/**
 * Convert array of objects to CSV string
 */
export function generateCSV(data: Record<string, any>[], columns?: string[]): string {
  if (data.length === 0) {
    return ''
  }

  // Use provided columns or extract from first object
  const headers = columns || Object.keys(data[0])
  
  // Generate header row
  const headerRow = headers.map(escapeCSVValue).join(',')
  
  // Generate data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      return escapeCSVValue(value)
    }).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)
  
  // If value contains comma, quote, or newline, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape existing quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""')
    return `"${escaped}"`
  }

  return stringValue
}

// ============================================================================
// USER CSV TEMPLATES
// ============================================================================

/**
 * Shop Owner CSV Template
 */
export const SHOP_OWNER_CSV_TEMPLATE = {
  headers: [
    'name',
    'email',
    'phone',
    'cnic',
    'address',
    'city',
    'province',
    'businessName'
  ],
  sample: [
    {
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      phone: '+92-300-1234567',
      cnic: '42101-1234567-8',
      address: 'Shop 5, Blue Area',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
      businessName: 'Khan Mobile Center'
    },
    {
      name: 'Ali Hassan',
      email: 'ali@example.com',
      phone: '+92-321-9876543',
      cnic: '42201-9876543-2',
      address: 'Plaza 3, Mall Road',
      city: 'Lahore',
      province: 'Punjab',
      businessName: 'Hassan Mobiles'
    }
  ]
}

/**
 * Worker CSV Template
 */
export const WORKER_CSV_TEMPLATE = {
  headers: [
    'name',
    'email',
    'phone',
    'cnic',
    'address',
    'city',
    'province',
    'shopId',
    'position'
  ],
  sample: [
    {
      name: 'Muhammad Ali',
      email: 'mali@example.com',
      phone: '+92-300-1111111',
      cnic: '42101-1111111-1',
      address: 'House 10, Street 5',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
      shopId: 'SHOP-CODE-HERE',
      position: 'Sales Associate'
    },
    {
      name: 'Sara Ahmed',
      email: 'sara@example.com',
      phone: '+92-321-2222222',
      cnic: '42201-2222222-2',
      address: 'Flat 3, Block B',
      city: 'Karachi',
      province: 'Sindh',
      shopId: 'SHOP-CODE-HERE',
      position: 'Technician'
    }
  ]
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export interface CSVValidationError {
  row: number
  field: string
  value: any
  error: string
}

/**
 * Validate shop owner CSV data
 */
export function validateShopOwnerCSV(data: Record<string, string>[]): {
  valid: boolean
  errors: CSVValidationError[]
  validRows: Record<string, string>[]
} {
  const errors: CSVValidationError[] = []
  const validRows: Record<string, string>[] = []

  const requiredFields = ['name', 'email', 'phone', 'cnic', 'address', 'city', 'province']
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^\+92-\d{3}-\d{7}$/
  const cnicRegex = /^\d{5}-\d{7}-\d$/

  data.forEach((row, index) => {
    const rowNum = index + 2 // +2 because index is 0-based and header is row 1
    let rowValid = true

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: rowNum,
          field,
          value: row[field],
          error: `${field} is required`
        })
        rowValid = false
      }
    })

    // Validate email format
    if (row.email && !emailRegex.test(row.email)) {
      errors.push({
        row: rowNum,
        field: 'email',
        value: row.email,
        error: 'Invalid email format'
      })
      rowValid = false
    }

    // Validate phone format
    if (row.phone && !phoneRegex.test(row.phone)) {
      errors.push({
        row: rowNum,
        field: 'phone',
        value: row.phone,
        error: 'Phone must be in format +92-XXX-XXXXXXX'
      })
      rowValid = false
    }

    // Validate CNIC format
    if (row.cnic && !cnicRegex.test(row.cnic)) {
      errors.push({
        row: rowNum,
        field: 'cnic',
        value: row.cnic,
        error: 'CNIC must be in format 12345-1234567-1'
      })
      rowValid = false
    }

    if (rowValid) {
      validRows.push(row)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    validRows
  }
}

/**
 * Validate worker CSV data
 */
export function validateWorkerCSV(data: Record<string, string>[]): {
  valid: boolean
  errors: CSVValidationError[]
  validRows: Record<string, string>[]
} {
  const errors: CSVValidationError[] = []
  const validRows: Record<string, string>[] = []

  const requiredFields = ['name', 'email', 'phone', 'cnic', 'address', 'city', 'province', 'shopId']
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^\+92-\d{3}-\d{7}$/
  const cnicRegex = /^\d{5}-\d{7}-\d$/

  data.forEach((row, index) => {
    const rowNum = index + 2 // +2 because index is 0-based and header is row 1
    let rowValid = true

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: rowNum,
          field,
          value: row[field],
          error: `${field} is required`
        })
        rowValid = false
      }
    })

    // Validate email format
    if (row.email && !emailRegex.test(row.email)) {
      errors.push({
        row: rowNum,
        field: 'email',
        value: row.email,
        error: 'Invalid email format'
      })
      rowValid = false
    }

    // Validate phone format
    if (row.phone && !phoneRegex.test(row.phone)) {
      errors.push({
        row: rowNum,
        field: 'phone',
        value: row.phone,
        error: 'Phone must be in format +92-XXX-XXXXXXX'
      })
      rowValid = false
    }

    // Validate CNIC format
    if (row.cnic && !cnicRegex.test(row.cnic)) {
      errors.push({
        row: rowNum,
        field: 'cnic',
        value: row.cnic,
        error: 'CNIC must be in format 12345-1234567-1'
      })
      rowValid = false
    }

    if (rowValid) {
      validRows.push(row)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    validRows
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Format user data for export
 */
export function formatUsersForExport(users: any[]): Record<string, any>[] {
  return users.map(user => ({
    'User ID': user.id,
    'Name': user.name,
    'Email': user.email,
    'Phone': user.phone || '',
    'CNIC': user.cnic || '',
    'Address': user.address || '',
    'City': user.city || '',
    'Province': user.province || '',
    'Business Name': user.businessName || '',
    'Role': user.role,
    'Status': user.status,
    'Created At': new Date(user.createdAt).toLocaleString(),
    'Email Verified': user.emailVerified ? 'Yes' : 'No',
    'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
  }))
}

/**
 * Format shops for export
 */
export function formatShopsForExport(shops: any[]): Record<string, any>[] {
  return shops.map(shop => ({
    'Shop ID': shop.id,
    'Shop Code': shop.code,
    'Shop Name': shop.name,
    'Owner': shop.owner?.name || '',
    'Owner Email': shop.owner?.email || '',
    'Address': shop.address,
    'City': shop.city,
    'Province': shop.province,
    'Phone': shop.phone,
    'Email': shop.email,
    'Status': shop.status,
    'Workers': shop._count?.workers || 0,
    'Created At': new Date(shop.createdAt).toLocaleString()
  }))
}

/**
 * Create a downloadable CSV file in browser
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if ((navigator as any).msSaveBlob) {
    // IE 10+
    (navigator as any).msSaveBlob(blob, filename)
  } else {
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Read CSV file from input
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const content = event.target?.result as string
      resolve(content)
    }
    
    reader.onerror = (error) => {
      reject(error)
    }
    
    reader.readAsText(file)
  })
}

