import { useState, useEffect } from 'react'

export interface ShopSettings {
  // Business Information
  name: string
  location: string
  address: string
  city: string
  province: string
  postalCode: string
  phone: string
  email: string
  website: string
  gstNumber: string
  ntnNumber: string
  
  // Receipt Configuration
  receiptHeader: string
  receiptFooter: string
  showLogo: boolean
  
  // Payment Methods
  enableCash: boolean
  enableCard: boolean
  enableEasyPaisa: boolean
  enableJazzCash: boolean
  enableBankTransfer: boolean
  
  // Business Settings
  taxRate: number
  currency: string
  lowStockThreshold: number
  
  // System Preferences
  autoBackup: boolean
  emailNotifications: boolean
  smsNotifications: boolean
}

interface UseShopSettingsReturn {
  settings: ShopSettings | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useShopSettings(): UseShopSettingsReturn {
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings/shop')
      
      if (!response.ok) {
        throw new Error('Failed to fetch shop settings')
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      console.error('Error fetching shop settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      
      // Set default settings if fetch fails
      setSettings({
        name: '',
        location: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        phone: '',
        email: '',
        website: '',
        gstNumber: '',
        ntnNumber: '',
        receiptHeader: '',
        receiptFooter: '',
        showLogo: true,
        enableCash: true,
        enableCard: true,
        enableEasyPaisa: true,
        enableJazzCash: true,
        enableBankTransfer: true,
        taxRate: 0, // Default 0% - No tax unless owner configures
        currency: 'PKR',
        lowStockThreshold: 10,
        autoBackup: true,
        emailNotifications: true,
        smsNotifications: false,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  }
}
