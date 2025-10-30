'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useShopSettings } from '@/hooks/use-shop-settings'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ShiftGuard } from '@/components/auth/shift-guard'
import { UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BusinessSidebar } from '@/components/layout/BusinessSidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { SuccessDialog } from '@/components/ui/success-dialog'
import { ErrorDialog } from '@/components/ui/error-dialog'
import { Loader2 } from 'lucide-react'
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Scan,
  CreditCard,
  DollarSign,
  ArrowLeft,
  Package,
  User,
  Calculator,
  Receipt
} from 'lucide-react'

function POSSystem() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings: shopSettings, loading: settingsLoading } = useShopSettings()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [categories, setCategories] = useState<any[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [saleDetails, setSaleDetails] = useState<any>(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDetails, setErrorDetails] = useState<{ message: string; details?: string }>({ message: '' })
  
  // Tax percentage from shop settings (dynamically loaded)
  const [taxPercentage, setTaxPercentage] = useState(0) // Default 0% - Owner can configure in settings
  
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  
  // Update tax percentage when shop settings load
  useEffect(() => {
    if (shopSettings?.taxRate !== undefined) {
      setTaxPercentage(shopSettings.taxRate)
    }
  }, [shopSettings])
  
  // Keyboard navigation states
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  
  // NEW: Recent products and quick features
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorValue, setCalculatorValue] = useState('')
  const [quickQuantity, setQuickQuantity] = useState<number | null>(null)
  const [showQuickQuantityInput, setShowQuickQuantityInput] = useState(false)
  
  // NEW: Display limit for products (performance optimization)
  const [displayLimit, setDisplayLimit] = useState(20) // Show only 20 products initially

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Load products from API with debouncing
  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      loadProducts()
    }, 300) // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCategory])

  // Load cart on component mount
  useEffect(() => {
    loadCart()
  }, [])

  // Load customers when typing
  useEffect(() => {
    if (customerPhone && customerPhone.length > 3) {
      searchCustomers(customerPhone)
    }
  }, [customerPhone])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const result = await response.json()
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async () => {
    setProductsLoading(true)
    try {
      // If no search term, limit to 30 products for performance
      // With search, show up to 100 results
      const limit = searchTerm.length > 0 ? '100' : '30'
      
      const params = new URLSearchParams({
        search: searchTerm,
        limit: limit,
        status: 'ACTIVE'
      })
      
      // Add category filter if selected
      if (selectedCategory && selectedCategory !== 'ALL') {
        params.append('categoryId', selectedCategory)
      }
      
      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        console.error('Failed to load products - Response:', response.status)
        const errorText = await response.text()
        console.error('Error details:', errorText)
        // Fallback to mock data if API fails
        setProducts(mockProducts)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      // Fallback to mock data
      setProducts(mockProducts)
    } finally {
      setProductsLoading(false)
    }
  }

  const searchCustomers = async (phone: string) => {
    try {
      const response = await fetch(`/api/pos/customers?search=${encodeURIComponent(phone)}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error searching customers:', error)
    }
  }

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone || '')
    setCustomers([])
  }

  // Mock products for fallback
  const mockProducts = [
    {
      id: '1',
      name: 'iPhone 15 Pro Max',
      sku: 'APPLE-IP15PM-256',
      sellingPrice: 385000,
      stock: 5,
      brand: 'Apple'
    },
    {
      id: '2', 
      name: 'Samsung Galaxy S24 Ultra',
      sku: 'SAMSUNG-GS24U-256',
      sellingPrice: 310000,
      stock: 8,
      brand: 'Samsung'
    },
    {
      id: '3',
      name: 'Xiaomi 14 Pro',
      sku: 'XIAOMI-14P-256',
      sellingPrice: 120000,
      stock: 12,
      brand: 'Xiaomi'
    },
    {
      id: '4',
      name: 'Oppo Find X7',
      sku: 'OPPO-FX7-256',
      sellingPrice: 95000,
      stock: 6,
      brand: 'Oppo'
    }
  ]

  const filteredProducts = products.filter(product => {
    // Text search filter
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand?.name || product.brand)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === 'ALL' || 
      product.categoryId === selectedCategory ||
      product.category?.id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  })
  
  // Limit displayed products for performance (show first 20, user can load more)
  const displayedProducts = filteredProducts.slice(0, displayLimit)
  const hasMoreProducts = filteredProducts.length > displayLimit

  // Keyboard navigation for product selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation when search is focused
      if (!isSearchFocused) return
      
      const productsCount = displayedProducts.length
      if (productsCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedProductIndex((prev) => 
            prev < productsCount - 1 ? prev + 1 : 0
          )
          // Scroll to selected product
          scrollToProduct(selectedProductIndex + 1 < productsCount ? selectedProductIndex + 1 : 0)
          break
        
        case 'ArrowUp':
          e.preventDefault()
          setSelectedProductIndex((prev) => 
            prev > 0 ? prev - 1 : productsCount - 1
          )
          // Scroll to selected product
          scrollToProduct(selectedProductIndex > 0 ? selectedProductIndex - 1 : productsCount - 1)
          break
        
        case 'Enter':
          e.preventDefault()
          // ⌘+Enter or Ctrl+Enter - Quick checkout
          if (e.ctrlKey || e.metaKey) {
            if (cart.length > 0) {
              handleCheckout()
            }
          } 
          // Regular Enter - Add selected product to cart
          else if (displayedProducts[selectedProductIndex]) {
            const product = displayedProducts[selectedProductIndex]
            if ((product.stock || product.stockQuantity || 0) > 0) {
              addToCart(product)
              // Show quick feedback
              showQuickAddFeedback(product.name)
            }
          }
          break
        
        case 'Escape':
          e.preventDefault()
          setIsSearchFocused(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchFocused, displayedProducts, selectedProductIndex, cart])

  // Reset selected index when search term or category changes
  useEffect(() => {
    setSelectedProductIndex(0)
    setDisplayLimit(20) // Reset display limit when search/filter changes
  }, [searchTerm, selectedCategory])

  // Global keyboard shortcuts (Ctrl+P, F2, =, 1-9 for quantity)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P or Cmd+P - Print last receipt
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        if (lastSaleId) {
          generateReceipt(lastSaleId)
        }
      }
      
      // F2 - Jump to customer phone field
      if (e.key === 'F2') {
        e.preventDefault()
        document.getElementById('customer-phone-input')?.focus()
      }
      
      // = key - Open calculator
      if (e.key === '=' && !isSearchFocused && !showCalculator) {
        e.preventDefault()
        setShowCalculator(true)
      }
      
      // Escape - Close calculator
      if (e.key === 'Escape' && showCalculator) {
        e.preventDefault()
        setShowCalculator(false)
        setCalculatorValue('')
      }
      
      // Number keys 1-9 for quick quantity entry (when not in search)
      if (!isSearchFocused && !showCalculator && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        setQuickQuantity(Number(e.key))
        setShowQuickQuantityInput(true)
        // Auto-hide after 2 seconds
        setTimeout(() => {
          setShowQuickQuantityInput(false)
          setQuickQuantity(null)
        }, 2000)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isSearchFocused, showCalculator, lastSaleId])

  // Load recent products from last 5 sales
  useEffect(() => {
    loadRecentProducts()
  }, [cart]) // Reload when cart changes (after checkout)

  const loadRecentProducts = async () => {
    try {
      const response = await fetch('/api/pos/recent-products?limit=5')
      if (response.ok) {
        const data = await response.json()
        setRecentProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error loading recent products:', error)
    }
  }

  // Helper function to scroll to selected product
  const scrollToProduct = (index: number) => {
    const productElement = document.getElementById(`product-${index}`)
    if (productElement) {
      productElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  // Helper function to show quick add feedback
  const showQuickAddFeedback = (productName: string) => {
    // You can implement a toast notification here
  }

  const addToCart = async (product: any, quantity: number = 1) => {
    try {
      // Use quick quantity if set
      const actualQuantity = quickQuantity || quantity
      
      const response = await fetch('/api/pos/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: actualQuantity,
          unitPrice: product.sellingPrice || product.price
        })
      })

      if (response.ok) {
        await loadCart()
        // Add to recent products list
        if (!recentProducts.find(p => p.id === product.id)) {
          setRecentProducts([product, ...recentProducts.slice(0, 4)])
        }
        // Clear quick quantity after use
        if (quickQuantity) {
          setQuickQuantity(null)
          setShowQuickQuantityInput(false)
        }
      } else {
        // Fallback to local state if API fails
        const existingItem = cart.find(item => item.productId === product.id)
        
        if (existingItem) {
          setCart(cart.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + actualQuantity, totalPrice: Number(item.unitPrice) * (item.quantity + actualQuantity) }
              : item
          ))
        } else {
          const unitPrice = Number(product.sellingPrice || product.price || 0)
          setCart([...cart, {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: actualQuantity,
            unitPrice: unitPrice,
            totalPrice: unitPrice * actualQuantity
          }])
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const loadCart = async () => {
    try {
      const response = await fetch('/api/pos/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data.cart?.items || [])
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    try {
      const response = await fetch('/api/pos/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      })

      if (response.ok) {
        await loadCart()
      } else {
        // Fallback to local state
        setCart(cart.map(item =>
          item.productId === productId
            ? { 
                ...item, 
                quantity: newQuantity,
                totalPrice: Number(item.unitPrice) * newQuantity
              }
            : item
        ))
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      const response = await fetch('/api/pos/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        await loadCart()
      } else {
        // Fallback to local state
        setCart(cart.filter(item => item.productId !== productId))
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  const clearCart = async () => {
    try {
      const response = await fetch('/api/pos/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true })
      })

      if (response.ok) {
        await loadCart()
      } else {
        setCart([])
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      setCart([])
    }
  }

  // Calculator functions
  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      setCalculatorValue('')
    } else if (value === '=') {
      try {
        // Safe eval for simple arithmetic
        const result = Function('"use strict"; return (' + calculatorValue + ')')()
        setCalculatorValue(result.toString())
      } catch {
        setCalculatorValue('Error')
      }
    } else if (value === 'USE') {
      // Use calculated value as discount
      const amount = parseFloat(calculatorValue)
      if (!isNaN(amount)) {
        setDiscountAmount(amount)
        setDiscountType('fixed')
      }
      setShowCalculator(false)
      setCalculatorValue('')
    } else {
      setCalculatorValue(calculatorValue + value)
    }
  }

  const calculateTotal = () => {
    const total = cart.reduce((total, item) => total + Number(item.totalPrice || 0), 0)
    return total
  }

  const calculateDiscount = () => {
    const subtotal = calculateTotal()
    let discount = 0
    if (discountType === 'percentage') {
      discount = Math.round(subtotal * (discountAmount / 100))
    } else {
      discount = discountAmount
    }
    return discount
  }

  const calculateTax = () => {
    const subtotal = calculateTotal()
    const discount = calculateDiscount()
    const afterDiscount = subtotal - discount
    const tax = Math.round(afterDiscount * (taxPercentage / 100))
    return tax
  }

  const calculateGrandTotal = () => {
    const subtotal = calculateTotal()
    const discount = calculateDiscount()
    const tax = calculateTax()
    const grandTotal = subtotal - discount + tax
    return grandTotal
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorDetails({ 
        message: 'Your cart is empty!', 
        details: 'Please add some products to the cart before checking out.' 
      })
      setShowErrorDialog(true)
      return
    }

    setLoading(true)
    try {
      // Create or find customer if provided
      let customerId = selectedCustomer?.id
      
      if (!customerId && (customerName || customerPhone)) {
        const customerResponse = await fetch('/api/pos/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerName || 'Walk-in Customer',
            phone: customerPhone || undefined
          })
        })
        
        if (customerResponse.ok) {
          const customerData = await customerResponse.json()
          customerId = customerData.customer.id
        }
      }

      // Prepare checkout data
      const checkoutData = {
        customerId,
        paymentMethod,
        notes: `POS Sale by ${user?.name}`,
        taxPercentage,
        discountAmount: discountAmount, // Send the raw discount amount/percentage, not calculated value
        discountType
      }
      
      
      // Process checkout
      const checkoutResponse = await fetch('/api/pos/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      })

      if (checkoutResponse.ok) {
        const responseData = await checkoutResponse.json()
        setLastSaleId(responseData.sale.id)
        
        // Set sale details for success dialog
        setSaleDetails({
          invoiceNumber: responseData.sale.invoiceNumber,
          totalAmount: responseData.sale.totalAmount,
          customerName: customerName || 'Walk-in Customer',
          paymentMethod: paymentMethod
        })
        
        // Clear cart and customer info
        await clearCart()
        setCustomerName('')
        setCustomerPhone('')
        setSelectedCustomer(null)
        
        // Reset discount and tax to defaults
        setDiscountAmount(0)
        setDiscountType('percentage')
        setTaxPercentage(17)
        
        // Refresh products to update stock levels
        await loadProducts()
        
        // Show success dialog
        setShowSuccessDialog(true)
      } else {
        const errorData = await checkoutResponse.json()
        console.error('Checkout API error:', errorData)
        setErrorDetails({
          message: `Checkout Failed`,
          details: errorData.error || errorData.details || 'An error occurred during checkout. Please try again.'
        })
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setErrorDetails({
        message: 'Checkout Failed',
        details: error instanceof Error ? error.message : 'Network error. Please check your connection and try again.'
      })
      setShowErrorDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const generateReceipt = async (saleId: string) => {
    try {
      // Open receipt in new window for printing
      const receiptWindow = window.open(`/api/pos/receipt/${saleId}`, '_blank', 'width=800,height=600')
      if (receiptWindow) {
        receiptWindow.focus()
      } else {
        setErrorDetails({
          message: 'Pop-up Blocked',
          details: 'Please allow pop-ups to view the receipt. You can also print from the sales page.'
        })
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error generating receipt:', error)
      setErrorDetails({
        message: 'Receipt Generation Failed',
        details: error instanceof Error ? error.message : 'Failed to open receipt window'
      })
      setShowErrorDialog(true)
    }
  }

  const startBarcodeScanning = async () => {
    setScannerError(null)
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerError('Camera not supported on this device')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera
        } 
      })
      
      setShowBarcodeScanner(true)
      
      // Create video element for scanning
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      // This is a simplified version - in production you'd use a proper barcode scanning library
      // like QuaggaJS or ZXing
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop())
        setShowBarcodeScanner(false)
        // Simulate barcode scan result
        const mockBarcode = 'APPLE-IP15PM-256'
        searchByBarcode(mockBarcode)
      }, 3000)
      
    } catch (error) {
      console.error('Camera error:', error)
      setScannerError('Unable to access camera. Please check permissions.')
    }
  }

  const searchByBarcode = async (barcode: string) => {
    try {
      const response = await fetch(`/api/products?query=${encodeURIComponent(barcode)}`)
      if (response.ok) {
        const data = await response.json()
        const products = data.products || []
        if (products.length > 0) {
          await addToCart(products[0])
          // Product found and added successfully
        } else {
          setErrorDetails({
            message: 'Product Not Found',
            details: `No product found with barcode: ${barcode}`
          })
          setShowErrorDialog(true)
        }
      }
    } catch (error) {
      console.error('Error searching by barcode:', error)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* POS Header with gradient like other pages */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => router.back()}
                      className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 shrink-0"
                      title="Back"
                    >
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 truncate">🛒 POS System</h1>
                      <p className="text-green-100 text-sm sm:text-base">Point of Sale - {user?.shops?.[0]?.name || 'Ali Mobile Center'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="hidden sm:block text-right">
                      <p className="text-green-100 text-xs">Operator</p>
                      <p className="font-semibold text-white text-sm">{user?.name}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={clearCart} 
                      disabled={cart.length === 0}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 px-3 sm:px-4 text-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Clear Cart</span>
                      <span className="sm:hidden">Clear</span>
                    </Button>
                    {lastSaleId && (
                      <Button 
                        variant="outline" 
                        onClick={() => generateReceipt(lastSaleId)}
                        className="bg-white text-green-600 hover:bg-green-50 h-9 sm:h-10 px-3 sm:px-4 text-sm"
                      >
                        <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Last Receipt</span>
                        <span className="sm:hidden">Receipt</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main POS Interface */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Product Search & Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Product Selection
                  </CardTitle>
                  
                  {/* Category Filter */}
                  <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                      size="sm"
                      variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory('ALL')}
                      className="whitespace-nowrap h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    >
                      All Products
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        size="sm"
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(category.id)}
                        className="whitespace-nowrap h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className={`pl-8 sm:pl-10 h-9 sm:h-10 text-sm ${isSearchFocused ? 'ring-2 ring-blue-500' : ''}`}
                        autoFocus
                      />
                      {isSearchFocused && displayedProducts.length > 0 && (
                        <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                          {selectedProductIndex + 1}/{displayedProducts.length}
                          {hasMoreProducts && ` of ${filteredProducts.length}`}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline"
                      onClick={startBarcodeScanning}
                      disabled={showBarcodeScanner}
                      className="h-9 sm:h-10 px-2 sm:px-3"
                    >
                      <Scan className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{showBarcodeScanner ? 'Scanning...' : 'Scan'}</span>
                    </Button>
                  </div>
                  {scannerError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {scannerError}
                    </div>
                  )}
                  {showBarcodeScanner && (
                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded text-center">
                      <div className="animate-pulse">
                        <Scan className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-700">Camera scanning active...</p>
                        <p className="text-xs text-blue-600">Point camera at barcode</p>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Recent Products Section */}
                  {recentProducts.length > 0 && !searchTerm && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🔥</span>
                          <h3 className="text-base font-bold text-gray-800 dark:text-white">Recent Products</h3>
                        </div>
                        <Badge className="bg-orange-500 text-white">Quick Add</Badge>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                        {recentProducts.map((product) => (
                          <Card 
                            key={product.id}
                            className="min-w-[220px] flex-shrink-0 border-2 border-gray-200 hover:border-orange-400 hover:shadow-xl transition-all duration-200 cursor-pointer group"
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-4">
                              <div className="mb-3">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-orange-600 transition-colors">
                                  {product.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono mt-0.5">
                                  {product.sku}
                                </p>
                                {product.brand && (
                                  <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded mt-1">
                                    {typeof product.brand === 'string' ? product.brand : product.brand.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-lg font-extrabold text-green-600 mb-3">
                                PKR {(product.sellingPrice || product.price || 0).toLocaleString()}
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full h-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md group-hover:shadow-lg transition-all"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Quick Add
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-4 mb-4"></div>
                    </div>
                  )}

                  {productsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
                      <span className="ml-2 text-gray-500 dark:text-gray-400">Loading products...</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {displayedProducts.map((product, index) => (
                          <Card 
                            key={product.id} 
                            id={`product-${index}`}
                            className={`group relative overflow-hidden transition-all duration-200 cursor-pointer border-2
                              ${index === selectedProductIndex && isSearchFocused
                                ? 'ring-4 ring-blue-400 ring-offset-2 shadow-xl scale-[1.02] border-blue-500'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                              }`}
                            onClick={() => {
                              if ((product.stock || product.stockQuantity || 0) > 0) {
                                addToCart(product)
                              }
                            }}
                          >
                            {/* Selected Indicator Badge */}
                            {index === selectedProductIndex && isSearchFocused && (
                              <div className="absolute top-2 right-2 z-10">
                                <Badge className="bg-blue-500 text-white animate-pulse">
                                  ⌨️ Selected
                                </Badge>
                              </div>
                            )}
                            
                            {/* Stock Badge - Top Left */}
                            {(product.stock !== undefined || product.stockQuantity !== undefined) && (
                              <div className="absolute top-2 left-2 z-10">
                                <Badge 
                                  variant={(product.stock || product.stockQuantity || 0) > 0 ? "default" : "destructive"}
                                  className={(product.stock || product.stockQuantity || 0) > 0 ? "bg-green-500" : "bg-red-500"}
                                >
                                  {(product.stock || product.stockQuantity || 0) > 0 
                                    ? `${product.stock || product.stockQuantity || 0} in stock` 
                                    : 'Out of stock'}
                                </Badge>
                              </div>
                            )}

                            <CardContent className="p-5 pt-10">
                              {/* Product Name */}
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {product.name}
                              </h3>
                              
                              {/* Brand & SKU */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                  {typeof product.brand === 'string' ? product.brand : (product.brand?.name || 'N/A')}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {product.sku}
                                </span>
                              </div>

                              {/* Model */}
                              {product.model && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 italic">
                                  Model: {product.model}
                                </p>
                              )}

                              {/* Price - Large & Bold */}
                              <div className="mt-3 mb-4">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-extrabold text-green-600">
                                    PKR {(product.sellingPrice || product.price || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Add to Cart Button */}
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToCart(product)
                                }}
                                disabled={
                                  (product.stock || product.stockQuantity || 0) === 0 ||
                                  loading
                                }
                                className={`w-full font-semibold transition-all duration-200 ${
                                  (product.stock || product.stockQuantity || 0) > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                    : 'bg-gray-300 cursor-not-allowed'
                                }`}
                                size="lg"
                              >
                                <Plus className="h-5 w-5 mr-2" />
                                {index === selectedProductIndex && isSearchFocused 
                                  ? '⏎ Press Enter to Add' 
                                  : (product.stock || product.stockQuantity || 0) === 0
                                    ? 'Out of Stock'
                                    : 'Add to Cart'}
                              </Button>
                            </CardContent>

                            {/* Hover Effect Border */}
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg transition-all pointer-events-none"></div>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Load More Button - Only show if there are more products */}
                      {hasMoreProducts && !productsLoading && (
                        <div className="text-center mt-6">
                          <Button 
                            variant="outline" 
                            onClick={() => setDisplayLimit(prev => prev + 20)}
                            className="w-full md:w-auto px-8 py-6 text-base font-semibold border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-all"
                          >
                            <Loader2 className="h-5 w-5 mr-2" />
                            Load {Math.min(20, filteredProducts.length - displayLimit)} More Products
                            <Badge className="ml-2 bg-blue-500">{filteredProducts.length - displayLimit} remaining</Badge>
                          </Button>
                        </div>
                      )}
                      
                      {/* Show total count */}
                      {filteredProducts.length > 0 && (
                        <div className="text-center mt-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Showing <span className="font-bold text-blue-600 dark:text-blue-400">{displayedProducts.length}</span> of <span className="font-bold text-gray-800 dark:text-white">{filteredProducts.length}</span> products
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!productsLoading && filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                      <div className="inline-block p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                        <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">No Products Found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchTerm 
                          ? `No products match "${searchTerm}". Try a different search term.`
                          : 'No products available in this category.'}
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          onClick={() => setSearchTerm('')}
                          className="mt-2"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Shopping Cart & Checkout */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Shopping Cart
                    </span>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      {cart.length} item(s)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Customer Information */}
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium dark:text-white">Customer Information</span>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Customer name (optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <div className="relative">
                        <Input
                          id="customer-phone-input"
                          placeholder="Phone number (optional)"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                        {customers.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {customers.map((customer) => (
                              <div
                                key={customer.id}
                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => selectCustomer(customer)}
                              >
                                <div className="text-sm font-medium dark:text-white">{customer.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedCustomer && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                          <div className="text-xs">
                            <div className="font-medium dark:text-white">{selectedCustomer.name}</div>
                            <div className="text-gray-500 dark:text-gray-400">Customer found</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(null)
                              setCustomerName('')
                              setCustomerPhone('')
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Cart is empty</p>
                        <p className="text-xs">Add products to get started</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.productSku}</p>
                            <p className="text-sm font-semibold text-green-600">
                              PKR {Number(item.unitPrice || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.productId)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cart Summary */}
                  {cart.length > 0 && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>PKR {calculateTotal().toLocaleString()}</span>
                      </div>
                      
                      {/* Discount Control */}
                      <div className="space-y-2 py-2 border-y">
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Discount</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              value={discountAmount === 0 ? '' : discountAmount}
                              onChange={(e) => setDiscountAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                              placeholder="0"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant={discountType === 'percentage' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setDiscountType('percentage')}
                              className="h-8 px-3 text-xs"
                            >
                              %
                            </Button>
                            <Button
                              variant={discountType === 'fixed' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setDiscountType('fixed')}
                              className="h-8 px-3 text-xs"
                            >
                              PKR
                            </Button>
                          </div>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-xs text-green-600">
                            <span>Discount Applied:</span>
                            <span>- PKR {calculateDiscount().toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Tax Control - connected to shop settings */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tax Rate (%)</Label>
                          {shopSettings && shopSettings.taxRate !== taxPercentage && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                              Shop Default: {shopSettings.taxRate}%
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={taxPercentage === 0 ? '' : taxPercentage}
                            onChange={(e) => setTaxPercentage(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="h-8 text-sm flex-1"
                            placeholder={`Default: ${shopSettings?.taxRate || 17}%`}
                          />
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTaxPercentage(0)}
                              className="h-8 px-2 text-xs"
                            >
                              0%
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTaxPercentage(shopSettings?.taxRate || 17)}
                              className="h-8 px-2 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              title="Reset to shop default"
                            >
                              Default
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Tax ({taxPercentage}%):</span>
                          <span>PKR {calculateTax().toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">PKR {calculateGrandTotal().toLocaleString()}</span>
                      </div>

                      {/* Payment Method - filtered by shop settings */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {shopSettings?.enableCash && (
                            <Button
                              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPaymentMethod('cash')}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Cash
                            </Button>
                          )}
                          {shopSettings?.enableCard && (
                            <Button
                              variant={paymentMethod === 'card' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPaymentMethod('card')}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Card
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {shopSettings?.enableEasyPaisa && (
                            <Button
                              variant={paymentMethod === 'easypaisa' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPaymentMethod('easypaisa')}
                              className="text-xs"
                            >
                              📱 EasyPaisa
                            </Button>
                          )}
                          {shopSettings?.enableJazzCash && (
                            <Button
                              variant={paymentMethod === 'jazzcash' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPaymentMethod('jazzcash')}
                              className="text-xs"
                            >
                              📱 JazzCash
                            </Button>
                          )}
                        </div>
                        {shopSettings?.enableBankTransfer && (
                          <Button
                            variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className="w-full text-xs"
                          >
                            🏦 Bank Transfer
                          </Button>
                        )}
                        
                        {/* Show warning if no payment methods enabled */}
                        {!shopSettings?.enableCash && !shopSettings?.enableCard && 
                         !shopSettings?.enableEasyPaisa && !shopSettings?.enableJazzCash && 
                         !shopSettings?.enableBankTransfer && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-200">
                            ⚠️ No payment methods enabled. Please configure in Shop Settings.
                          </div>
                        )}
                      </div>

                      {/* Checkout Button */}
                      <Button
                        onClick={handleCheckout}
                        disabled={loading || cart.length === 0}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Receipt className="h-4 w-4 mr-2" />
                            Complete Sale (⌘+Enter)
                          </>
                        )}
                      </Button>

                      {/* Keyboard Shortcuts Info */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">⌨️ Keyboard Shortcuts</p>
                        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                          <div className="flex justify-between">
                            <span>Navigate products:</span>
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">↑ ↓</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Add to cart:</span>
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">Enter</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quick quantity:</span>
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">1-9</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Complete sale:</span>
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">⌘+Enter</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Print receipt:</span>
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">⌘+P</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Calculator:</span>
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">=</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Customer field:</span>
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">F2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </div>

        {/* Quick Quantity Indicator */}
        {showQuickQuantityInput && quickQuantity && (
          <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-5">
            <Card className="bg-green-500 text-white shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold">{quickQuantity}</div>
                  <div className="text-sm">
                    <div className="font-semibold">Quick Quantity</div>
                    <div className="text-xs opacity-90">Next item will add × {quickQuantity}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calculator Modal */}
        {showCalculator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCalculator(false)}>
            <Card className="w-80" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculator
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowCalculator(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={calculatorValue}
                  readOnly
                  className="text-right text-2xl font-mono mb-4 h-14"
                  placeholder="0"
                />
                <div className="grid grid-cols-4 gap-2">
                  {['7', '8', '9', '/'].map((btn) => (
                    <Button key={btn} variant="outline" onClick={() => handleCalculatorInput(btn)}>{btn}</Button>
                  ))}
                  {['4', '5', '6', '*'].map((btn) => (
                    <Button key={btn} variant="outline" onClick={() => handleCalculatorInput(btn)}>{btn}</Button>
                  ))}
                  {['1', '2', '3', '-'].map((btn) => (
                    <Button key={btn} variant="outline" onClick={() => handleCalculatorInput(btn)}>{btn}</Button>
                  ))}
                  {['0', '.', '=', '+'].map((btn) => (
                    <Button key={btn} variant="outline" onClick={() => handleCalculatorInput(btn)}>{btn}</Button>
                  ))}
                  <Button variant="destructive" className="col-span-2" onClick={() => handleCalculatorInput('C')}>
                    Clear
                  </Button>
                  <Button variant="default" className="col-span-2 bg-green-600 hover:bg-green-700" onClick={() => handleCalculatorInput('USE')}>
                    Use as Discount
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Dialog */}
        <SuccessDialog
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          title="Sale Completed Successfully!"
          message="Your transaction has been processed and recorded."
          details={saleDetails}
          showReceiptOption={true}
          onGenerateReceipt={() => {
            if (lastSaleId) {
              generateReceipt(lastSaleId)
              setShowSuccessDialog(false)
            }
          }}
        />

        {/* Error Dialog */}
        <ErrorDialog
          open={showErrorDialog}
          onClose={() => setShowErrorDialog(false)}
          message={errorDetails.message}
          details={errorDetails.details}
        />
      </div>
    </ProtectedRoute>
  )
}

// Wrap with ShiftGuard for workers only
export default function POSWithShiftGuard() {
  const { user } = useAuth()
  
  // Only apply shift guard for workers
  if (user?.role === UserRole.SHOP_WORKER) {
    return (
      <ShiftGuard>
        <POSSystem />
      </ShiftGuard>
    )
  }
  
  // Owner can access without shift
  return <POSSystem />
}


