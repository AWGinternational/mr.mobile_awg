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
  fee: number // Fee amount (in PKR or %) - used for simple fixed/percentage
  isPercentage: boolean // true = percentage, false = fixed amount
  useSlabs?: boolean // true = use slab-based fees, false = use simple fee
  slabs?: FeeSlab[] // Array of fee slabs for tiered pricing
}

interface FeeSlab {
  minAmount: number // Minimum amount in range (inclusive)
  maxAmount: number // Maximum amount in range (inclusive), use Infinity for last slab
  fee: number // Fee for this slab
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
    isPercentage: false,
    useSlabs: false,
    slabs: []
  },
  easypaisaSending: {
    serviceName: 'EasyPaisa - Sending',
    fee: 0,
    isPercentage: false,
    useSlabs: false,
    slabs: []
  },
  easypaisaReceiving: {
    serviceName: 'EasyPaisa - Receiving',
    fee: 0,
    isPercentage: false,
    useSlabs: false,
    slabs: []
  },
  jazzcashSending: {
    serviceName: 'JazzCash - Sending',
    fee: 0,
    isPercentage: false,
    useSlabs: false,
    slabs: []
  },
  jazzcashReceiving: {
    serviceName: 'JazzCash - Receiving',
    fee: 0,
    isPercentage: false,
    useSlabs: false,
    slabs: []
  },
  bankTransfer: {
    serviceName: 'Bank Transfer',
    fee: 0,
    isPercentage: false,
    useSlabs: false,
    slabs: []
  },
  billPayment: {
    serviceName: 'Bill Payment',
    fee: 0,
    isPercentage: false,
    useSlabs: false,
    slabs: []
  }
}

const SERVICE_DESCRIPTIONS: Record<keyof ShopFees, string> = {
  mobileLoad: 'Fee charged per mobile recharge/load transaction',
  easypaisaSending: 'Fee when customers send money via EasyPaisa',
  easypaisaReceiving: 'Fee when customers receive money via EasyPaisa',
  jazzcashSending: 'Fee when customers send money via JazzCash',
  jazzcashReceiving: 'Fee when customers receive money via JazzCash',
  bankTransfer: 'Fee charged for bank transfer transactions',
  billPayment: 'Fee charged per utility bill payment'
}

// Auto-generate default slabs (0-1000: 10, 1001-2000: 20, etc.)
const generateDefaultSlabs = (maxAmount: number = 20000, increment: number = 1000, feeIncrement: number = 10): FeeSlab[] => {
  const slabs: FeeSlab[] = []
  let currentMin = 0
  let currentFee = feeIncrement
  
  while (currentMin < maxAmount) {
    const currentMax = currentMin + increment
    slabs.push({
      minAmount: currentMin,
      maxAmount: currentMax,
      fee: currentFee
    })
    currentMin = currentMax + 1
    currentFee += feeIncrement
  }
  
  // Add final slab for anything above maxAmount
  slabs.push({
    minAmount: maxAmount + 1,
    maxAmount: Infinity,
    fee: currentFee
  })
  
  return slabs
}

const formatSlabs = (slabs: FeeSlab[]): string => {
  return slabs.map(slab => {
    const max = slab.maxAmount === Infinity ? '∞' : slab.maxAmount.toString()
    return `${slab.minAmount}-${max}:${slab.fee}`
  }).join(', ')
}

const parseSlabs = (input: string): FeeSlab[] => {
  if (!input.trim()) return []
  
  const slabs: FeeSlab[] = []
  const parts = input.split(',').map(p => p.trim())
  
  for (const part of parts) {
    const match = part.match(/^(\d+)-([∞\d]+):(\d+(?:\.\d+)?)$/)
    if (match) {
      const minAmount = parseInt(match[1])
      const maxAmount = match[2] === '∞' ? Infinity : parseInt(match[2])
      const fee = parseFloat(match[3])
      
      slabs.push({ minAmount, maxAmount, fee })
    }
  }
  
  return slabs
}

// ServiceFeeCard component - defined outside to prevent recreation
const ServiceFeeCard = React.memo(({ 
  service, 
  serviceKey,
  icon: Icon,
  color,
  inputValue,
  onInputChange,
  onInputBlur,
  onFeeTypeChange,
  onSlabsChange
}: { 
  service: ServiceFee
  serviceKey: keyof ShopFees
  icon: any
  color: string
  inputValue: string
  onInputChange: (value: string) => void
  onInputBlur: () => void
  onFeeTypeChange: (isPercentage: boolean) => void
  onSlabsChange: (useSlabs: boolean, slabs?: FeeSlab[]) => void
}) => {
  const [slabInput, setSlabInput] = React.useState<string>('')

  // Initialize slab input when service slabs change
  React.useEffect(() => {
    if (service.slabs && service.slabs.length > 0) {
      setSlabInput(formatSlabs(service.slabs))
    }
  }, [service.slabs])

  // Auto-generate default slabs
  const handleAutoGenerate = () => {
    const defaultSlabs = generateDefaultSlabs(20000, 1000, 10)
    const formattedSlabs = formatSlabs(defaultSlabs)
    setSlabInput(formattedSlabs)
    onSlabsChange(true, defaultSlabs)
  }

  return (
    <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="flex items-center gap-2 dark:text-white text-sm sm:text-base lg:text-lg">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${color} flex-shrink-0`} />
          <span className="truncate">{service.serviceName}</span>
        </CardTitle>
        <CardDescription className="dark:text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
          Configure commission for {service.serviceName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
        {/* Fee Structure Toggle */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Label className="text-xs sm:text-sm font-medium dark:text-gray-300">Fee Structure:</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={!service.useSlabs && !service.isPercentage ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onFeeTypeChange(false)
                onSlabsChange(false, [])
              }}
              className="dark:border-gray-600 text-xs sm:text-sm h-9 sm:h-8"
            >
              Simple (PKR)
            </Button>
            <Button
              variant={!service.useSlabs && service.isPercentage ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onFeeTypeChange(true)
                onSlabsChange(false, [])
              }}
              className="dark:border-gray-600 text-xs sm:text-sm h-9 sm:h-8"
            >
              Percentage (%)
            </Button>
            <Button
              variant={service.useSlabs ? "default" : "outline"}
              size="sm"
              onClick={() => onSlabsChange(true, service.slabs || [])}
              className="dark:border-gray-600 text-xs sm:text-sm h-9 sm:h-8"
            >
              Tiered Slabs
            </Button>
          </div>
        </div>

        {/* Simple/Percentage Fee Input */}
        {!service.useSlabs && (
          <div>
            <Label htmlFor={`${serviceKey}-fee`} className="dark:text-gray-300 text-xs sm:text-sm">
              Service Fee {service.isPercentage ? '(%)' : '(PKR per 1000)'}
            </Label>
            <Input
              id={`${serviceKey}-fee`}
              type="number"
              step={service.isPercentage ? "0.1" : "1"}
              min="0"
              value={inputValue}
              placeholder={service.isPercentage ? "e.g., 1.5" : "e.g., 10"}
              onChange={(e) => onInputChange(e.target.value)}
              onBlur={onInputBlur}
              className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm sm:text-base h-9 sm:h-10"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              {SERVICE_DESCRIPTIONS[serviceKey]}
            </p>
          </div>
        )}

        {/* Tiered Slabs Input */}
        {service.useSlabs && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="dark:text-gray-300 text-xs sm:text-sm flex items-center gap-2">
                  Fee Slabs (Ranges)
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">Format: 0-1000:10, 1001-2000:20</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoGenerate}
                  className="h-7 px-2 text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  ✨ Auto Generate
                </Button>
              </div>
              <Input
                type="text"
                value={slabInput}
                placeholder="e.g., 0-1000:10, 1001-2000:20, 2001-∞:30"
                onChange={(e) => setSlabInput(e.target.value)}
                onBlur={() => {
                  const parsedSlabs = parseSlabs(slabInput)
                  if (parsedSlabs.length > 0) {
                    onSlabsChange(true, parsedSlabs)
                  }
                }}
                className="mt-1.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm h-9 sm:h-10 font-mono"
              />
            </div>
            {/* Slabs Preview */}
            {service.slabs && service.slabs.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">Active Slabs:</p>
                <div className="space-y-1">
                  {service.slabs.map((slab, idx) => (
                    <div key={idx} className="text-xs text-blue-800 dark:text-blue-200 flex justify-between">
                      <span>₨{slab.minAmount.toLocaleString()} - ₨{slab.maxAmount === Infinity ? '∞' : slab.maxAmount.toLocaleString()}</span>
                      <span className="font-semibold">→ ₨{slab.fee}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  💡 Example: ₨1,500 transaction = ₨{service.slabs.find(s => 1500 >= s.minAmount && 1500 <= s.maxAmount)?.fee || 0} fee
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

ServiceFeeCard.displayName = 'ServiceFeeCard'

export default function FeesSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useNotify()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fees, setFees] = useState<ShopFees>(DEFAULT_FEES)
  // Local state for input values to prevent focus loss
  const [inputValues, setInputValues] = useState<Record<string, string>>({})

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
        const fetchedFees = result.data.fees || DEFAULT_FEES
        setFees(fetchedFees)
        // Initialize input values
        const initialInputValues: Record<string, string> = {}
        Object.keys(fetchedFees).forEach(key => {
          const fee = fetchedFees[key as keyof ShopFees]
          initialInputValues[key] = fee.fee > 0 ? fee.fee.toString() : ''
        })
        setInputValues(initialInputValues)
      } else {
        // Use default fees if not set
        setFees(DEFAULT_FEES)
        setInputValues({})
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
      setFees(DEFAULT_FEES)
      setInputValues({})
    } finally {
      setLoading(false)
    }
  }

  const handleServiceFeeChange = React.useCallback((
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
  }, [])

  const handleInputChange = React.useCallback((serviceKey: keyof ShopFees, value: string) => {
    // Update local input value immediately (no re-render of parent)
    setInputValues(prev => ({
      ...prev,
      [serviceKey]: value
    }))
    
    // Update the actual fee value
    const numValue = value === '' ? 0 : parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setFees(prev => ({
        ...prev,
        [serviceKey]: {
          ...prev[serviceKey],
          fee: numValue
        }
      }))
    }
  }, [])

  const handleInputBlur = React.useCallback((serviceKey: keyof ShopFees) => {
    setInputValues(prev => {
      const inputValue = prev[serviceKey] || ''
      const numValue = parseFloat(inputValue)
      
      // Validate and update on blur
      if (inputValue === '' || isNaN(numValue) || numValue < 0) {
        setFees(prevFees => ({
          ...prevFees,
          [serviceKey]: {
            ...prevFees[serviceKey],
            fee: 0
          }
        }))
        return {
          ...prev,
          [serviceKey]: ''
        }
      } else {
        // Ensure the input value matches the fee value
        setFees(prevFees => ({
          ...prevFees,
          [serviceKey]: {
            ...prevFees[serviceKey],
            fee: numValue
          }
        }))
        return {
          ...prev,
          [serviceKey]: numValue.toString()
        }
      }
    })
  }, [])

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

  const handleFeeTypeChange = React.useCallback((serviceKey: keyof ShopFees, isPercentage: boolean) => {
    setFees(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        isPercentage
      }
    }))
  }, [])

  const handleSlabsChange = React.useCallback((serviceKey: keyof ShopFees, useSlabs: boolean, slabs: FeeSlab[]) => {
    setFees(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        useSlabs,
        slabs
      }
    }))
  }, [])


  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SUPER_ADMIN]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 xl:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                    <button onClick={handleBack} className="p-2 sm:p-2.5 lg:p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl transition-all duration-200 flex-shrink-0 touch-manipulation">
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2 leading-tight">💰 Service Fees & Commission</h1>
                      <p className="text-green-100 text-xs sm:text-sm lg:text-base leading-snug">
                        Configure fees for online banking and mobile money services
                      </p>
                    </div>
                  </div>
                  <Wallet className="h-12 w-12 sm:h-16 sm:w-16 text-white/20 hidden sm:block flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading fees configuration...</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Info Banner */}
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                        <span className="font-semibold">ℹ️ Note:</span> These fees will be applied to all online banking services. 
                        Set fees as a <strong>percentage</strong> or <strong>fixed PKR amount</strong>. 
                        These settings give you full control over pricing.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Service Fee Cards - All 7 Services */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Mobile Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                      <ServiceFeeCard 
                        service={fees.mobileLoad} 
                        serviceKey="mobileLoad" 
                        icon={Phone}
                        color="text-purple-600 dark:text-purple-400"
                        inputValue={inputValues.mobileLoad || String(fees.mobileLoad.fee || '')}
                        onInputChange={(value) => handleInputChange('mobileLoad', value)}
                        onInputBlur={() => handleInputBlur('mobileLoad')}
                        onFeeTypeChange={(isPercentage) => handleFeeTypeChange('mobileLoad', isPercentage)}
                        onSlabsChange={(useSlabs, slabs) => handleSlabsChange('mobileLoad', useSlabs, slabs || [])}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white">EasyPaisa Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      <ServiceFeeCard 
                        service={fees.easypaisaSending} 
                        serviceKey="easypaisaSending" 
                        icon={Wallet}
                        color="text-green-600 dark:text-green-400"
                        inputValue={inputValues.easypaisaSending || String(fees.easypaisaSending.fee || '')}
                        onInputChange={(value) => handleInputChange('easypaisaSending', value)}
                        onInputBlur={() => handleInputBlur('easypaisaSending')}
                        onFeeTypeChange={(isPercentage) => handleFeeTypeChange('easypaisaSending', isPercentage)}
                        onSlabsChange={(useSlabs, slabs) => handleSlabsChange('easypaisaSending', useSlabs, slabs || [])}
                      />
                      <ServiceFeeCard 
                        service={fees.easypaisaReceiving} 
                        serviceKey="easypaisaReceiving" 
                        icon={Wallet}
                        color="text-green-600 dark:text-green-400"
                        inputValue={inputValues.easypaisaReceiving || String(fees.easypaisaReceiving.fee || '')}
                        onInputChange={(value) => handleInputChange('easypaisaReceiving', value)}
                        onInputBlur={() => handleInputBlur('easypaisaReceiving')}
                        onFeeTypeChange={(isPercentage) => handleFeeTypeChange('easypaisaReceiving', isPercentage)}
                        onSlabsChange={(useSlabs, slabs) => handleSlabsChange('easypaisaReceiving', useSlabs, slabs || [])}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white">JazzCash Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      <ServiceFeeCard 
                        service={fees.jazzcashSending} 
                        serviceKey="jazzcashSending" 
                        icon={CreditCard}
                        color="text-orange-600 dark:text-orange-400"
                        inputValue={inputValues.jazzcashSending || String(fees.jazzcashSending.fee || '')}
                        onInputChange={(value) => handleInputChange('jazzcashSending', value)}
                        onInputBlur={() => handleInputBlur('jazzcashSending')}
                        onFeeTypeChange={(isPercentage) => handleFeeTypeChange('jazzcashSending', isPercentage)}
                        onSlabsChange={(useSlabs, slabs) => handleSlabsChange('jazzcashSending', useSlabs, slabs || [])}
                      />
                      <ServiceFeeCard 
                        service={fees.jazzcashReceiving} 
                        serviceKey="jazzcashReceiving" 
                        icon={CreditCard}
                        color="text-orange-600 dark:text-orange-400"
                        inputValue={inputValues.jazzcashReceiving || String(fees.jazzcashReceiving.fee || '')}
                        onInputChange={(value) => handleInputChange('jazzcashReceiving', value)}
                        onInputBlur={() => handleInputBlur('jazzcashReceiving')}
                        onFeeTypeChange={(isPercentage) => handleFeeTypeChange('jazzcashReceiving', isPercentage)}
                        onSlabsChange={(useSlabs, slabs) => handleSlabsChange('jazzcashReceiving', useSlabs, slabs || [])}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Banking Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      <ServiceFeeCard 
                        service={fees.bankTransfer} 
                        serviceKey="bankTransfer" 
                        icon={Banknote}
                        color="text-blue-600 dark:text-blue-400"
                        inputValue={inputValues.bankTransfer || String(fees.bankTransfer.fee || '')}
                        onInputChange={(value) => handleInputChange('bankTransfer', value)}
                        onInputBlur={() => handleInputBlur('bankTransfer')}
                        onFeeTypeChange={(isPercentage) => handleFeeTypeChange('bankTransfer', isPercentage)}
                        onSlabsChange={(useSlabs, slabs) => handleSlabsChange('bankTransfer', useSlabs, slabs || [])}
                      />
                      <ServiceFeeCard 
                        service={fees.billPayment} 
                        serviceKey="billPayment" 
                        icon={Receipt}
                        color="text-indigo-600 dark:text-indigo-400"
                        inputValue={inputValues.billPayment || String(fees.billPayment.fee || '')}
                        onInputChange={(value) => handleInputChange('billPayment', value)}
                        onInputBlur={() => handleInputBlur('billPayment')}
                        onFeeTypeChange={(isPercentage) => handleFeeTypeChange('billPayment', isPercentage)}
                        onSlabsChange={(useSlabs, slabs) => handleSlabsChange('billPayment', useSlabs, slabs || [])}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-4 sm:pt-6 border-t dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={handleResetToDefaults}
                      className="flex items-center justify-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 w-full sm:w-auto text-sm sm:text-base"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="hidden sm:inline">Reset to Defaults</span>
                      <span className="sm:hidden">Reset</span>
                    </Button>
                    <Button
                      onClick={handleSaveFees}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white w-full sm:w-auto text-sm sm:text-base"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">Save Fees Configuration</span>
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
