/**
 * Secure password generation utilities
 */

export interface PasswordOptions {
  length?: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSymbols?: boolean
  excludeSimilar?: boolean
}

export interface PasswordStrength {
  score: number // 0-4 (weak to very strong)
  feedback: string[]
  isStrong: boolean
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(options: PasswordOptions = {}): string {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true
  } = options

  let charset = ''
  
  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  }
  
  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }
  
  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789'
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }

  if (charset === '') {
    throw new Error('At least one character type must be included')
  }

  let password = ''
  
  // Use crypto.getRandomValues for secure random generation
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }

  return password
}

/**
 * Generate a temporary password for new users
 */
export function generateTempPassword(): string {
  return generateSecurePassword({
    length: 8,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false, // Avoid symbols for easier typing
    excludeSimilar: true
  })
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length < 6) {
    feedback.push('Password should be at least 6 characters long')
  } else if (password.length >= 8) {
    score += 1
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Additional checks
  if (password.length >= 12) score += 1

  // Common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters')
    score = Math.max(0, score - 1)
  }

  if (/123|abc|qwe/i.test(password)) {
    feedback.push('Avoid common sequences')
    score = Math.max(0, score - 1)
  }

  // Generate feedback based on score
  if (score === 0) {
    feedback.unshift('Very weak password')
  } else if (score === 1) {
    feedback.unshift('Weak password')
  } else if (score === 2) {
    feedback.unshift('Fair password')
  } else if (score === 3) {
    feedback.unshift('Good password')
  } else if (score >= 4) {
    feedback.unshift('Strong password')
  }

  // Suggestions for improvement
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters')
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters')
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers')
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special characters')
  }

  return {
    score: Math.min(4, score),
    feedback,
    isStrong: score >= 3
  }
}

/**
 * Password requirements for the system
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSymbols: false,
  maxLength: 100
}

/**
 * Validate password against system requirements
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`)
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters long`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (PASSWORD_REQUIREMENTS.requireSymbols && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}