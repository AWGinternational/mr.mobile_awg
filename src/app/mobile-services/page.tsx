'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ShiftGuard } from '@/components/auth/shift-guard';
import { UserRole } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { BusinessSidebar } from '@/components/layout/BusinessSidebar';
import { TopNavigation } from '@/components/layout/TopNavigation';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Smartphone,
  Receipt,
  User,
  Phone,
  Tag,
  FileText,
  Plus,
  CheckCircle,
  Minus,
  ArrowRight,
} from 'lucide-react';

const SERVICE_TYPES = [
  { 
    value: 'EASYPAISA_CASHIN', 
    label: 'EasyPaisa Cash In', 
    brand: 'EasyPaisa',
    sublabel: 'Send Money',
    icon: ArrowDownCircle, 
    rate: 10,
    logo: '/images/services/easypaisa.png',
    gradient: 'from-emerald-500 to-green-600',
    lightBg: 'bg-emerald-50',
    darkBg: 'bg-emerald-500',
  },
  { 
    value: 'EASYPAISA_CASHOUT', 
    label: 'EasyPaisa Cash Out', 
    brand: 'EasyPaisa',
    sublabel: 'Receive Money',
    icon: ArrowUpCircle, 
    rate: 20,
    logo: '/images/services/easypaisa.png',
    gradient: 'from-emerald-500 to-green-600',
    lightBg: 'bg-emerald-50',
    darkBg: 'bg-emerald-500',
  },
  { 
    value: 'JAZZCASH_CASHIN', 
    label: 'JazzCash Cash In', 
    brand: 'JazzCash',
    sublabel: 'Send Money',
    icon: ArrowDownCircle, 
    rate: 10,
    logo: '/images/services/jazzcash.png',
    gradient: 'from-orange-500 to-red-500',
    lightBg: 'bg-orange-50',
    darkBg: 'bg-orange-500',
  },
  { 
    value: 'JAZZCASH_CASHOUT', 
    label: 'JazzCash Cash Out', 
    brand: 'JazzCash',
    sublabel: 'Receive Money',
    icon: ArrowUpCircle, 
    rate: 20,
    logo: '/images/services/jazzcash.png',
    gradient: 'from-orange-500 to-red-500',
    lightBg: 'bg-orange-50',
    darkBg: 'bg-orange-500',
  },
  { 
    value: 'BANK_TRANSFER', 
    label: 'Bank Transfer', 
    brand: 'Bank',
    sublabel: 'Direct Transfer',
    icon: Building2, 
    rate: 20,
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    darkBg: 'bg-blue-500',
  },
  { 
    value: 'MOBILE_LOAD', 
    label: 'Mobile Load', 
    brand: 'Mobile Load',
    sublabel: 'Balance Recharge',
    icon: Smartphone, 
    rate: 26,
    gradient: 'from-purple-500 to-pink-600',
    lightBg: 'bg-purple-50',
    darkBg: 'bg-purple-500',
  },
  { 
    value: 'BILL_PAYMENT', 
    label: 'Bill Payment', 
    brand: 'Bills',
    sublabel: 'Utility Bills',
    icon: Receipt, 
    rate: 10,
    gradient: 'from-gray-600 to-gray-800',
    lightBg: 'bg-gray-50',
    darkBg: 'bg-gray-600',
  },
];

const LOAD_PROVIDERS = [
  { 
    value: 'JAZZ', 
    label: 'Jazz', 
    color: 'text-red-600',
    logo: '/images/services/jazz.png',
    gradient: 'from-red-500 to-orange-600'
  },
  { 
    value: 'TELENOR', 
    label: 'Telenor', 
    color: 'text-blue-600',
    logo: '/images/services/telenor.png',
    gradient: 'from-blue-500 to-cyan-600'
  },
  { 
    value: 'ZONG', 
    label: 'Zong', 
    color: 'text-green-600',
    logo: '/images/services/zong.png',
    gradient: 'from-green-500 to-emerald-600'
  },
  { 
    value: 'UFONE', 
    label: 'Ufone', 
    color: 'text-pink-600',
    logo: '/images/services/ufone.png',
    gradient: 'from-pink-500 to-rose-600'
  },
];

function MobileServicesPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopFees, setShopFees] = useState<any>(null);

  // Form state
  const [serviceType, setServiceType] = useState('');
  const [loadProvider, setLoadProvider] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  
  // Actual commission charged (can differ from auto-calculated)
  const [actualCommission, setActualCommission] = useState('');
  
  // Keyboard navigation state
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(-1);
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(-1);

  // Fetch shop fees on mount
  useEffect(() => {
    const fetchShopFees = async () => {
      try {
        const response = await fetch('/api/settings/fees');
        const result = await response.json();
        if (response.ok && result.success && result.data?.fees) {
          setShopFees(result.data.fees);
        }
      } catch (error) {
        console.error('Error fetching shop fees:', error);
      }
    };
    
    if (session?.user) {
      fetchShopFees();
    }
  }, [session]);

  // Get commission rate based on service type
  const getCommissionRate = (serviceType: string) => {
    if (!shopFees) return { rate: 0, isPercentage: false, useSlabs: false, slabs: [] };
    
    switch (serviceType) {
      case 'MOBILE_LOAD':
        return { 
          rate: shopFees.mobileLoad?.fee || 0, 
          isPercentage: shopFees.mobileLoad?.isPercentage || false,
          useSlabs: shopFees.mobileLoad?.useSlabs || false,
          slabs: shopFees.mobileLoad?.slabs || []
        };
      case 'EASYPAISA_CASHIN':
        return { 
          rate: shopFees.easypaisaSending?.fee || 0, 
          isPercentage: shopFees.easypaisaSending?.isPercentage || false,
          useSlabs: shopFees.easypaisaSending?.useSlabs || false,
          slabs: shopFees.easypaisaSending?.slabs || []
        };
      case 'EASYPAISA_CASHOUT':
        return { 
          rate: shopFees.easypaisaReceiving?.fee || 0, 
          isPercentage: shopFees.easypaisaReceiving?.isPercentage || false,
          useSlabs: shopFees.easypaisaReceiving?.useSlabs || false,
          slabs: shopFees.easypaisaReceiving?.slabs || []
        };
      case 'JAZZCASH_CASHIN':
        return { 
          rate: shopFees.jazzcashSending?.fee || 0, 
          isPercentage: shopFees.jazzcashSending?.isPercentage || false,
          useSlabs: shopFees.jazzcashSending?.useSlabs || false,
          slabs: shopFees.jazzcashSending?.slabs || []
        };
      case 'JAZZCASH_CASHOUT':
        return { 
          rate: shopFees.jazzcashReceiving?.fee || 0, 
          isPercentage: shopFees.jazzcashReceiving?.isPercentage || false,
          useSlabs: shopFees.jazzcashReceiving?.useSlabs || false,
          slabs: shopFees.jazzcashReceiving?.slabs || []
        };
      case 'BANK_TRANSFER':
        return { 
          rate: shopFees.bankTransfer?.fee || 0, 
          isPercentage: shopFees.bankTransfer?.isPercentage || false,
          useSlabs: shopFees.bankTransfer?.useSlabs || false,
          slabs: shopFees.bankTransfer?.slabs || []
        };
      case 'BILL_PAYMENT':
        return { 
          rate: shopFees.billPayment?.fee || 0, 
          isPercentage: shopFees.billPayment?.isPercentage || false,
          useSlabs: shopFees.billPayment?.useSlabs || false,
          slabs: shopFees.billPayment?.slabs || []
        };
      default:
        return { rate: 0, isPercentage: false, useSlabs: false, slabs: [] };
    }
  };

  // Calculated values
  const selectedService = SERVICE_TYPES.find((s) => s.value === serviceType);
  const numericAmount = parseFloat(amount) || 0;
  const commissionInfo = getCommissionRate(serviceType);
  
  // Calculate commission based on fee structure
  const calculatedCommission = (() => {
    // If using slab-based fees, find the appropriate slab
    if (commissionInfo.useSlabs && commissionInfo.slabs && commissionInfo.slabs.length > 0) {
      const matchingSlab = commissionInfo.slabs.find(
        slab => numericAmount >= slab.minAmount && numericAmount <= slab.maxAmount
      );
      return matchingSlab ? matchingSlab.fee : 0;
    }
    
    // Otherwise use percentage or fixed rate
    if (commissionInfo.isPercentage) {
      return (numericAmount * commissionInfo.rate) / 100;  // Percentage formula: amount * (rate / 100)
    } else {
      return (numericAmount / 1000) * commissionInfo.rate;  // Rate per thousand: (amount / 1000) * rate
    }
  })();
  
  const numericDiscount = parseFloat(discount) || 0;
  
  // Auto-sync actualCommission with calculatedCommission when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      setActualCommission(calculatedCommission.toFixed(2));
    } else {
      setActualCommission('');
    }
  }, [calculatedCommission, amount]);
  
  // Use actual commission if provided, otherwise use calculated
  const finalCommission = actualCommission && parseFloat(actualCommission) >= 0
    ? parseFloat(actualCommission)
    : calculatedCommission;
  const netCommission = finalCommission - numericDiscount;

  // Keyboard navigation for service selection
  useEffect(() => {
    if (serviceType) return; // Only work when no service selected

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for service navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedServiceIndex((prev) => {
          const next = (prev + 1) % SERVICE_TYPES.length;
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedServiceIndex((prev) => {
          const next = prev <= 0 ? SERVICE_TYPES.length - 1 : prev - 1;
          return next;
        });
      } else if (e.key === 'Enter' && selectedServiceIndex >= 0) {
        e.preventDefault();
        setServiceType(SERVICE_TYPES[selectedServiceIndex].value);
        setSelectedServiceIndex(-1);
      } else if (e.key === 'Escape') {
        setSelectedServiceIndex(-1);
      }
      // Number keys 1-7 for quick service selection
      else if (e.key >= '1' && e.key <= '7') {
        const index = parseInt(e.key) - 1;
        if (index < SERVICE_TYPES.length) {
          setServiceType(SERVICE_TYPES[index].value);
          setSelectedServiceIndex(-1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [serviceType, selectedServiceIndex]);

  // Keyboard navigation for load provider selection
  useEffect(() => {
    if (serviceType !== 'MOBILE_LOAD' || loadProvider) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedProviderIndex((prev) => (prev + 1) % LOAD_PROVIDERS.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedProviderIndex((prev) => 
          prev <= 0 ? LOAD_PROVIDERS.length - 1 : prev - 1
        );
      } else if (e.key === 'Enter' && selectedProviderIndex >= 0) {
        e.preventDefault();
        setLoadProvider(LOAD_PROVIDERS[selectedProviderIndex].value);
        setSelectedProviderIndex(-1);
      } else if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (index < LOAD_PROVIDERS.length) {
          setLoadProvider(LOAD_PROVIDERS[index].value);
          setSelectedProviderIndex(-1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [serviceType, loadProvider, selectedProviderIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get commission info for the current service type
      const commissionInfo = getCommissionRate(serviceType);
      
      const response = await fetch('/api/mobile-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          loadProvider: serviceType === 'MOBILE_LOAD' ? loadProvider : null,
          customerName: customerName || null,
          phoneNumber: phoneNumber || null,
          amount: numericAmount,
          discount: numericDiscount,
          referenceId: referenceId || null,
          notes: notes || null,
          commissionRate: commissionInfo.rate, // Send calculated rate
          commission: finalCommission, // Use actual commission charged
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      // Show success notification
      toast({
        title: '✅ Transaction Completed',
        description: `Successfully processed Rs ${numericAmount.toLocaleString('en-PK')} - You earned Rs ${netCommission.toFixed(2)}`,
      });

      // Reset form
      setServiceType('');
      setLoadProvider('');
      setCustomerName('');
      setPhoneNumber('');
      setAmount('');
      setDiscount('0');
      setReferenceId('');
      setNotes('');
      setActualCommission('');
    } catch (error: any) {
      toast({
        title: '❌ Transaction Failed',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className={`flex-1 min-h-screen bg-gray-50 dark:bg-gray-900 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <div className="max-w-5xl mx-auto py-6 px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">New Transaction</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Select service and complete transaction</p>
          </div>

          {/* Modern Service Selection with Logos */}
          <Card className="mb-6 shadow-sm border-none bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Select Service
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {SERVICE_TYPES.map((service, index) => {
                const Icon = service.icon;
                const isSelected = serviceType === service.value;
                const isKeyboardSelected = selectedServiceIndex === index && !serviceType;
                
                return (
                  <button
                    key={service.value}
                    type="button"
                    onClick={() => {
                      setServiceType(service.value);
                      setSelectedServiceIndex(-1);
                    }}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                      isSelected 
                        ? `${service.lightBg} border-gray-900 shadow-md scale-105` 
                        : isKeyboardSelected
                        ? 'bg-blue-50 border-blue-400 shadow-lg scale-105 ring-4 ring-blue-200'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="p-4">
                      {/* Logo or Icon */}
                      <div className="mb-3 flex justify-center">
                        {service.logo ? (
                          <div className="h-10 w-10 relative">
                            <Image
                              src={service.logo}
                              alt={service.brand}
                              fill
                              className="object-contain"
                              onError={(e) => {
                                // Fallback to icon if image fails
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Service Name */}
                                            {/* Service Name & Brand */}
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-0.5">
                          {service.label}
                        </p>
                        <p className="text-[10px] text-gray-600">
                          {service.sublabel}
                        </p>
                      </div>
                    </div>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="h-5 w-5 rounded-full bg-gray-900 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Keyboard Navigation Indicator */}
                    {isKeyboardSelected && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
            </CardContent>
          </Card>

          {/* Form Card - Only show when service selected */}
          {serviceType && (
            <form onSubmit={handleSubmit}>
              <Card className="shadow-sm border-none bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Amount Input - Most Important */}
                    <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
                      <Label htmlFor="amount" className="text-base font-semibold text-gray-900 dark:text-white mb-3 block">
                        Transaction Amount (PKR)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 dark:text-gray-500">₨</span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          onKeyDown={(e) => {
                            // Allow Enter to submit when amount is filled
                            if (e.key === 'Enter' && amount && parseFloat(amount) > 0) {
                              e.preventDefault();
                              handleSubmit(e as any);
                            }
                          }}
                          placeholder="0.00"
                          className="pl-12 text-2xl font-bold h-16 border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Mobile Load Provider Selection */}
                    {serviceType === 'MOBILE_LOAD' && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Network Operator</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {LOAD_PROVIDERS.map((provider, index) => {
                            const isKeyboardSelected = selectedProviderIndex === index && !loadProvider;
                            return (
                            <button
                              key={provider.value}
                              type="button"
                              onClick={() => {
                                setLoadProvider(provider.value);
                                setSelectedProviderIndex(-1);
                              }}
                              className={`group relative overflow-hidden rounded-xl border-2 p-4 transition-all ${
                                loadProvider === provider.value
                                  ? 'border-gray-900 bg-gray-900 shadow-lg scale-105'
                                  : isKeyboardSelected
                                  ? 'border-blue-400 bg-blue-50 shadow-lg scale-105 ring-4 ring-blue-200'
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-2">
                                {/* Logo Image */}
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white p-2">
                                  <Image
                                    src={provider.logo}
                                    alt={provider.label}
                                    fill
                                    className="object-contain"
                                    onError={(e) => {
                                      // Fallback to gradient with text if image fails
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                                
                                {/* Provider Name */}
                                <span className={`text-sm font-semibold ${
                                  loadProvider === provider.value ? 'text-white' : provider.color
                                }`}>
                                  {provider.label}
                                </span>
                                
                                {/* Selected Checkmark */}
                                {loadProvider === provider.value && (
                                  <div className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </div>
                                )}
                                
                                {/* Keyboard Navigation Indicator */}
                                {isKeyboardSelected && (
                                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse" />
                                )}
                              </div>
                            </button>
                          );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Customer Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer Name
                        </Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Optional"
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </Label>
                        <Input
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="03xx-xxxxxxx"
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Discount (PKR)
                        </Label>
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="referenceId" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Reference ID
                        </Label>
                        <Input
                          id="referenceId"
                          value={referenceId}
                          onChange={(e) => setReferenceId(e.target.value)}
                          placeholder="Optional"
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Commission Summary */}
                    {amount && parseFloat(amount) > 0 && (
                      <div className={`bg-gradient-to-br ${selectedService?.gradient} rounded-xl p-5 text-white`}>
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="opacity-90 font-medium">Commission Details</span>
                        </div>
                        <div className="space-y-4">
                          {/* Auto-calculated commission (reference) */}
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="flex justify-between items-center text-sm opacity-90 mb-1">
                              <span>Auto Calculated {commissionInfo.isPercentage ? `(${commissionInfo.rate}%)` : `(PKR ${commissionInfo.rate}/1000)`}</span>
                              <span className="text-xs">Suggested</span>
                            </div>
                            <div className="text-2xl font-bold">Rs {calculatedCommission.toFixed(2)}</div>
                          </div>

                          {/* Actual amount charged (editable) */}
                          <div>
                            <Label className="text-white/90 text-sm mb-2 block">
                              💰 Actual Amount You Charged
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-white/70">₨</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={actualCommission}
                                onChange={(e) => setActualCommission(e.target.value)}
                                placeholder={calculatedCommission.toFixed(2)}
                                className="pl-10 h-14 text-xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/40 focus-visible:ring-white/50 focus-visible:border-white/50"
                              />
                            </div>
                            <p className="text-xs opacity-70 mt-1.5">
                              💡 Adjust if you charged different (e.g., round 15→20 or 45→50)
                            </p>
                          </div>

                          {/* Discount */}
                          {numericDiscount > 0 && (
                            <div className="flex justify-between items-center text-sm border-t border-white/20 pt-3">
                              <span className="flex items-center gap-2 opacity-90">
                                <Minus className="h-4 w-4" />
                                Discount Given
                              </span>
                              <span className="font-semibold">Rs {numericDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Net commission */}
                          <div className="border-t border-white/30 pt-3 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2 text-lg font-medium">
                                <ArrowRight className="h-5 w-5" />
                                You Earn
                              </span>
                              <span className="text-2xl font-bold">Rs {netCommission.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                        className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        {isSubmitting ? 'Processing...' : '✓ Complete Transaction'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setServiceType('');
                          setLoadProvider('');
                          setCustomerName('');
                          setPhoneNumber('');
                          setAmount('');
                          setDiscount('0');
                          setReferenceId('');
                          setNotes('');
                          setActualCommission('');
                        }}
                        className="h-12 px-6 border-2 font-medium"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap with ShiftGuard for workers only
export default function MobileServicesPage() {
  const { user } = useAuth()
  
  // Only apply shift guard for workers
  if (user?.role === UserRole.SHOP_WORKER) {
    return (
      <ShiftGuard>
        <MobileServicesPageContent />
      </ShiftGuard>
    )
  }
  
  // Owner can access without shift
  return <MobileServicesPageContent />
}

