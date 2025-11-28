'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { useSession } from 'next-auth/react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { 
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Building,
  Save,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface AccountSettings {
  name: string
  phone: string
  address: string
  city: string
  province: string
  businessName: string | null
  email: string
}

const pakistaniProvinces = [
  'Punjab',
  'Sindh',
  'KPK (Khyber Pakhtunkhwa)',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir'
]

const pakistaniCities = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Mardan', 'Kasur', 'Rahim Yar Khan', 'Sahiwal', 'Okara'
]

export default function AccountSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: session, update: updateSession } = useSession()
  const { success, error } = useNotify()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [settings, setSettings] = useState<AccountSettings>({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    businessName: null,
    email: ''
  })

  useEffect(() => {
    if (user) {
      fetchAccountData()
    }
  }, [user])

  const fetchAccountData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${user?.id}`)
      
      if (response.ok) {
        const result = await response.json()
        const userData = result.user
        
        setSettings({
          name: userData.name || '',
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          province: userData.province || '',
          businessName: userData.businessName || null,
          email: userData.email || ''
        })
      } else {
        error('Failed to load account information')
      }
    } catch (err) {
      console.error('Error fetching account data:', err)
      error('Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AccountSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear message when user starts typing
    if (message) {
      setMessage(null)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // Validate required fields first
      if (!settings.name || !settings.name.trim()) {
        setMessage({ type: 'error', text: 'Name is required' })
        error('Name is required')
        setSaving(false)
        return
      }

      // Validate name format (only letters and spaces)
      const nameRegex = /^[a-zA-Z\s]+$/
      if (!nameRegex.test(settings.name.trim())) {
        setMessage({ type: 'error', text: 'Name can only contain letters and spaces' })
        error('Name can only contain letters and spaces')
        setSaving(false)
        return
      }

      // Validate phone format if provided
      if (settings.phone && settings.phone.trim()) {
        const phoneRegex = /^\+92-\d{2,3}-\d{7,8}$/
        if (!phoneRegex.test(settings.phone.trim())) {
          setMessage({ type: 'error', text: 'Phone number must be in format +92-XXX-XXXXXXX (e.g., +92-300-1234567)' })
          error('Phone number must be in format +92-XXX-XXXXXXX')
          setSaving(false)
          return
        }
      }

      // Validate address if provided (must be at least 10 characters)
      if (settings.address && settings.address.trim()) {
        if (settings.address.trim().length < 10) {
          setMessage({ type: 'error', text: 'Address must be at least 10 characters long' })
          error('Address must be at least 10 characters long')
          setSaving(false)
          return
        }
      }

      // Prepare data - only include fields with values, convert empty strings to undefined
      const updateData: any = {}
      
      if (settings.name && settings.name.trim()) {
        updateData.name = settings.name.trim()
      }
      
      if (settings.phone && settings.phone.trim()) {
        updateData.phone = settings.phone.trim()
      }
      
      // Address is optional but if provided, must be at least 10 characters
      if (settings.address && settings.address.trim() && settings.address.trim().length >= 10) {
        updateData.address = settings.address.trim()
      }
      
      // City and province are optional but if provided, must be at least 2 characters
      if (settings.city && settings.city.trim() && settings.city.trim().length >= 2) {
        updateData.city = settings.city.trim()
      }
      
      if (settings.province && settings.province.trim() && settings.province.trim().length >= 2) {
        updateData.province = settings.province.trim()
      }
      
      if (settings.businessName && settings.businessName.trim()) {
        updateData.businessName = settings.businessName.trim()
      } else if (settings.businessName === '') {
        updateData.businessName = null
      }

      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Account settings updated successfully!' })
        success('Account settings updated successfully!')
        
        // Refresh user data
        fetchAccountData()
        
        // Update NextAuth session to reflect changes in avatar/header
        try {
          if (updateSession && typeof updateSession === 'function') {
            await updateSession({
              name: result.user?.name || settings.name,
              phone: result.user?.phone || settings.phone,
            })
          } else {
            // Fallback: use router refresh to update the page without full reload
            router.refresh()
          }
        } catch (updateError) {
          console.error('Failed to update session:', updateError)
          // Fallback: use router refresh to update the page without full reload
          router.refresh()
        }
      } else {
        // Handle validation errors
        let errorMsg = result.error || result.message || 'Failed to update account settings'
        
        // If there are field-specific errors, show them
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const fieldErrors = result.errors.map((err: any) => {
            if (typeof err === 'string') return err
            return err.message || `${err.field}: ${err.message || 'Invalid value'}`
          }).join(', ')
          errorMsg = `Validation failed: ${fieldErrors}`
        }
        
        setMessage({ type: 'error', text: errorMsg })
        error(errorMsg)
      }
    } catch (err) {
      console.error('Error saving account settings:', err)
      const errorMsg = 'Failed to save account settings'
      setMessage({ type: 'error', text: errorMsg })
      error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SHOP_WORKER, UserRole.SUPER_ADMIN]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button 
                    onClick={handleBack} 
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl transition-all duration-200 flex-shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </button>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Account Settings</h1>
                    <p className="text-blue-100 text-xs sm:text-sm lg:text-base">
                      Manage your personal information and preferences
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading account information...</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                  {/* Message Alert */}
                  {message && (
                    <Card className={`${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {message.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          )}
                          <p className={`text-sm sm:text-base ${message.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                            {message.text}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Personal Information */}
                  <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="p-3 sm:p-4 lg:p-6">
                      <CardTitle className="flex items-center gap-2 dark:text-white text-base sm:text-lg">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Personal Information
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 text-xs sm:text-sm mt-1">
                        Update your personal details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                      {/* Email (Read-only) */}
                      <div>
                        <Label htmlFor="email" className="dark:text-gray-300 text-xs sm:text-sm">
                          Email Address
                        </Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            id="email"
                            type="email"
                            value={settings.email}
                            disabled
                            className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 text-sm sm:text-base h-9 sm:h-10"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          Email cannot be changed. Contact administrator for email updates.
                        </p>
                      </div>

                      {/* Name */}
                      <div>
                        <Label htmlFor="name" className="dark:text-gray-300 text-xs sm:text-sm">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-1.5">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            id="name"
                            type="text"
                            value={settings.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter your full name"
                            className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 text-sm sm:text-base h-9 sm:h-10"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <Label htmlFor="phone" className="dark:text-gray-300 text-xs sm:text-sm">
                          Phone Number
                        </Label>
                        <div className="relative mt-1.5">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            id="phone"
                            type="tel"
                            value={settings.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+92-300-1234567"
                            className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 text-sm sm:text-base h-9 sm:h-10"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          Format: +92-XXX-XXXXXXX (e.g., +92-300-1234567). Leave empty if not needed.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="p-3 sm:p-4 lg:p-6">
                      <CardTitle className="flex items-center gap-2 dark:text-white text-base sm:text-lg">
                        <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Address Information
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 text-xs sm:text-sm mt-1">
                        Update your address details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                      {/* Address */}
                      <div>
                        <Label htmlFor="address" className="dark:text-gray-300 text-xs sm:text-sm">
                          Street Address
                        </Label>
                        <div className="relative mt-1.5">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Textarea
                            id="address"
                            value={settings.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Enter your street address"
                            className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 text-sm sm:text-base min-h-[80px] resize-none"
                          />
                        </div>
                      </div>

                      {/* City */}
                      <div>
                        <Label htmlFor="city" className="dark:text-gray-300 text-xs sm:text-sm">
                          City
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          value={settings.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Enter your city"
                          list="cities"
                          className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 text-sm sm:text-base h-9 sm:h-10"
                        />
                        <datalist id="cities">
                          {pakistaniCities.map(city => (
                            <option key={city} value={city} />
                          ))}
                        </datalist>
                      </div>

                      {/* Province */}
                      <div>
                        <Label htmlFor="province" className="dark:text-gray-300 text-xs sm:text-sm">
                          Province
                        </Label>
                        <Input
                          id="province"
                          type="text"
                          value={settings.province}
                          onChange={(e) => handleInputChange('province', e.target.value)}
                          placeholder="Enter your province"
                          list="provinces"
                          className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 text-sm sm:text-base h-9 sm:h-10"
                        />
                        <datalist id="provinces">
                          {pakistaniProvinces.map(province => (
                            <option key={province} value={province} />
                          ))}
                        </datalist>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Information (for Shop Owners) */}
                  {user?.role === UserRole.SHOP_OWNER && (
                    <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader className="p-3 sm:p-4 lg:p-6">
                        <CardTitle className="flex items-center gap-2 dark:text-white text-base sm:text-lg">
                          <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          Business Information
                        </CardTitle>
                        <CardDescription className="dark:text-gray-400 text-xs sm:text-sm mt-1">
                          Update your business details
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                        <div>
                          <Label htmlFor="businessName" className="dark:text-gray-300 text-xs sm:text-sm">
                            Business Name
                          </Label>
                          <div className="relative mt-1.5">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              id="businessName"
                              type="text"
                              value={settings.businessName || ''}
                              onChange={(e) => handleInputChange('businessName', e.target.value)}
                              placeholder="Enter your business name"
                              className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 text-sm sm:text-base h-9 sm:h-10"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-4 sm:pt-6 border-t dark:border-gray-700">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full sm:w-auto text-sm sm:text-base"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">Save Changes</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

