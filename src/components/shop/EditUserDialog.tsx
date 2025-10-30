"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { FormValidator } from '@/utils/form-validation'
import { FormLoadingState, ButtonLoadingState } from '@/components/ui/loading-overlay'
import { FormFieldLock } from '@/components/ui/form-progress'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, UserRole, UserStatus } from '@/types'
import { UpdateUserData } from '@/lib/validations/user-update'
import { formatUserRole, getRoleBadgeColor, getStatusBadgeColor } from '@/utils/user-formatting'
import {
  Users,
  Edit3,
  Save,
  X,
  AlertCircle,
  MapPin,
  Store,
  Settings
} from 'lucide-react'

// Textarea component
const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    {...props}
  />
)

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onClose: () => void
  onSuccess: (updatedUser: User) => void
}

interface EditableUser extends Partial<User> {
  cnic?: string
  address?: string
  city?: string
  province?: string
  businessName?: string
}

export function EditUserDialog({ user, open, onClose, onSuccess }: EditUserDialogProps) {
  const { user: currentUser } = useAuth()
  const [formData, setFormData] = useState<EditableUser>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editableFields, setEditableFields] = useState<string[]>([])

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

  // Reset form when user changes
  useEffect(() => {
    if (user && open) {
      // Fetch complete user data instead of using incomplete user object
      fetchCompleteUserData(user.id)
    }
  }, [user, open])

  const fetchCompleteUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        const completeUser = data.user
        
        setFormData({
          name: completeUser.name || '',
          email: completeUser.email || '',
          phone: completeUser.phone || '',
          cnic: completeUser.cnic || '',
          address: completeUser.address || '',
          city: completeUser.city || '',
          province: completeUser.province || '',
          businessName: completeUser.businessName || '',
          role: completeUser.role,
          status: completeUser.status
        })
        setErrors({})
        setEditableFields(data.editableFields || [])
      } else {
        console.error('Failed to fetch complete user data')
        // Fallback to basic user data
        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            cnic: (user as any).cnic || '',
            address: (user as any).address || '',
            city: (user as any).city || '',
            province: (user as any).province || '',
            businessName: (user as any).businessName || '',
            role: user.role,
            status: user.status
          })
        }
      }
    } catch (error) {
      console.error('Error fetching complete user data:', error)
      // Fallback to basic user data
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          cnic: (user as any).cnic || '',
          address: (user as any).address || '',
          city: (user as any).city || '',
          province: (user as any).province || '',
          businessName: (user as any).businessName || '',
          role: user.role,
          status: user.status
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({})
    setErrors({})
    setEditableFields([])
  }

  const canEditField = (fieldName: string): boolean => {
    return editableFields.includes(fieldName)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setErrors({})

    try {
      // Filter out fields that user cannot edit
      const filteredData: Partial<UpdateUserData> = {}
      Object.keys(formData).forEach(key => {
        if (canEditField(key) && formData[key as keyof EditableUser] !== undefined) {
          filteredData[key as keyof UpdateUserData] = formData[key as keyof EditableUser] as any
        }
      })

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filteredData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onSuccess(result.user)
        resetForm()
        onClose()
      } else {
        if (result.details && Array.isArray(result.details)) {
          const fieldErrors: Record<string, string> = {}
          result.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: result.error || 'Failed to update user' })
        }
      }
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to update user' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EditableUser, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }



  if (!open || !user) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-[700px] w-full max-h-[85vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="h-6 w-6 text-blue-600" />
                Edit User Profile
              </h3>
              <p className="text-sm text-gray-600 mt-1">Update user information and settings</p>
              <div className="flex gap-2 mt-2">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {formatUserRole(user.role)}
                </Badge>
                <Badge className={getStatusBadgeColor(user.status)}>
                  {user.status || 'Unknown Status'}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <FormLoadingState isLoading={loading} message="Updating user profile...">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Personal Information
              </h4>

              <FormFieldLock isLocked={loading} lockMessage="Updating...">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      disabled={loading || !canEditField('name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {!canEditField('name') && (
                      <p className="text-xs text-gray-500">You cannot edit this field</p>
                    )}
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email Address *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      disabled={loading || !canEditField('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {!canEditField('email') && (
                      <p className="text-xs text-gray-500">You cannot edit this field</p>
                    )}
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone || ''}
                      onChange={(e) => {
                        const formatted = FormValidator.formatPhoneNumber(e.target.value)
                        handleInputChange('phone', formatted)
                      }}
                      placeholder="+92-300-1234567"
                      disabled={loading || !canEditField('phone')}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500">Format: +92-XXX-XXXXXXX (auto-formatted)</p>
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-cnic">CNIC Number</Label>
                    <Input
                      id="edit-cnic"
                      value={formData.cnic || ''}
                      onChange={(e) => {
                        const formatted = FormValidator.formatCNIC(e.target.value)
                        handleInputChange('cnic', formatted)
                      }}
                      placeholder="42101-1234567-8"
                      maxLength={15}
                      disabled={loading || !canEditField('cnic')}
                      className={errors.cnic ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500">Format: 42101-1234567-8 (auto-formatted)</p>
                    {!canEditField('cnic') && (
                      <p className="text-xs text-gray-500">You cannot edit this field</p>
                    )}
                    {errors.cnic && <p className="text-sm text-red-500">{errors.cnic}</p>}
                  </div>
                </div>
              </FormFieldLock>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Information
              </h4>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Complete Address</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="House/Shop # XX, Street Name, Area"
                  rows={3}
                  disabled={loading || !canEditField('address')}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Select
                    value={formData.city || ''}
                    onValueChange={(value) => handleInputChange('city', value)}
                    disabled={loading || !canEditField('city')}
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
                  <Label htmlFor="edit-province">Province</Label>
                  <Select
                    value={formData.province || ''}
                    onValueChange={(value) => handleInputChange('province', value)}
                    disabled={loading || !canEditField('province')}
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

            {/* Business Information (for shop owners) */}
            {(user.role === 'SHOP_OWNER' || canEditField('businessName')) && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Business Information
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="edit-business-name">Business Name</Label>
                  <Input
                    id="edit-business-name"
                    value={formData.businessName || ''}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Your business name"
                    disabled={loading || !canEditField('businessName')}
                    className={errors.businessName ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">Optional: Your mobile shop business name</p>
                  {errors.businessName && <p className="text-sm text-red-500">{errors.businessName}</p>}
                </div>
              </div>
            )}

            {/* System Information (Admin only) */}
            {currentUser?.role === 'SUPER_ADMIN' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  System Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">User Role</Label>
                    <Select
                      value={formData.role || ''}
                      onValueChange={(value) => handleInputChange('role', value)}
                      disabled={loading || !canEditField('role')}
                    >
                      <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHOP_OWNER">Shop Owner</SelectItem>
                        <SelectItem value="SHOP_WORKER">Shop Worker</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">User Status</Label>
                    <Select
                      value={formData.status || ''}
                      onValueChange={(value) => handleInputChange('status', value)}
                      disabled={loading || !canEditField('status')}
                    >
                      <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  onClose()
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <ButtonLoadingState
                type="submit"
                isLoading={loading}
                loadingText="Updating..."
                variant="primary"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                Update User
              </ButtonLoadingState>
            </div>
          </form>
        </FormLoadingState>
      </div>
    </div>
  )
}