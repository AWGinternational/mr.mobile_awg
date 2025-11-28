'use client'

import { useState, useEffect } from 'react'
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
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Receipt,
  Users,
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building,
  Globe,
  DollarSign,
  Wallet,
  ArrowRight
} from 'lucide-react'

interface ShopSettings {
  // Business Information
  name: string
  location: string
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

function ShopSettingsContent() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'payments' | 'system'>('business')
  
  const [settings, setSettings] = useState<ShopSettings>({
    name: '',
    location: '',
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
    taxRate: 17, // Default GST in Pakistan
    currency: 'PKR',
    lowStockThreshold: 10,
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/shop')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      const response = await fetch('/api/settings/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof ShopSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Store },
    { id: 'receipt', label: 'Receipt Config', icon: Receipt },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'system', label: 'System Settings', icon: SettingsIcon },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Shop Settings</h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1 leading-snug">Configure your shop's information and preferences</p>
              </div>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm lg:text-base w-full sm:w-auto flex-shrink-0 h-9 sm:h-10 touch-manipulation"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Saving</span>
                  </>
                ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Save Settings</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <span className="font-medium text-xs sm:text-sm lg:text-base">{message.text}</span>
            </div>
          )}

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Worker Management Card */}
            <Card 
              className="hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 active:scale-[0.98] touch-manipulation"
              onClick={() => window.location.href = '/settings/workers'}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                    <div className="p-2 sm:p-2.5 lg:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white truncate">Worker Management</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate leading-snug">Manage team members & permissions</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            {/* Service Fees Card */}
            <Card 
              className="hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 active:scale-[0.98] touch-manipulation"
              onClick={() => window.location.href = '/settings/fees'}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                    <div className="p-2 sm:p-2.5 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white truncate">Service Fees & Commission</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate leading-snug">Configure online banking fees</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm lg:text-base touch-manipulation ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:text-blue-600'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Business Information */}
          {activeTab === 'business' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <Card>
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                    <Building className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                    Shop Details
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Basic information about your shop</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                  <div>
                    <Label htmlFor="name" className="text-xs sm:text-sm">Shop Name *</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => updateSetting('name', e.target.value)}
                      placeholder="Enter shop name"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-xs sm:text-sm">Location *</Label>
                    <Textarea
                      id="location"
                      value={settings.location}
                      onChange={(e) => updateSetting('location', e.target.value)}
                      placeholder="Enter full address"
                      rows={3}
                      className="text-sm sm:text-base mt-1.5 resize-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => updateSetting('phone', e.target.value)}
                      placeholder="+92 XXX XXXXXXX"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                    <Globe className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                    Contact & Online
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Contact details and online presence</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                  <div>
                    <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      placeholder="shop@example.com"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-xs sm:text-sm">Website</Label>
                    <Input
                      id="website"
                      value={settings.website}
                      onChange={(e) => updateSetting('website', e.target.value)}
                      placeholder="https://yourshop.com"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstNumber" className="text-xs sm:text-sm">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={settings.gstNumber}
                      onChange={(e) => updateSetting('gstNumber', e.target.value)}
                      placeholder="Enter GST registration number"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ntnNumber" className="text-xs sm:text-sm">NTN Number</Label>
                    <Input
                      id="ntnNumber"
                      value={settings.ntnNumber}
                      onChange={(e) => updateSetting('ntnNumber', e.target.value)}
                      placeholder="Enter NTN number"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Receipt Configuration */}
          {activeTab === 'receipt' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <Card>
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                    <Receipt className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-600 flex-shrink-0" />
                    Receipt Customization
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Customize your sales receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                  <div>
                    <Label htmlFor="receiptHeader" className="text-xs sm:text-sm">Receipt Header</Label>
                    <Textarea
                      id="receiptHeader"
                      value={settings.receiptHeader}
                      onChange={(e) => updateSetting('receiptHeader', e.target.value)}
                      placeholder="Welcome to our shop! Thank you for shopping."
                      rows={3}
                      className="text-sm sm:text-base mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiptFooter" className="text-xs sm:text-sm">Receipt Footer</Label>
                    <Textarea
                      id="receiptFooter"
                      value={settings.receiptFooter}
                      onChange={(e) => updateSetting('receiptFooter', e.target.value)}
                      placeholder="Visit us again!"
                      className="text-sm sm:text-base mt-1.5"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showLogo"
                      checked={settings.showLogo}
                      onChange={(e) => updateSetting('showLogo', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <Label htmlFor="showLogo" className="text-xs sm:text-sm">Show shop logo on receipt</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                    <DollarSign className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                    Financial Settings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Tax and currency configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                  <div>
                    <Label htmlFor="taxRate" className="text-xs sm:text-sm">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value))}
                      step="0.1"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default: 0% (No tax). Pakistan GST: 17% if registered</p>
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-xs sm:text-sm">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => updateSetting('currency', e.target.value)}
                      placeholder="PKR"
                      disabled
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pakistani Rupees (PKR)</p>
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold" className="text-xs sm:text-sm">Low Stock Alert Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={settings.lowStockThreshold}
                      onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value))}
                      placeholder="10"
                      className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Alert when stock falls below this number</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Methods */}
          {activeTab === 'payments' && (
            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <CreditCard className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-indigo-600 flex-shrink-0" />
                  Enabled Payment Methods
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Select which payment methods your shop accepts</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { key: 'enableCash', label: 'Cash', icon: DollarSign, color: 'green' },
                    { key: 'enableCard', label: 'Credit/Debit Card', icon: CreditCard, color: 'blue' },
                    { key: 'enableEasyPaisa', label: 'EasyPaisa', icon: Phone, color: 'green' },
                    { key: 'enableJazzCash', label: 'JazzCash', icon: Phone, color: 'orange' },
                    { key: 'enableBankTransfer', label: 'Bank Transfer', icon: Building, color: 'indigo' },
                  ].map((method) => {
                    const Icon = method.icon
                    return (
                      <div
                        key={method.key}
                        className={`p-3 sm:p-4 border-2 rounded-lg transition-all cursor-pointer active:scale-[0.98] touch-manipulation ${
                          settings[method.key as keyof ShopSettings]
                            ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-900/20`
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => updateSetting(method.key as keyof ShopSettings, !settings[method.key as keyof ShopSettings])}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <input
                            type="checkbox"
                            checked={settings[method.key as keyof ShopSettings] as boolean}
                            onChange={() => {}}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded flex-shrink-0"
                          />
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${method.color}-600 dark:text-${method.color}-400 flex-shrink-0`} />
                          <span className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white truncate">{method.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Preferences */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <SettingsIcon className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  System Preferences
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Configure system behavior and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white">Automatic Backup</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">Enable daily automatic database backups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoBackup}
                    onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded flex-shrink-0 touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white">Email Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">Receive alerts and reports via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded flex-shrink-0 touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white">SMS Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">Receive important alerts via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded flex-shrink-0 touch-manipulation"
                  />
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ShopSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER]}>
      <ShopSettingsContent />
    </ProtectedRoute>
  )
}
