'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  ArrowLeft,
  LogOut,
  Globe,
  DollarSign,
  Mail,
  Shield,
  Bell,
  Palette,
  Save,
  Clock
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface SystemSettings {
  general: {
    systemName: string
    currency: string
    timezone: string
    dateFormat: string
    language: string
  }
  business: {
    gstRate: number
    fiscalYearStart: string
    businessHoursStart: string
    businessHoursEnd: string
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    fromEmail: string
    fromName: string
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireStrongPassword: boolean
  }
}

export default function GlobalSettingsPage() {
  const router = useRouter()
  const { user: currentUser, logout } = useAuth()
  const { success, error: showError } = useNotify()

  // State
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      systemName: 'Mobile Shop Management System',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      dateFormat: 'DD/MM/YYYY',
      language: 'en'
    },
    business: {
      gstRate: 18,
      fiscalYearStart: '07-01',
      businessHoursStart: '09:00',
      businessHoursEnd: '21:00'
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      fromEmail: '',
      fromName: 'Mobile Shop System'
    },
    security: {
      sessionTimeout: 480,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true
    }
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/admin')
  }

  const handleSave = async (section: keyof SystemSettings) => {
    try {
      setLoading(true)
      
      // API call would go here
      // await fetch('/api/admin/settings', { ... })
      
      success(`${section} settings saved successfully`)
    } catch (error) {
      showError('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 via-slate-700 to-zinc-800 text-white">
          <div className="px-8 py-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    ⚙️ Global Settings
                  </h1>
                  <p className="text-gray-100 text-lg">System-wide configurations and preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                      <p className="text-sm text-gray-600">Basic system configuration</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="systemName">System Name</Label>
                        <Input
                          id="systemName"
                          value={settings.general.systemName}
                          onChange={(e) => updateSetting('general', 'systemName', e.target.value)}
                          placeholder="System name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency">Default Currency</Label>
                        <Select
                          value={settings.general.currency}
                          onValueChange={(value) => updateSetting('general', 'currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={settings.general.timezone}
                          onValueChange={(value) => updateSetting('general', 'timezone', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                            <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select
                          value={settings.general.dateFormat}
                          onValueChange={(value) => updateSetting('general', 'dateFormat', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave('general')}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save General Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Settings Tab */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Settings</h3>
                      <p className="text-sm text-gray-600">Tax and business configuration</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="gstRate">GST Rate (%)</Label>
                        <Input
                          id="gstRate"
                          type="number"
                          value={settings.business.gstRate}
                          onChange={(e) => updateSetting('business', 'gstRate', parseFloat(e.target.value))}
                          placeholder="18"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500">Current GST rate in Pakistan: 18%</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fiscalYear">Fiscal Year Start (MM-DD)</Label>
                        <Input
                          id="fiscalYear"
                          value={settings.business.fiscalYearStart}
                          onChange={(e) => updateSetting('business', 'fiscalYearStart', e.target.value)}
                          placeholder="07-01"
                        />
                        <p className="text-xs text-gray-500">Pakistan fiscal year: July 1st</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessStart">Business Hours Start</Label>
                        <Input
                          id="businessStart"
                          type="time"
                          value={settings.business.businessHoursStart}
                          onChange={(e) => updateSetting('business', 'businessHoursStart', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessEnd">Business Hours End</Label>
                        <Input
                          id="businessEnd"
                          type="time"
                          value={settings.business.businessHoursEnd}
                          onChange={(e) => updateSetting('business', 'businessHoursEnd', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave('business')}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Business Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings Tab */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
                      <p className="text-sm text-gray-600">SMTP and email notification settings</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={settings.email.smtpHost}
                          onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                          placeholder="587"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpUser">SMTP Username</Label>
                        <Input
                          id="smtpUser"
                          value={settings.email.smtpUser}
                          onChange={(e) => updateSetting('email', 'smtpUser', e.target.value)}
                          placeholder="your-email@gmail.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          type="email"
                          value={settings.email.fromEmail}
                          onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                          placeholder="noreply@yourshop.com"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                          id="fromName"
                          value={settings.email.fromName}
                          onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                          placeholder="Mobile Shop System"
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Email notifications require SMTP configuration. Use Gmail App Password for Gmail accounts.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave('email')}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Email Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                      <p className="text-sm text-gray-600">Password policies and access control</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                          placeholder="480"
                          min="30"
                          max="1440"
                        />
                        <p className="text-xs text-gray-500">Default: 480 minutes (8 hours)</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                        <Input
                          id="maxAttempts"
                          type="number"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                          placeholder="5"
                          min="3"
                          max="10"
                        />
                        <p className="text-xs text-gray-500">Account locked after this many failed attempts</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passwordLength">Minimum Password Length</Label>
                        <Input
                          id="passwordLength"
                          type="number"
                          value={settings.security.passwordMinLength}
                          onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                          placeholder="8"
                          min="6"
                          max="32"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <Label>Require Strong Password</Label>
                            <p className="text-xs text-gray-500">Uppercase, lowercase, numbers, symbols</p>
                          </div>
                          <button
                            onClick={() => updateSetting('security', 'requireStrongPassword', !settings.security.requireStrongPassword)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.security.requireStrongPassword ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.security.requireStrongPassword ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave('security')}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Security Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Settings Information</h4>
                  <p className="text-sm text-blue-700">
                    Changes to these settings will affect the entire system. Make sure to review changes before saving.
                    Some settings may require system restart to take effect.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

