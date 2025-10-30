"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { FormValidator } from '@/utils/form-validation'
import { CredentialDisplay } from '@/components/ui/credential-display'
import { generateTempPassword, checkPasswordStrength } from '@/utils/password-generator'
import { LoadingOverlay, FormLoadingState, ButtonLoadingState, DataLoadingState } from '@/components/ui/loading-overlay'
import { FormFieldLock, OptimisticUpdate } from '@/components/ui/form-progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Dialog components replaced with simple modal
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Store,
  Plus,
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Settings,
  Eye,
  Edit3,
  Key,
  Save,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  X,
  CheckSquare,
  Square,
  UserCog,
  History,
  Shield,
  LogOut,
  ArrowLeft
} from 'lucide-react'
import { ValidatedInput } from '@/components/ui/validated-input'
import { ValidatedSelect } from '@/components/ui/validated-select'
import { EditUserDialog } from './EditUserDialog'
import { UserStatusToggle } from './UserStatusToggle'
import { PasswordResetDialog } from './PasswordResetDialog'
import { RoleChangeDialog } from './RoleChangeDialog'
import { UserAuditLogDialog } from './UserAuditLogDialog'
import { WorkerPermissionsDialog } from './WorkerPermissionsDialog'
import { formatUserRole } from '@/utils/user-formatting'
import { ShopStatus } from '@/types'

// Types
interface Shop {
  id: string
  name: string
  address: string
  city: string
  province: string
  postalCode: string
  phone: string
  email: string
  licenseNumber?: string
  gstNumber?: string
  ownerId: string
  ownerName: string
  status: ShopStatus
  createdAt: string
  updatedAt: string
  settings?: {
    currency: string
    timezone: string
    gstRate: number
    maxWorkers: number
    businessHours: {
      open: string
      close: string
      days: string[]
    }
  }
}

interface ShopStats {
  totalSales: number
  todaySales: number
  totalProducts: number
  totalWorkers: number
  lowStockItems: number
  pendingOrders: number
}

interface ShopFormData {
  name: string
  address: string
  city: string
  province: string
  postalCode: string
  phone: string
  email: string
  licenseNumber: string
  gstNumber: string
  ownerId: string
  settings?: {
    currency: string
    timezone: string
    gstRate: number
    maxWorkers: number
    businessHours: {
      open: string
      close: string
      days: string[]
    }
  }
}

// Shop Owner Interface
interface ShopOwner {
  id: string
  name: string
  email: string
  phone: string
  cnic: string
  address: string
  city: string
  province: string
  businessName?: string
  status: string
  createdAt: string
}

// Shop Owner Creation Interface - Matches Prisma Schema
interface ShopOwnerFormData {
  name: string
  email: string
  phone: string
  cnic: string
  address: string
  city: string
  province: string
  businessName?: string  // Optional field
  password: string
}

// Worker Creation Interface
interface WorkerFormData {
  name: string
  email: string
  phone: string
  cnic: string
  address: string
  city: string
  province: string
  shopId: string
  position: string
  password: string
}

// Textarea component
const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    {...props}
  />
)

// Delete Confirmation Dialog Component
interface DeleteConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  itemType: 'user' | 'shop' | 'worker'
  itemName: string
  itemRole?: string
  warningMessage?: string
  loading?: boolean
}

function DeleteConfirmationDialog({ 
  open, 
  onClose, 
  onConfirm, 
  itemType, 
  itemName, 
  itemRole,
  warningMessage,
  loading = false 
}: DeleteConfirmationDialogProps) {
  if (!open) return null

  const getItemIcon = () => {
    switch (itemType) {
      case 'user':
      case 'worker':
        return <Users className="h-6 w-6 text-red-600" />
      case 'shop':
        return <Store className="h-6 w-6 text-red-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />
    }
  }

  const getActionText = () => {
    switch (itemType) {
      case 'user':
      case 'worker':
        return 'deactivate'
      case 'shop':
        return 'deactivate'
      default:
        return 'delete'
    }
  }

  const getTitle = () => {
    switch (itemType) {
      case 'user':
        return 'Deactivate User'
      case 'worker':
        return 'Deactivate Worker'
      case 'shop':
        return 'Deactivate Shop'
      default:
        return 'Delete Item'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              {getItemIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Item Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {getItemIcon()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{itemName}</p>
                {itemRole && (
                  <p className="text-sm text-gray-600">{itemRole}</p>
                )}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {warningMessage && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">Warning</p>
                  <p className="text-sm text-yellow-700 mt-1">{warningMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Text */}
          <div className="text-center">
            <p className="text-gray-700">
              Are you sure you want to <strong>{getActionText()}</strong> <strong>{itemName}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {itemType === 'user' || itemType === 'worker' 
                ? 'The user will be deactivated and cannot login to the system.'
                : 'The shop will be deactivated and all related data will be preserved.'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {getActionText().charAt(0).toUpperCase() + getActionText().slice(1)}ing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {getActionText().charAt(0).toUpperCase() + getActionText().slice(1)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Shop Owner Creation Dialog Component
interface CreateShopOwnerDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (newOwner: any) => void
}

function CreateShopOwnerDialog({ open, onClose, onSuccess }: CreateShopOwnerDialogProps) {
  const [formData, setFormData] = useState<ShopOwnerFormData>({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    address: '',
    city: '',
    province: '',
    businessName: '',
    password: generateTempPassword()
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pakistaniProvinces = [
    'Punjab',
    'Sindh',
    'KPK (Khyber Pakhtunkhwa)',
    'Balochistan',
    'Islamabad Capital Territory'
  ]

  const pakistaniCities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'
  ]

  const resetOwnerForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cnic: '',
      address: '',
      city: '',
      province: '',
      businessName: '',
      password: generateTempPassword()
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/users/shop-owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.details && Array.isArray(error.details)) {
          const fieldErrors: Record<string, string> = {}
          error.details.forEach((detail: any) => {
            fieldErrors[detail.path[0]] = detail.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: error.error || 'Failed to create shop owner' })
        }
        return
      }

      const newOwner = await response.json()
      resetOwnerForm()
      onSuccess({ ...newOwner, password: formData.password })
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to create shop owner' })
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-[700px] w-full max-h-[85vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-green-600" />
                Create New Shop Owner
              </h3>
              <p className="text-sm text-gray-600 mt-1">Add a new shop owner to the system. They will receive login credentials to manage their shops.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <FormLoadingState isLoading={loading} message="Creating shop owner...">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Personal Information</h4>

              <FormFieldLock isLocked={loading} lockMessage="Creating shop owner...">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner-name">Full Name *</Label>
                    <Input
                      id="owner-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ahmed Ali Khan"
                      disabled={loading}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="owner-email">Email Address *</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ahmed@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner-phone">Phone Number *</Label>
                  <Input
                    id="owner-phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = FormValidator.formatPhoneNumber(e.target.value)
                      setFormData(prev => ({ ...prev, phone: formatted }))
                    }}
                    placeholder="+92-300-1234567"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">Format: +92-XXX-XXXXXXX (auto-formatted)</p>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner-cnic">CNIC Number *</Label>
                  <Input
                    id="owner-cnic"
                    value={formData.cnic}
                    onChange={(e) => {
                      const formatted = FormValidator.formatCNIC(e.target.value)
                      setFormData(prev => ({ ...prev, cnic: formatted }))
                    }}
                    placeholder="42101-1234567-8"
                    maxLength={15}
                    className={errors.cnic ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">Format: 42101-1234567-8 (auto-formatted)</p>
                  {errors.cnic && <p className="text-sm text-red-500">{errors.cnic}</p>}
                </div>
              </div>
              </FormFieldLock>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Business Information</h4>

              <div className="space-y-2">
                <Label htmlFor="owner-business-name">Business Name</Label>
                <Input
                  id="owner-business-name"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Khan Mobile Center"
                  className={errors.businessName ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500">Optional: Your mobile shop business name</p>
                {errors.businessName && <p className="text-sm text-red-500">{errors.businessName}</p>}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Address Information</h4>

              <div className="space-y-2">
                <Label htmlFor="owner-address">Complete Address *</Label>
                <Textarea
                  id="owner-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="House/Shop # XX, Street Name, Area"
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner-city">City *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {pakistaniCities
                        .filter(city => city && city.trim() !== '')
                        .map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner-province">Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
                  >
                    <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {pakistaniProvinces
                        .filter(province => province && province.trim() !== '')
                        .map(province => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Login Credentials</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="owner-password">Temporary Password</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPassword = generateTempPassword()
                      setFormData(prev => ({ ...prev, password: newPassword }))
                    }}
                    className="text-xs"
                  >
                    Generate Secure
                  </Button>
                </div>
                <Input
                  id="owner-password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="temp123"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    {(() => {
                      const strength = checkPasswordStrength(formData.password)
                      const colors = {
                        0: 'bg-red-500',
                        1: 'bg-orange-500',
                        2: 'bg-yellow-500',
                        3: 'bg-blue-500',
                        4: 'bg-green-500'
                      }
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${colors[strength.score as keyof typeof colors]}`}
                                style={{ width: `${(strength.score / 4) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{strength.feedback[0]}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Shop owner will use this password to login initially. They can change it later.
                </p>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
            </div>

            <div className="flex gap-4 pt-8 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  resetOwnerForm()
                  onClose()
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <ButtonLoadingState
                type="submit"
                isLoading={loading}
                loadingText="Creating Owner..."
                variant="primary"
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700"
              >
                <Users className="h-4 w-4" />
                Create Shop Owner
              </ButtonLoadingState>
            </div>
          </form>
        </FormLoadingState>
      </div>
    </div>
  )
}

// Shop Creation Dialog Component
interface CreateShopDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (newShop: any) => void
  shopOwners: ShopOwner[]
}

function CreateShopDialog({ open, onClose, onSuccess, shopOwners }: CreateShopDialogProps) {
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    licenseNumber: '',
    gstNumber: '',
    ownerId: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pakistaniProvinces = [
    'Punjab',
    'Sindh',
    'KPK (Khyber Pakhtunkhwa)',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu and Kashmir'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const shopData = {
        ...formData,
        settings: {
          currency: 'PKR',
          timezone: 'Asia/Karachi',
          gstRate: 17,
          maxWorkers: 5,
          businessHours: {
            open: '09:00',
            close: '21:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          }
        }
      }

      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onSuccess(data.shop)
        setFormData({
          name: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          phone: '',
          email: '',
          licenseNumber: '',
          gstNumber: '',
          ownerId: ''
        })
      } else {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setErrors({ general: data.message || 'Failed to create shop' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ShopFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6 text-blue-600" />
                Create New Shop
              </h3>
              <p className="text-sm text-gray-600 mt-1">Add a new mobile shop to the system</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <FormLoadingState isLoading={loading}>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {errors.general && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-md shadow-sm">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errors.general}
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Enter the basic details for the shop</p>
                </div>

                <FormFieldLock isLocked={loading} lockMessage="Creating shop...">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ValidatedInput
                      label="Shop Name"
                      value={formData.name}
                      onValueChange={(value) => handleInputChange('name', value)}
                      error={errors.name ? [errors.name] : undefined}
                      required
                      placeholder="Enter shop name"
                      loading={loading}
                    />

                    <ValidatedSelect
                      label="Shop Owner"
                      value={formData.ownerId}
                      onValueChange={(value) => handleInputChange('ownerId', value)}
                      error={errors.ownerId ? [errors.ownerId] : undefined}
                      required
                      placeholder="Select shop owner"
                      loading={loading}
                      options={shopOwners
                        .filter(owner => owner.id && owner.id.trim() !== '')
                        .map(owner => ({
                          value: owner.id,
                          label: `${owner.name} (${owner.email})`
                        }))}
                    />
                  </div>
                </FormFieldLock>

                <ValidatedInput
                  label="Address"
                  value={formData.address}
                  onValueChange={(value) => handleInputChange('address', value)}
                  error={errors.address ? [errors.address] : undefined}
                  required
                  placeholder="Enter complete address"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ValidatedInput
                    label="City"
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                    error={errors.city ? [errors.city] : undefined}
                    required
                    placeholder="Enter city"
                  />

                  <ValidatedSelect
                    label="Province"
                    value={formData.province}
                    onValueChange={(value) => handleInputChange('province', value)}
                    error={errors.province ? [errors.province] : undefined}
                    required
                    placeholder="Select province"
                    options={pakistaniProvinces
                      .filter(province => province && province.trim() !== '')
                      .map(province => ({
                        value: province,
                        label: province
                      }))}
                  />

                  <ValidatedInput
                    label="Postal Code"
                    value={formData.postalCode}
                    onValueChange={(value) => handleInputChange('postalCode', value)}
                    error={errors.postalCode ? [errors.postalCode] : undefined}
                    required
                    placeholder="12345"
                    maxLength={5}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    Contact Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Provide contact details for the shop</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Phone Number"
                    value={formData.phone}
                    onValueChange={(value) => handleInputChange('phone', value)}
                    error={errors.phone ? [errors.phone] : undefined}
                    required
                    placeholder="+92-300-1234567"
                    helpText="Format: +92-XXX-XXXXXXX"
                  />

                  <ValidatedInput
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onValueChange={(value) => handleInputChange('email', value)}
                    error={errors.email ? [errors.email] : undefined}
                    required
                    placeholder="shop@example.com"
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">3</span>
                    </div>
                    Business Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Optional business registration details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    label="License Number"
                    value={formData.licenseNumber}
                    onValueChange={(value) => handleInputChange('licenseNumber', value)}
                    error={errors.licenseNumber ? [errors.licenseNumber] : undefined}
                    placeholder="Business license number (optional)"
                  />

                  <ValidatedInput
                    label="GST Number"
                    value={formData.gstNumber}
                    onValueChange={(value) => handleInputChange('gstNumber', value)}
                    error={errors.gstNumber ? [errors.gstNumber] : undefined}
                    placeholder="GST registration number (optional)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <ButtonLoadingState
                  type="submit"
                  isLoading={loading}
                  loadingText="Creating Shop..."
                  variant="primary"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Store className="h-4 w-4" />
                  Create Shop
                </ButtonLoadingState>
              </div>
            </form>
          </div>
        </FormLoadingState>
      </div>
    </div>
  )
}

// Worker Creation Dialog Component
interface CreateWorkerDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (newWorker: any) => void
  shops: Shop[]
}

function CreateWorkerDialog({ open, onClose, onSuccess, shops }: CreateWorkerDialogProps) {
  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    address: '',
    city: '',
    province: '',
    shopId: '',
    position: 'Shop Worker',
    password: generateTempPassword()
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pakistaniProvinces = [
    'Punjab',
    'Sindh',
    'KPK (Khyber Pakhtunkhwa)',
    'Balochistan',
    'Islamabad Capital Territory'
  ]

  const pakistaniCities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'
  ]

  const resetWorkerForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cnic: '',
      address: '',
      city: '',
      province: '',
      shopId: '',
      position: 'Shop Worker',
      password: generateTempPassword()
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/users/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.details && Array.isArray(error.details)) {
          const fieldErrors: Record<string, string> = {}
          error.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: error.error || 'Failed to create worker' })
        }
        return
      }

      const newWorker = await response.json()
      resetWorkerForm()
      onSuccess({ ...newWorker, password: formData.password })
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to create worker' })
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-[700px] w-full max-h-[85vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-purple-600" />
                Create New Worker
              </h3>
              <p className="text-sm text-gray-600 mt-1">Add a new worker to a shop. They will receive login credentials to access the system.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <FormLoadingState isLoading={loading} message="Creating worker...">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Shop Assignment */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Shop Assignment</h4>

              <div className="space-y-2">
                <Label htmlFor="worker-shop">Assign to Shop *</Label>
                <Select
                  value={formData.shopId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shopId: value }))}
                >
                    <SelectTrigger className={errors.shopId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select shop" />
                    </SelectTrigger>
                  <SelectContent>
                    {shops
                      .filter(shop => shop.id && shop.id.trim() !== '')
                      .map(shop => (
                        <SelectItem key={shop.id} value={shop.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{shop.name}</span>
                            <span className="text-xs text-gray-500">{shop.city} • Owner: {shop.ownerName}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.shopId && <p className="text-sm text-red-500">{errors.shopId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="worker-position">Position</Label>
                <Input
                  id="worker-position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Shop Worker"
                  className={errors.position ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500">Job title or role (e.g., Sales Associate, Technician)</p>
                {errors.position && <p className="text-sm text-red-500">{errors.position}</p>}
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Personal Information</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-name">Full Name *</Label>
                  <Input
                    id="worker-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Muhammad Ali"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worker-email">Email Address *</Label>
                  <Input
                    id="worker-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ali@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-phone">Phone Number *</Label>
                  <Input
                    id="worker-phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = FormValidator.formatPhoneNumber(e.target.value)
                      setFormData(prev => ({ ...prev, phone: formatted }))
                    }}
                    placeholder="+92-300-1234567"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">Format: +92-XXX-XXXXXXX (auto-formatted)</p>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worker-cnic">CNIC Number *</Label>
                  <Input
                    id="worker-cnic"
                    value={formData.cnic}
                    onChange={(e) => {
                      const formatted = FormValidator.formatCNIC(e.target.value)
                      setFormData(prev => ({ ...prev, cnic: formatted }))
                    }}
                    placeholder="42101-1234567-8"
                    maxLength={15}
                    className={errors.cnic ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">Format: 42101-1234567-8 (auto-formatted)</p>
                  {errors.cnic && <p className="text-sm text-red-500">{errors.cnic}</p>}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Address Information</h4>

              <div className="space-y-2">
                <Label htmlFor="worker-address">Complete Address *</Label>
                <Textarea
                  id="worker-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="House # XX, Street Name, Area"
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-city">City *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {pakistaniCities
                        .filter(city => city && city.trim() !== '')
                        .map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worker-province">Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
                  >
                    <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {pakistaniProvinces
                        .filter(province => province && province.trim() !== '')
                        .map(province => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Login Credentials</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="worker-password">Temporary Password</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPassword = generateTempPassword()
                      setFormData(prev => ({ ...prev, password: newPassword }))
                    }}
                    className="text-xs"
                  >
                    Generate Secure
                  </Button>
                </div>
                <Input
                  id="worker-password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="temp123"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    {(() => {
                      const strength = checkPasswordStrength(formData.password)
                      const colors = {
                        0: 'bg-red-500',
                        1: 'bg-orange-500',
                        2: 'bg-yellow-500',
                        3: 'bg-blue-500',
                        4: 'bg-green-500'
                      }
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${colors[strength.score as keyof typeof colors]}`}
                                style={{ width: `${(strength.score / 4) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{strength.feedback[0]}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Worker will use this password to login initially. They can change it later.
                </p>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
            </div>

            <div className="flex gap-4 pt-8 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  resetWorkerForm()
                  onClose()
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <ButtonLoadingState
                type="submit"
                isLoading={loading}
                loadingText="Creating Worker..."
                variant="primary"
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="h-4 w-4" />
                Create Worker
              </ButtonLoadingState>
            </div>
          </form>
        </FormLoadingState>
      </div>
    </div>
  )
}

// View Shop Dialog Component
interface ViewShopDialogProps {
  shop: Shop | null
  open: boolean
  onClose: () => void
}

function ViewShopDialog({ shop, open, onClose }: ViewShopDialogProps) {
  if (!open || !shop) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6 text-blue-600" />
                Shop Details
              </h3>
              <p className="text-sm text-gray-600 mt-1">View shop information and statistics</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Shop Name</label>
                <p className="text-gray-900 mt-1">{shop.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge
                    variant={shop.status === ShopStatus.ACTIVE ? 'default' : 'secondary'}
                    className={shop.status === ShopStatus.ACTIVE ? 'bg-green-100 text-green-800' : ''}
                  >
                    {shop.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Address</label>
              <p className="text-gray-900 mt-1">{shop.address}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">City</label>
                <p className="text-gray-900 mt-1">{shop.city}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Province</label>
                <p className="text-gray-900 mt-1">{shop.province}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Postal Code</label>
                <p className="text-gray-900 mt-1">{shop.postalCode}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900 mt-1">{shop.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{shop.email}</p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Business Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">License Number</label>
                <p className="text-gray-900 mt-1">{shop.licenseNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">GST Number</label>
                <p className="text-gray-900 mt-1">{shop.gstNumber || 'Not provided'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Owner</label>
                <p className="text-gray-900 mt-1">{shop.ownerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Workers</label>
                <p className="text-gray-900 mt-1">{(shop as any)._count?.workers || 0} workers</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2">Timestamps</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900 mt-1">{new Date(shop.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-900 mt-1">{new Date(shop.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// Manage Shop Dialog Component
interface ManageShopDialogProps {
  shop: Shop | null
  open: boolean
  onClose: () => void
  onSuccess: (updatedShop: Shop) => void
}

function ManageShopDialog({ shop, open, onClose, onSuccess }: ManageShopDialogProps) {
  const [formData, setFormData] = useState<Partial<Shop>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pakistaniProvinces = [
    'Punjab',
    'Sindh',
    'KPK (Khyber Pakhtunkhwa)',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu and Kashmir'
  ]

  // Reset form when shop changes
  useEffect(() => {
    if (shop && open) {
      setFormData({
        name: shop.name,
        address: shop.address,
        city: shop.city,
        province: shop.province,
        postalCode: shop.postalCode,
        phone: shop.phone,
        email: shop.email,
        licenseNumber: shop.licenseNumber || '',
        gstNumber: shop.gstNumber || ''
      })
      setErrors({})
    }
  }, [shop, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        // API returns the shop directly, not wrapped in success object
        onSuccess(result)
      } else {
        if (result.details) {
          // Handle Zod validation errors
          const fieldErrors: Record<string, string> = {}
          result.details.forEach((detail: any) => {
            fieldErrors[detail.path[0]] = detail.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: result.error || 'Failed to update shop' })
        }
      }
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to update shop' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Shop, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!open || !shop) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-6 w-6 text-green-600" />
                Manage Shop
              </h3>
              <p className="text-sm text-gray-600 mt-1">Update shop information and settings</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <FormLoadingState isLoading={loading} message="Updating shop...">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Basic Information
              </h4>

              <div className="space-y-2">
                <Label htmlFor="manage-shop-name">Shop Name *</Label>
                <Input
                  id="manage-shop-name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter shop name"
                  disabled={loading}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manage-shop-address">Address *</Label>
                <Textarea
                  id="manage-shop-address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                  disabled={loading}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manage-shop-city">City *</Label>
                  <Input
                    id="manage-shop-city"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                    disabled={loading}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manage-shop-province">Province *</Label>
                  <Select
                    value={formData.province || ''}
                    onValueChange={(value) => handleInputChange('province', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {pakistaniProvinces.map(province => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manage-shop-postal">Postal Code *</Label>
                  <Input
                    id="manage-shop-postal"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="12345"
                    maxLength={5}
                    disabled={loading}
                    className={errors.postalCode ? 'border-red-500' : ''}
                  />
                  {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manage-shop-phone">Phone Number *</Label>
                  <Input
                    id="manage-shop-phone"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const formatted = FormValidator.formatPhoneNumber(e.target.value)
                      handleInputChange('phone', formatted)
                    }}
                    placeholder="+92-300-1234567"
                    disabled={loading}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">Format: +92-XXX-XXXXXXX (auto-formatted)</p>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manage-shop-email">Email Address *</Label>
                  <Input
                    id="manage-shop-email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="shop@example.com"
                    disabled={loading}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Business Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manage-shop-license">License Number</Label>
                  <Input
                    id="manage-shop-license"
                    value={formData.licenseNumber || ''}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder="Enter license number"
                    disabled={loading}
                    className={errors.licenseNumber ? 'border-red-500' : ''}
                  />
                  {errors.licenseNumber && <p className="text-sm text-red-500">{errors.licenseNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manage-shop-gst">GST Number</Label>
                  <Input
                    id="manage-shop-gst"
                    value={formData.gstNumber || ''}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder="Enter GST number"
                    disabled={loading}
                    className={errors.gstNumber ? 'border-red-500' : ''}
                  />
                  {errors.gstNumber && <p className="text-sm text-red-500">{errors.gstNumber}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-xl">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <ButtonLoadingState
                type="submit"
                isLoading={loading}
                loadingText="Updating..."
                variant="primary"
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                Update Shop
              </ButtonLoadingState>
            </div>
          </form>
        </FormLoadingState>
      </div>
    </div>
  )
}

// Main Shop Management Dashboard Component
export function ShopManagementDashboard() {
  // State Management
  const [shops, setShops] = useState<Shop[]>([])
  const [shopOwners, setShopOwners] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCreateOwnerDialog, setShowCreateOwnerDialog] = useState(false)
  const [showCreateWorkerDialog, setShowCreateWorkerDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false)
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false)
  const [showAuditLogDialog, setShowAuditLogDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [showCredentials, setShowCredentials] = useState<{ email: string, password: string, name: string } | null>(null)
  const [shopStats, setShopStats] = useState<Record<string, ShopStats>>({})
  const [showViewShopDialog, setShowViewShopDialog] = useState(false)
  const [showManageShopDialog, setShowManageShopDialog] = useState(false)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: 'user' | 'shop' | 'worker', data: any } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showInactiveShops, setShowInactiveShops] = useState(false)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [shopFilter, setShopFilter] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Hooks
  const router = useRouter()
  const { user, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // Fetch Functions
  const fetchShops = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shops')
      if (!response.ok) throw new Error('Failed to fetch shops')
      const data = await response.json()
      setShops(data.shops || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shops')
      showError('Failed to fetch shops')
    } finally {
      setLoading(false)
    }
  }

  const fetchShopOwners = async () => {
    try {
      const response = await fetch('/api/users/shop-owners')
      if (!response.ok) throw new Error('Failed to fetch shop owners')
      const data = await response.json()
      setShopOwners(data.shopOwners || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shop owners')
    }
  }

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/users/workers')
      if (!response.ok) throw new Error('Failed to fetch workers')
      const data = await response.json()
      setWorkers(data.workers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workers')
    }
  }

  // Event Handlers
  const handleShopCreated = (newShop: Shop) => {
    setShops(prev => [...prev, newShop])
    setShowCreateDialog(false)
    success('Shop created successfully')
  }

  const handleOwnerCreated = (newOwner: any) => {
    setShopOwners(prev => [...prev, newOwner])
    setShowCreateOwnerDialog(false)
    setShowCredentials({
      email: newOwner.email,
      password: newOwner.password,
      name: newOwner.name
    })
    success('Shop owner created successfully')
  }

  const handleWorkerCreated = (newWorker: any) => {
    setShowCreateWorkerDialog(false)
    setShowCredentials({
      email: newWorker.email,
      password: newWorker.password,
      name: newWorker.name
    })
    // Refresh shops data to update worker counts
    fetchShops()
    fetchWorkers()
    success('Worker created successfully')
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setShowEditUserDialog(true)
  }

  const handleResetPassword = (user: any) => {
    setSelectedUser(user)
    setShowPasswordResetDialog(true)
  }

  const handleRoleChange = (user: any) => {
    setSelectedUser(user)
    setShowRoleChangeDialog(true)
  }

  const handleRoleChangeSuccess = () => {
    setShowRoleChangeDialog(false)
    setSelectedUser(null)
    fetchShopOwners()
    fetchWorkers()
    success('User role changed successfully')
  }

  const handleViewAuditLog = (user: any) => {
    setSelectedUser(user)
    setShowAuditLogDialog(true)
  }

  const handleManagePermissions = (worker: any) => {
    setSelectedUser(worker)
    setShowPermissionsDialog(true)
  }

  const handlePermissionsSuccess = () => {
    setShowPermissionsDialog(false)
    setSelectedUser(null)
    success('Worker permissions updated successfully')
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      showError('Failed to logout')
    }
  }

  const handleBack = () => {
    router.push('/dashboard/admin')
  }

  const handlePasswordResetSuccess = (credentials: { email: string; password: string; resetToken: string }) => {
    setShowPasswordResetDialog(false)
    setSelectedUser(null)
    setShowCredentials({
      email: credentials.email,
      password: credentials.password,
      name: selectedUser?.name || 'User'
    })
    success('Password reset successfully')
  }

  const handleUserUpdated = (updatedUser: any) => {
    // Update the user in the appropriate list
    if (updatedUser.role === 'SHOP_OWNER') {
      setShopOwners(prev => prev.map(owner => 
        owner.id === updatedUser.id ? { ...owner, ...updatedUser } : owner
      ))
    } else if (updatedUser.role === 'SHOP_WORKER') {
      setWorkers(prev => prev.map(worker => 
        worker.id === updatedUser.id ? { ...worker, ...updatedUser } : worker
      ))
    }
    setShowEditUserDialog(false)
    setSelectedUser(null)
    success('User updated successfully')
    
    // Refresh the data to ensure consistency
    fetchWorkers()
    fetchShopOwners()
  }

  const handleViewShop = (shop: Shop) => {
    setSelectedShop(shop)
    setShowViewShopDialog(true)
  }

  const handleManageShop = (shop: Shop) => {
    setSelectedShop(shop)
    setShowManageShopDialog(true)
  }

  const handleStatusChange = async (user: any, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Update the user in the appropriate list
        const updatedUser = { ...user, status: newStatus }
        if (user.role === 'SHOP_OWNER') {
          setShopOwners(prev => prev.map(owner => 
            owner.id === user.id ? updatedUser : owner
          ))
        } else if (user.role === 'SHOP_WORKER') {
          setWorkers(prev => prev.map(worker => 
            worker.id === user.id ? updatedUser : worker
          ))
        }

        // Show success message with cascading effects info if any
        let message = result.message
        if (result.cascadingEffects) {
          message += `. ${result.cascadingEffects.message}`
        }
        success(message)

        // Refresh data to get updated counts
        fetchShops()
        fetchShopOwners()
        fetchWorkers()
      } else {
        throw new Error(result.error || 'Failed to change user status')
      }
    } catch (error) {
      console.error('Status change error:', error)
      throw error
    }
  }

  // Delete handlers
  const handleDeleteUser = (user: any) => {
    setDeleteItem({ type: 'user', data: user })
    setShowDeleteDialog(true)
  }

  const handleDeleteWorker = (worker: any) => {
    setDeleteItem({ type: 'worker', data: worker })
    setShowDeleteDialog(true)
  }

  const handleDeleteShop = (shop: Shop) => {
    setDeleteItem({ type: 'shop', data: shop })
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return

    setDeleteLoading(true)
    try {
      let response: Response
      let endpoint: string

      switch (deleteItem.type) {
        case 'user':
        case 'worker':
          endpoint = `/api/users/${deleteItem.data.id}`
          response = await fetch(endpoint, { method: 'DELETE' })
          break
        case 'shop':
          endpoint = `/api/shops/${deleteItem.data.id}`
          response = await fetch(endpoint, { method: 'DELETE' })
          break
        default:
          throw new Error('Invalid delete type')
      }

      const result = await response.json()

      if (response.ok) {
        // Check if the response indicates success
        const isSuccess = result.success || result.message || response.ok
        
        if (isSuccess) {
          // Remove item from appropriate list
          switch (deleteItem.type) {
            case 'user':
              setShopOwners(prev => prev.filter(owner => owner.id !== deleteItem.data.id))
              break
            case 'worker':
              setWorkers(prev => prev.filter(worker => worker.id !== deleteItem.data.id))
              break
            case 'shop':
              setShops(prev => prev.filter(shop => shop.id !== deleteItem.data.id))
              break
          }

          success(`${deleteItem.type === 'shop' ? 'Shop' : 'User'} deactivated successfully`)
          
          // Refresh data
          fetchShops()
          fetchShopOwners()
          fetchWorkers()
        } else {
          throw new Error(result.error || `Failed to deactivate ${deleteItem.type}`)
        }
      } else {
        throw new Error(result.error || `Failed to deactivate ${deleteItem.type}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      showError(error instanceof Error ? error.message : `Failed to deactivate ${deleteItem.type}`)
    } finally {
      setDeleteLoading(false)
      setShowDeleteDialog(false)
      setDeleteItem(null)
    }
  }

  // Search and filter functions
  const filterUsers = (users: any[], type: 'owner' | 'worker') => {
    return users.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm) ||
        user.cnic?.includes(searchTerm)

      // Status filter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      // Shop filter (for workers)
      const matchesShop = type === 'owner' || shopFilter === 'all' || user.shopId === shopFilter

      return matchesSearch && matchesStatus && matchesShop
    })
  }

  // Bulk action handlers
  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = (users: any[]) => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedUsers.size === 0) return

    const confirmed = window.confirm(`Are you sure you want to change status for ${selectedUsers.size} user(s)?`)
    if (!confirmed) return

    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, reason: 'Bulk status change' })
        })
      )

      await Promise.all(promises)
      success(`Successfully updated ${selectedUsers.size} user(s)`)
      setSelectedUsers(new Set())
      fetchShopOwners()
      fetchWorkers()
    } catch (error) {
      showError('Failed to update users')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return

    const confirmed = window.confirm(`Are you sure you want to deactivate ${selectedUsers.size} user(s)?`)
    if (!confirmed) return

    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}`, { method: 'DELETE' })
      )

      await Promise.all(promises)
      success(`Successfully deactivated ${selectedUsers.size} user(s)`)
      setSelectedUsers(new Set())
      fetchShopOwners()
      fetchWorkers()
    } catch (error) {
      showError('Failed to deactivate users')
    }
  }

  // Calculate summary statistics
  const totalShops = shops.length
  const activeShops = shops.filter(shop => shop.status === 'ACTIVE').length
  const totalSales = Object.values(shopStats).reduce((sum, stats) => sum + (stats.totalSales || 0), 0)
  const todaySales = Object.values(shopStats).reduce((sum, stats) => sum + (stats.todaySales || 0), 0)

  // Format currency in PKR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Filtered users
  const filteredShopOwners = filterUsers(shopOwners, 'owner')
  const filteredWorkers = filterUsers(workers, 'worker')

  useEffect(() => {
    fetchShops()
    fetchShopOwners()
    fetchWorkers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="px-8 py-12">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5 text-white group-hover:text-blue-100" />
              </button>
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  🏪 Shop Management
                </h1>
                <p className="text-blue-100 text-lg">Manage all mobile shops across Pakistan</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">{user.name?.charAt(0) || 'A'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Welcome, {user.name}</p>
                    <Badge className="bg-white/20 text-white border-white/30">{formatUserRole(user.role)}</Badge>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateOwnerDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Users className="h-5 w-5" />
                  Add Owner
                </button>
                <button
                  onClick={() => setShowCreateWorkerDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <UserPlus className="h-5 w-5" />
                  Add Worker
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                  Add Shop
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8">

      {/* Modern Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Store className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalShops}</div>
              <div className="text-blue-100 text-sm">Total Shops</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-blue-100">{activeShops} active shops</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{shopOwners.length}</div>
              <div className="text-emerald-100 text-sm">Shop Owners</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <span className="text-sm text-emerald-100">Registered owners</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(totalSales)}</div>
              <div className="text-purple-100 text-sm">Total Sales</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-sm text-purple-100">All time revenue</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(todaySales)}</div>
              <div className="text-orange-100 text-sm">Today's Sales</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-orange-100">Today's revenue</span>
          </div>
        </div>
      </div>

      {/* Modern Shops List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">All Shops</h2>
                <p className="text-blue-100">Manage and monitor all mobile shops in the system</p>
              </div>
            </div>
            <button
              onClick={() => setShowInactiveShops(!showInactiveShops)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                showInactiveShops 
                  ? 'bg-white/20 text-white hover:bg-white/30' 
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              {showInactiveShops ? 'Hide Inactive' : 'Show Inactive'}
            </button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="space-y-4">
            {shops.filter(shop => showInactiveShops || shop.status === 'ACTIVE').length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Store className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first shop</p>
                <button 
                  onClick={() => setShowCreateDialog(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 inline mr-2" />
                  Create Shop
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {shops.filter(shop => showInactiveShops || shop.status === 'ACTIVE').map((shop) => (
                  <div key={shop.id} className="group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Store className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{shop.name}</h3>
                          <div className="flex items-center space-x-6 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{shop.city}, {shop.province}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-500" />
                              <span>{shop.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-purple-500" />
                              <span>{shop.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          shop.status === ShopStatus.ACTIVE 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {shop.status === ShopStatus.ACTIVE ? '✅ Active' : '⏸️ Inactive'}
                        </div>
                        <button 
                          onClick={() => handleViewShop(shop)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button 
                          onClick={() => handleManageShop(shop)}
                          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Manage
                        </button>
                        <button 
                          onClick={() => handleDeleteShop(shop)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Search & Filter Users</h3>
              <p className="text-sm text-gray-600">Find and manage users across the system</p>
            </div>
          </div>
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedUsers.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Bulk Actions
              </Button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, CNIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={shopFilter} onValueChange={setShopFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by shop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shops</SelectItem>
              {shops.map(shop => (
                <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setShopFilter('all')
              setSelectedUsers(new Set())
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && selectedUsers.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.size} user(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Set Active</SelectItem>
                    <SelectItem value="INACTIVE">Set Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Set Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Deactivate Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUsers(new Set())
                    setShowBulkActions(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern User Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Shop Owners */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Shop Owners</h3>
                  <p className="text-emerald-100 text-sm">
                    {filteredShopOwners.length} of {shopOwners.length} owners
                  </p>
                </div>
              </div>
              {filteredShopOwners.length > 0 && (
                <button
                  onClick={() => handleSelectAll(filteredShopOwners)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title="Select all"
                >
                  {selectedUsers.size === filteredShopOwners.length && filteredShopOwners.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-white" />
                  ) : (
                    <Square className="h-5 w-5 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredShopOwners.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    {searchTerm || statusFilter !== 'all' || shopFilter !== 'all' 
                      ? 'No shop owners match your filters' 
                      : 'No shop owners found'}
                  </p>
                </div>
              ) : (
                filteredShopOwners.map((owner) => (
                  <div key={owner.id} className="group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <button
                          onClick={() => handleSelectUser(owner.id)}
                          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                        >
                          {selectedUsers.has(owner.id) ? (
                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">{owner.name}</p>
                          <p className="text-sm text-gray-600 truncate">{owner.email}</p>
                          {owner.businessName && (
                            <p className="text-xs text-emerald-600 font-medium truncate">{owner.businessName}</p>
                          )}
                          {owner.lastLogin && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <History className="h-3 w-3" />
                              <span suppressHydrationWarning>
                                Last login: {new Date(owner.lastLogin).toLocaleDateString('en-PK', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <UserStatusToggle
                          user={owner}
                          onStatusChange={handleStatusChange}
                        />
                        <button 
                          onClick={() => handleEditUser(owner)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleRoleChange(owner)}
                          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Change Role"
                        >
                          <UserCog className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewAuditLog(owner)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="View Audit Log"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(owner)}
                          className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(owner)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Workers</h3>
                  <p className="text-purple-100 text-sm">
                    {filteredWorkers.length} of {workers.length} workers
                  </p>
                </div>
              </div>
              {filteredWorkers.length > 0 && (
                <button
                  onClick={() => handleSelectAll(filteredWorkers)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title="Select all"
                >
                  {selectedUsers.size === filteredWorkers.length && filteredWorkers.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-white" />
                  ) : (
                    <Square className="h-5 w-5 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredWorkers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    {searchTerm || statusFilter !== 'all' || shopFilter !== 'all' 
                      ? 'No workers match your filters' 
                      : 'No workers found'}
                  </p>
                </div>
              ) : (
                filteredWorkers.map((worker) => (
                  <div key={worker.id} className="group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <button
                          onClick={() => handleSelectUser(worker.id)}
                          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                        >
                          {selectedUsers.has(worker.id) ? (
                            <CheckSquare className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">{worker.name}</p>
                          <p className="text-sm text-gray-600 truncate">{worker.email}</p>
                          {worker.position && (
                            <p className="text-xs text-purple-600 font-medium truncate">{worker.position}</p>
                          )}
                          {worker.lastLogin && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <History className="h-3 w-3" />
                              <span suppressHydrationWarning>
                                Last login: {new Date(worker.lastLogin).toLocaleDateString('en-PK', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <UserStatusToggle
                          user={worker}
                          onStatusChange={handleStatusChange}
                        />
                        <button 
                          onClick={() => handleEditUser(worker)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleRoleChange(worker)}
                          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Change Role"
                        >
                          <UserCog className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleManagePermissions(worker)}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Manage Permissions"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewAuditLog(worker)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="View Audit Log"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(worker)}
                          className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteWorker(worker)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Shop Dialog */}
      <CreateShopDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleShopCreated}
        shopOwners={shopOwners}
      />

      {/* Create Shop Owner Dialog */}
      <CreateShopOwnerDialog
        open={showCreateOwnerDialog}
        onClose={() => setShowCreateOwnerDialog(false)}
        onSuccess={handleOwnerCreated}
      />

      {/* Create Worker Dialog */}
      <CreateWorkerDialog
        open={showCreateWorkerDialog}
        onClose={() => setShowCreateWorkerDialog(false)}
        onSuccess={handleWorkerCreated}
        shops={shops}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={selectedUser}
        open={showEditUserDialog}
        onClose={() => {
          setShowEditUserDialog(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserUpdated}
      />

      {/* Password Reset Dialog */}
      <PasswordResetDialog
        user={selectedUser}
        open={showPasswordResetDialog}
        onClose={() => {
          setShowPasswordResetDialog(false)
          setSelectedUser(null)
        }}
        onSuccess={handlePasswordResetSuccess}
      />

      {/* Role Change Dialog */}
      <RoleChangeDialog
        user={selectedUser}
        open={showRoleChangeDialog}
        onClose={() => {
          setShowRoleChangeDialog(false)
          setSelectedUser(null)
        }}
        onSuccess={handleRoleChangeSuccess}
      />

      {/* Audit Log Dialog */}
      <UserAuditLogDialog
        userId={selectedUser?.id || null}
        userName={selectedUser?.name || null}
        open={showAuditLogDialog}
        onClose={() => {
          setShowAuditLogDialog(false)
          setSelectedUser(null)
        }}
      />

      {/* Worker Permissions Dialog */}
      <WorkerPermissionsDialog
        worker={selectedUser}
        open={showPermissionsDialog}
        onClose={() => {
          setShowPermissionsDialog(false)
          setSelectedUser(null)
        }}
        onSuccess={handlePermissionsSuccess}
      />

      {/* Credential Display */}
      {showCredentials && (
        <CredentialDisplay
          email={showCredentials.email}
          password={showCredentials.password}
          userName={showCredentials.name}
          onClose={() => setShowCredentials(null)}
        />
      )}

      {/* View Shop Dialog */}
      <ViewShopDialog
        shop={selectedShop}
        open={showViewShopDialog}
        onClose={() => {
          setShowViewShopDialog(false)
          setSelectedShop(null)
        }}
      />

      {/* Manage Shop Dialog */}
      <ManageShopDialog
        shop={selectedShop}
        open={showManageShopDialog}
        onClose={() => {
          setShowManageShopDialog(false)
          setSelectedShop(null)
        }}
        onSuccess={(updatedShop) => {
          setShops(prev => prev.map(shop => 
            shop.id === updatedShop.id ? updatedShop : shop
          ))
          setShowManageShopDialog(false)
          setSelectedShop(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDeleteItem(null)
        }}
        onConfirm={handleDeleteConfirm}
        itemType={deleteItem?.type || 'user'}
        itemName={deleteItem?.data?.name || ''}
        itemRole={deleteItem?.data?.role ? formatUserRole(deleteItem.data.role) : undefined}
        warningMessage={
          deleteItem?.type === 'user' && deleteItem?.data?.role === 'SHOP_OWNER'
            ? 'Deactivating this shop owner will also deactivate all their shops and workers.'
            : deleteItem?.type === 'shop'
            ? 'This shop will be deactivated and cannot be used for new transactions.'
            : undefined
        }
        loading={deleteLoading}
      />
    </div>
    </div>
  )
}

export default ShopManagementDashboard