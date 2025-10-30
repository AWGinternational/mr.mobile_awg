'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  Banknote,
  Save,
  RotateCcw,
  Phone,
  Receipt
} from 'lucide-react'

interface ServiceFee {
  serviceName: string
  fee: number // Fee amount (in PKR or %)
  isPercentage: boolean // true = percentage, false = fixed amount
}

interface ShopFees {
  // Mobile Load
  mobileLoad: ServiceFee
  
  // EasyPaisa Services
  easypaisaSending: ServiceFee
  easypaisaReceiving: ServiceFee
  
  // JazzCash Services
  jazzcashSending: ServiceFee
  jazzcashReceiving: ServiceFee
  
  // Bank Transfer
  bankTransfer: ServiceFee
  
  // Bill Payment
  billPayment: ServiceFee
}

const DEFAULT_FEES: ShopFees = {
  mobileLoad: {
    serviceName: 'Mobile Load',
    fee: 0,
    isPercentage: false
  },
  easypaisaSending: {
    serviceName: 'EasyPaisa - Sending',
    fee: 0,
    isPercentage: true
  },
  easypaisaReceiving: {
    serviceName: 'EasyPaisa - Receiving',
    fee: 0,
    isPercentage: true
  },
  jazzcashSending: {
    serviceName: 'JazzCash - Sending',
    fee: 0,
    isPercentage: true
  },
  jazzcashReceiving: {
    serviceName: 'JazzCash - Receiving',
    fee: 0,
    isPercentage: true
  },
  bankTransfer: {
    serviceName: 'Bank Transfer',
    fee: 0,
    isPercentage: false
  },
  billPayment: {
    serviceName: 'Bill Payment',
    fee: 0,
    isPercentage: false
  }
}

export default function FeesSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useNotify()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fees, setFees] = useState<ShopFees>(DEFAULT_FEES)

  useEffect(() => {
    if (user) {
      fetchFees()
    }
  }, [user])

  const fetchFees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/fees')
      const result = await response.json()

      if (response.ok && result.success) {
        setFees(result.data.fees || DEFAULT_FEES)
      } else {
        // Use default fees if not set
        setFees(DEFAULT_FEES)
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
      setFees(DEFAULT_FEES)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceFeeChange = (
    service: keyof ShopFees,
    field: keyof ServiceFee,
    value: any
  ) => {
    setFees(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value
      }
    }))
  }

  const handleSaveFees = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/settings/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fees })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success('Service fees updated successfully!')
      } else {
        error(result.error || 'Failed to update fees')
      }
    } catch (err) {
      console.error('Error saving fees:', err)
      error('Failed to save fees')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    if (confirm('Reset all fees to default values?')) {
      setFees(DEFAULT_FEES)
      success('Fees reset to defaults. Click Save to apply changes.')
    }
  }

  const handleBack = () => {
    router.push('/settings/shop')
  }

  const ServiceFeeCard = ({ 
    service, 
    serviceKey,
    icon: Icon,
    color
  }: { 
    service: ServiceFee
    serviceKey: keyof ShopFees
    icon: any
    color: string
  }) => {
    return (
      <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Icon className={`h-6 w-6 ${color}`} />
            {service.serviceName}
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Configure commission for {service.serviceName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fee Type Toggle */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Label className="text-sm font-medium dark:text-gray-300">Fee Type:</Label>
            <div className="flex gap-2">
              <Button
                variant={service.isPercentage ? "default" : "outline"}
                size="sm"
                onClick={() => handleServiceFeeChange(serviceKey, 'isPercentage', true)}
                className="dark:border-gray-600"
              >
                Percentage (%)
              </Button>
              <Button
                variant={!service.isPercentage ? "default" : "outline"}
                size="sm"
                onClick={() => handleServiceFeeChange(serviceKey, 'isPercentage', false)}
                className="dark:border-gray-600"
              >
                Fixed (PKR)
              </Button>
            </div>
          </div>

          {/* Fee Input */}
          <div>
            <Label htmlFor={`${serviceKey}-fee`} className="dark:text-gray-300">
              Service Fee {service.isPercentage ? '(%)' : '(PKR)'}
            </Label>
            <Input
              id={`${serviceKey}-fee`}
              type="number"
              step={service.isPercentage ? "0.1" : "1"}
              min="0"
              value={service.fee === 0 ? '' : service.fee}
              placeholder={service.isPercentage ? "Enter percentage (e.g., 1.5)" : "Enter fixed amount (e.g., 50)"}
              onChange={(e) => handleServiceFeeChange(serviceKey, 'fee', parseFloat(e.target.value) || 0)}
              className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getServiceDescription(serviceKey)}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getServiceDescription = (serviceKey: keyof ShopFees): string => {
    const descriptions: Record<keyof ShopFees, string> = {
      mobileLoad: 'Fee charged per mobile recharge/load transaction',
      easypaisaSending: 'Fee when customers send money via EasyPaisa',
      easypaisaReceiving: 'Fee when customers receive money via EasyPaisa',
      jazzcashSending: 'Fee when customers send money via JazzCash',
      jazzcashReceiving: 'Fee when customers receive money via JazzCash',
      bankTransfer: 'Fee charged for bank transfer transactions',
      billPayment: 'Fee charged per utility bill payment'
    }
    return descriptions[serviceKey]
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SUPER_ADMIN]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900 text-white">
              <div className="px-8 py-12">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200">
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div>
                      <h1 className="text-4xl font-bold mb-2">💰 Service Fees & Commission</h1>
                      <p className="text-green-100 text-lg">
                        Configure fees for online banking and mobile money services
                      </p>
                    </div>
                  </div>
                  <Wallet className="h-16 w-16 text-white/20" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading fees configuration...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info Banner */}
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        ℹ️ <strong>Note:</strong> These fees will be applied to all online banking services in your shop. 
                        You can set fees as a percentage of the transaction or as a fixed PKR amount. 
                        These settings replace hardcoded values and give you full control over your pricing.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Service Fee Cards - All 7 Services */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mobile Services</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      <ServiceFeeCard 
                        service={fees.mobileLoad} 
                        serviceKey="mobileLoad" 
                        icon={Phone}
                        color="text-purple-600 dark:text-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">EasyPaisa Services</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ServiceFeeCard 
                        service={fees.easypaisaSending} 
                        serviceKey="easypaisaSending" 
                        icon={Wallet}
                        color="text-green-600 dark:text-green-400"
                      />
                      <ServiceFeeCard 
                        service={fees.easypaisaReceiving} 
                        serviceKey="easypaisaReceiving" 
                        icon={Wallet}
                        color="text-green-600 dark:text-green-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">JazzCash Services</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ServiceFeeCard 
                        service={fees.jazzcashSending} 
                        serviceKey="jazzcashSending" 
                        icon={CreditCard}
                        color="text-orange-600 dark:text-orange-400"
                      />
                      <ServiceFeeCard 
                        service={fees.jazzcashReceiving} 
                        serviceKey="jazzcashReceiving" 
                        icon={CreditCard}
                        color="text-orange-600 dark:text-orange-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Banking Services</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ServiceFeeCard 
                        service={fees.bankTransfer} 
                        serviceKey="bankTransfer" 
                        icon={Banknote}
                        color="text-blue-600 dark:text-blue-400"
                      />
                      <ServiceFeeCard 
                        service={fees.billPayment} 
                        serviceKey="billPayment" 
                        icon={Receipt}
                        color="text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-end pt-6 border-t dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={handleResetToDefaults}
                      className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <Button
                      onClick={handleSaveFees}
                      disabled={saving}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Fees Configuration
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
