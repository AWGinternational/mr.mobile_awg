// Form validation utilities with real-time validation support

export interface FieldValidation {
  required?: boolean
  pattern?: RegExp
  minLength?: number
  maxLength?: number
  customValidator?: (value: unknown) => string | null
  formatter?: (value: string) => string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface FormErrors {
  [fieldName: string]: string[]
}

export class FormValidator {
  // Validate a single field
  static validateField(field: string, value: unknown, rules: FieldValidation): string | null {
    // Check required
    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${field} is required`
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null
    }

    const stringValue = value.toString().trim()

    // Check minimum length
    if (rules.minLength && stringValue.length < rules.minLength) {
      return `${field} must be at least ${rules.minLength} characters`
    }

    // Check maximum length
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return `${field} must be no more than ${rules.maxLength} characters`
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return `${field} format is invalid`
    }

    // Custom validation
    if (rules.customValidator) {
      const customError = rules.customValidator(value)
      if (customError) {
        return customError
      }
    }

    return null
  }

  // Validate entire form
  static validateForm(data: Record<string, unknown>, config: Record<string, FieldValidation>): FormErrors {
    const errors: FormErrors = {}

    Object.entries(config).forEach(([fieldName, rules]) => {
      const error = this.validateField(fieldName, data[fieldName], rules)
      if (error) {
        errors[fieldName] = [error]
      }
    })

    return errors
  }

  // Format phone number to Pakistani format
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digits first
    const digits = phone.replace(/\D/g, '')
    
    // Handle empty input
    if (!digits) return phone
    
    // Handle different input scenarios
    if (digits.startsWith('0')) {
      // Convert local format (0300...) to international (92300...)
      const withoutLeadingZero = digits.slice(1)
      return this.formatPhoneNumber('92' + withoutLeadingZero)
    } else if (digits.startsWith('92')) {
      // Already has country code, format it properly
      const restDigits = digits.slice(2)
      
      if (restDigits.length === 0) {
        return '+92'
      } else if (restDigits.length <= 3) {
        return `+92-${restDigits}`
      } else if (restDigits.length <= 10) {
        const areaCode = restDigits.slice(0, 3)
        const number = restDigits.slice(3)
        return `+92-${areaCode}${number ? '-' + number : ''}`
      } else {
        // Limit to 10 digits after country code
        const areaCode = restDigits.slice(0, 3)
        const number = restDigits.slice(3, 10)
        return `+92-${areaCode}-${number}`
      }
    } else if (digits.length >= 10) {
      // Assume it's a Pakistani number without country code (300...)
      return this.formatPhoneNumber('92' + digits)
    } else if (digits.length > 0) {
      // Partial number, assume Pakistani
      return this.formatPhoneNumber('92' + digits)
    }
    
    return phone
  }

  // Format CNIC to Pakistani format
  static formatCNIC(cnic: string): string {
    // Remove all non-digits
    const digits = cnic.replace(/\D/g, '')
    
    // Format: XXXXX-XXXXXXX-X
    if (digits.length >= 13) {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
    } else if (digits.length >= 5) {
      const part1 = digits.slice(0, 5)
      const part2 = digits.slice(5, 12)
      const part3 = digits.slice(12)
      
      let formatted = part1
      if (part2) formatted += `-${part2}`
      if (part3) formatted += `-${part3}`
      
      return formatted
    }
    
    return digits
  }

  // Validate Pakistani phone number
  static validatePhoneNumber(phone: string): string | null {
    const phoneRegex = /^\+92-\d{2,3}-\d{7,8}$/
    if (!phoneRegex.test(phone)) {
      return 'Phone number must be in format +92-XXX-XXXXXXX'
    }
    return null
  }

  // Validate Pakistani CNIC
  static validateCNIC(cnic: string): string | null {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
    if (!cnicRegex.test(cnic)) {
      return 'CNIC must be in format 42101-1234567-8'
    }
    return null
  }

  // Validate email
  static validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }

  // Validate Pakistani postal code
  static validatePostalCode(postalCode: string): string | null {
    const postalRegex = /^\d{5}$/
    if (!postalRegex.test(postalCode)) {
      return 'Postal code must be 5 digits'
    }
    return null
  }

  // Get validation rules for common fields
  static getCommonValidationRules() {
    return {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z\s]+$/
      } as FieldValidation,
      
      email: {
        required: true,
        customValidator: (value: string) => this.validateEmail(value),
        formatter: (value: string) => value.toLowerCase().trim()
      } as FieldValidation,
      
      phone: {
        required: true,
        customValidator: (value: string) => this.validatePhoneNumber(value),
        formatter: (value: string) => this.formatPhoneNumber(value)
      } as FieldValidation,
      
      cnic: {
        required: true,
        customValidator: (value: string) => this.validateCNIC(value),
        formatter: (value: string) => this.formatCNIC(value)
      } as FieldValidation,
      
      postalCode: {
        required: true,
        customValidator: (value: string) => this.validatePostalCode(value)
      } as FieldValidation,
      
      address: {
        required: true,
        minLength: 10,
        maxLength: 500
      } as FieldValidation,
      
      city: {
        required: true,
        minLength: 2,
        maxLength: 50
      } as FieldValidation,
      
      province: {
        required: true,
        minLength: 2,
        maxLength: 50
      } as FieldValidation
    }
  }
}

// Hook for real-time form validation
export function useFormValidation<T extends Record<string, unknown>>(
  initialData: T,
  validationRules: Record<keyof T, FieldValidation>
) {
  const [data, setData] = React.useState<T>(initialData)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  // Validate single field
  const validateField = React.useCallback((fieldName: keyof T, value: unknown) => {
    const rules = validationRules[fieldName]
    if (!rules) return null

    return FormValidator.validateField(fieldName as string, value, rules)
  }, [validationRules])

  // Update field value with validation
  const updateField = React.useCallback((fieldName: keyof T, value: unknown) => {
    // Apply formatter if available
    const rules = validationRules[fieldName]
    const formattedValue = rules?.formatter && typeof value === 'string' ? rules.formatter(value) : value

    // Update data
    setData(prev => ({ ...prev, [fieldName]: formattedValue }))

    // Validate if field has been touched
    if (touched[fieldName]) {
      const error = validateField(fieldName, formattedValue)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error ? [error] : []
      }))
    }
  }, [validateField, validationRules, touched])

  // Mark field as touched
  const touchField = React.useCallback((fieldName: keyof T) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    // Validate the field
    const error = validateField(fieldName, data[fieldName])
    setErrors(prev => ({
      ...prev,
      [fieldName]: error ? [error] : []
    }))
  }, [validateField, data])

  // Validate all fields
  const validateAll = React.useCallback(() => {
    const allErrors = FormValidator.validateForm(data, validationRules)
    setErrors(allErrors)
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<keyof T, boolean>))
    
    return Object.keys(allErrors).length === 0
  }, [data, validationRules])

  // Check if form is valid
  const isValid = React.useMemo(() => {
    return Object.values(errors).every(fieldErrors => fieldErrors.length === 0)
  }, [errors])

  // Check if form has been modified
  const isDirty = React.useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(initialData)
  }, [data, initialData])

  return {
    data,
    errors,
    touched,
    isValid,
    isDirty,
    updateField,
    touchField,
    validateAll,
    setData,
    setErrors
  }
}

// Import React for the hook
import React from 'react'