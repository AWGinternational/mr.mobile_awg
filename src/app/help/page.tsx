'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  HelpCircle,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  FileText,
  Settings,
  Video,
  BookOpen,
  MessageCircle,
  Search,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Smartphone,
  Truck,
  CreditCard,
  BarChart3
} from 'lucide-react'

interface Tutorial {
  id: string
  title: string
  description: string
  icon: any
  category: 'basics' | 'sales' | 'inventory' | 'reports' | 'advanced'
  duration: string
  steps: string[]
  videoUrl?: string
}

const tutorials: Tutorial[] = [
  {
    id: 'pos-basics',
    title: 'POS System - Selling Products',
    description: 'Learn how to sell products and complete transactions',
    icon: ShoppingCart,
    category: 'basics',
    duration: '5 min',
    steps: [
      '1. Open POS System from sidebar',
      '2. Search for product by name or scan barcode',
      '3. Click on product to add to cart',
      '4. Enter customer details (optional)',
      '5. Select payment method (Cash, EasyPaisa, JazzCash, Bank)',
      '6. Click "Complete Sale" button',
      '7. Print receipt or send via WhatsApp'
    ]
  },
  {
    id: 'add-product',
    title: 'Adding New Products',
    description: 'How to add new mobile phones to inventory',
    icon: Package,
    category: 'basics',
    duration: '3 min',
    steps: [
      '1. Go to Products from sidebar',
      '2. Click "+ Add Product" button',
      '3. Enter product name (e.g., iPhone 15 Pro)',
      '4. Enter model number',
      '5. Select category and brand',
      '6. Enter cost price and selling price',
      '7. Add initial stock quantity',
      '8. Click "Create Product"'
    ]
  },
  {
    id: 'daily-closing',
    title: 'Daily Closing - End of Day',
    description: 'Complete your daily cash reconciliation',
    icon: DollarSign,
    category: 'basics',
    duration: '7 min',
    steps: [
      '1. Go to Daily Closing from sidebar',
      '2. System auto-fills mobile services data',
      '3. Enter load services (Jazz, Telenor, Zong, Ufone)',
      '4. Enter banking services (EasyPaisa, JazzCash)',
      '5. Add other income (commissions, bank amount)',
      '6. Enter expenses (rent, salary, electricity)',
      '7. Verify totals match physical cash',
      '8. Click "Submit Daily Closing"'
    ]
  },
  {
    id: 'customer-management',
    title: 'Managing Customers',
    description: 'Add and track customer information',
    icon: Users,
    category: 'sales',
    duration: '4 min',
    steps: [
      '1. Go to Customers from sidebar',
      '2. Click "+ Add Customer" button',
      '3. Enter customer name and phone',
      '4. Add address and CNIC (optional)',
      '5. View customer purchase history',
      '6. Track customer loans/installments'
    ]
  },
  {
    id: 'inventory-management',
    title: 'Managing Stock/Inventory',
    description: 'Track and update product stock levels',
    icon: Package,
    category: 'inventory',
    duration: '5 min',
    steps: [
      '1. Go to Inventory from sidebar',
      '2. View all products with stock levels',
      '3. Low stock items shown in red',
      '4. Click "Add Stock" to increase quantity',
      '5. Enter cost price and quantity',
      '6. System tracks stock movements automatically',
      '7. Set low stock alerts for each product'
    ]
  },
  {
    id: 'mobile-services',
    title: 'Mobile Services & Banking',
    description: 'Record load services and banking transactions',
    icon: Smartphone,
    category: 'sales',
    duration: '4 min',
    steps: [
      '1. Go to Online Banking from sidebar',
      '2. Click "New Transaction"',
      '3. Select service type (Jazz Load, EasyPaisa, etc.)',
      '4. Enter transaction amount',
      '5. Enter commission earned',
      '6. Add customer reference (optional)',
      '7. Submit transaction',
      '8. Data auto-appears in Daily Closing'
    ]
  },
  {
    id: 'reports-viewing',
    title: 'Viewing Sales Reports',
    description: 'Check daily, weekly, and monthly reports',
    icon: BarChart3,
    category: 'reports',
    duration: '3 min',
    steps: [
      '1. Go to Reports from sidebar',
      '2. View today\'s sales summary',
      '3. Check total revenue and profit',
      '4. See top-selling products',
      '5. Export reports to Excel',
      '6. Filter by date range',
      '7. View payment method breakdown'
    ]
  },
  {
    id: 'supplier-management',
    title: 'Managing Suppliers',
    description: 'Add suppliers and track purchases',
    icon: Truck,
    category: 'advanced',
    duration: '5 min',
    steps: [
      '1. Go to Suppliers from sidebar',
      '2. Click "+ Add Supplier" button',
      '3. Enter supplier name and contact',
      '4. Add company details',
      '5. Track purchase orders',
      '6. View payment history',
      '7. Manage credit terms'
    ]
  },
  {
    id: 'worker-permissions',
    title: 'Adding Workers & Permissions',
    description: 'Set up worker accounts with limited access',
    icon: Settings,
    category: 'advanced',
    duration: '6 min',
    steps: [
      '1. Go to Settings > Workers (Owner only)',
      '2. Click "+ Add Worker" button',
      '3. Enter worker name and phone',
      '4. Create login credentials',
      '5. Select permissions (POS, Inventory, etc.)',
      '6. Workers need approval for updates/deletes',
      '7. Monitor worker activities'
    ]
  },
  {
    id: 'loan-management',
    title: 'Customer Loans & Installments',
    description: 'Manage customer credit and payment plans',
    icon: CreditCard,
    category: 'advanced',
    duration: '6 min',
    steps: [
      '1. Go to Loans from sidebar',
      '2. Click "Create Loan" button',
      '3. Select customer',
      '4. Enter loan amount and terms',
      '5. Set installment schedule',
      '6. Record payments as received',
      '7. Track remaining balance',
      '8. Send payment reminders'
    ]
  }
]

const faqs = [
  {
    question: 'کیا میں اپنے موبائل فون سے بھی استعمال کر سکتا ہوں؟',
    answer: 'جی ہاں، یہ سافٹ ویئر موبائل، ٹیبلیٹ اور کمپیوٹر تینوں پر کام کرتا ہے۔'
  },
  {
    question: 'What happens if internet connection is lost?',
    answer: 'The system stores data locally and syncs when internet returns. You can continue working offline.'
  },
  {
    question: 'کیا ورکر میرے ڈیٹا کو ڈیلیٹ کر سکتا ہے؟',
    answer: 'نہیں، ورکر صرف دیکھ سکتا ہے۔ ڈیلیٹ یا اپڈیٹ کے لیے آپ کی منظوری ضروری ہے۔'
  },
  {
    question: 'How do I backup my data?',
    answer: 'Data is automatically backed up to cloud servers. You can also export reports as Excel files.'
  },
  {
    question: 'ڈیلی کلوزنگ کیوں ضروری ہے؟',
    answer: 'یہ آپ کے روزانہ کے کیش، فروخت اور منافع کو ٹریک کرتا ہے۔ اس سے حساب درست رہتا ہے۔'
  },
  {
    question: 'Can I use barcode scanner?',
    answer: 'Yes! Click the scan icon in POS system or press Ctrl+B. Supports USB and Bluetooth scanners.'
  }
]

function HelpCenter() {
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || tutorial.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basics: 'بنیادی - Basics',
      sales: 'فروخت - Sales',
      inventory: 'اسٹاک - Inventory',
      reports: 'رپورٹس - Reports',
      advanced: 'ایڈوانس - Advanced'
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      basics: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      inventory: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      reports: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      advanced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    }
    return colors[category] || 'bg-gray-100 text-gray-700'
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="mb-3 sm:mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <div className="flex items-start gap-2 sm:gap-3 mb-2">
                  <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                    <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">
                      Help Center - مدد سینٹر
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
                      Learn how to use the software - سافٹ ویئر استعمال کرنا سیکھیں
                    </p>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <Card className="mb-4 sm:mb-6">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <Input
                        placeholder="Search tutorials... تلاش کریں"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={categoryFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setCategoryFilter('all')}
                        size="sm"
                        className="text-xs sm:text-sm h-8"
                      >
                        All
                      </Button>
                      <Button
                        variant={categoryFilter === 'basics' ? 'default' : 'outline'}
                        onClick={() => setCategoryFilter('basics')}
                        size="sm"
                        className="text-xs sm:text-sm h-8"
                      >
                        Basics
                      </Button>
                      <Button
                        variant={categoryFilter === 'sales' ? 'default' : 'outline'}
                        onClick={() => setCategoryFilter('sales')}
                        size="sm"
                        className="text-xs sm:text-sm h-8"
                      >
                        Sales
                      </Button>
                      <Button
                        variant={categoryFilter === 'inventory' ? 'default' : 'outline'}
                        onClick={() => setCategoryFilter('inventory')}
                        size="sm"
                        className="text-xs sm:text-sm h-8"
                      >
                        Inventory
                      </Button>
                      <Button
                        variant={categoryFilter === 'reports' ? 'default' : 'outline'}
                        onClick={() => setCategoryFilter('reports')}
                        size="sm"
                        className="text-xs sm:text-sm h-8"
                      >
                        Reports
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tutorial Grid */}
              {!selectedTutorial ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                  {filteredTutorials.map((tutorial) => {
                    const Icon = tutorial.icon
                    return (
                      <Card
                        key={tutorial.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                        onClick={() => setSelectedTutorial(tutorial)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <Badge className={getCategoryColor(tutorial.category)}>
                              {getCategoryLabel(tutorial.category)}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                          <CardDescription>{tutorial.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <PlayCircle className="h-4 w-4" />
                              {tutorial.duration}
                            </span>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                /* Tutorial Detail View */
                <Card className="mb-8">
                  <CardHeader>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedTutorial(null)}
                      className="mb-4 w-fit"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Tutorials
                    </Button>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {React.createElement(selectedTutorial.icon, { 
                          className: "h-8 w-8 text-blue-600 dark:text-blue-400" 
                        })}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{selectedTutorial.title}</CardTitle>
                        <CardDescription className="text-base">{selectedTutorial.description}</CardDescription>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge className={getCategoryColor(selectedTutorial.category)}>
                            {getCategoryLabel(selectedTutorial.category)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Duration: {selectedTutorial.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Step by Step Guide - قدم بہ قدم گائیڈ
                    </h3>
                    <div className="space-y-3">
                      {selectedTutorial.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700 dark:text-gray-300">{step}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* FAQ Section */}
              {!selectedTutorial && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-6 w-6" />
                      Frequently Asked Questions - عام سوالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {faq.question}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact Support */}
              {!selectedTutorial && (
                <Card className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600">
                  <CardContent className="p-6 text-center text-white">
                    <h3 className="text-xl font-bold mb-2">Need More Help? - مزید مدد چاہیے؟</h3>
                    <p className="mb-4">Contact our support team for assistance</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                      <Button variant="secondary" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Support
                      </Button>
                      <Button variant="secondary" className="gap-2">
                        <Video className="h-4 w-4" />
                        Video Call Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default HelpCenter
