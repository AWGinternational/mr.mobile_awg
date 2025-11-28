'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types'
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  DollarSign,
  Truck,
  CreditCard,
  FileText,
  Smartphone,
  Store,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Grid,
  List,
  ShoppingBag,
  Banknote,
  Plus,
  ClipboardCheck,
  Clock,
  MessageSquare // 💬 MESSAGES ICON
} from 'lucide-react'

// Custom EasyPaisa Icon Component
const EasyPaisaIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`relative flex-shrink-0 ${className || 'h-5 w-5'}`}>
      <Image
        src="/images/services/easypaisa.png"
        alt="EasyPaisa"
        fill
        sizes="20px"
        className="object-contain"
        onError={(e) => {
          // Fallback to Banknote icon if image fails
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface SubModule {
  name: string
  path: string
  icon: any
}

interface Module {
  name: string
  icon: any
  path?: string
  color: string
  bgColor: string
  subModules?: SubModule[]
  systemModule?: string // Maps to SystemModule enum
}

interface WorkerPermissions {
  [module: string]: string[] // e.g., { 'POS_SYSTEM': ['VIEW', 'CREATE'] }
}

export function BusinessSidebar({ isOpen = false, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user: currentUser } = useAuth()
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [workerPermissions, setWorkerPermissions] = useState<WorkerPermissions>({})
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  // Check user role
  const isOwner = currentUser?.role === UserRole.SHOP_OWNER || currentUser?.role === UserRole.SUPER_ADMIN
  const isWorker = currentUser?.role === UserRole.SHOP_WORKER

  // Fetch worker permissions if user is a worker
  useEffect(() => {
    if (isWorker && currentUser?.id) {
      fetch('/api/workers/my-permissions')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.permissions) {
            setWorkerPermissions(data.permissions)
          }
          setPermissionsLoaded(true)
        })
        .catch(err => {
          console.error('Failed to fetch worker permissions:', err)
          setPermissionsLoaded(true)
        })
    } else {
      setPermissionsLoaded(true)
    }
  }, [isWorker, currentUser?.id])

  // Determine dashboard path based on user role
  const dashboardPath = React.useMemo(() => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) return '/dashboard/admin'
    if (currentUser?.role === UserRole.SHOP_WORKER) return '/dashboard/worker'
    return '/dashboard/owner'
  }, [currentUser?.role])

  const allModules: Module[] = [
    // 1. Dashboard - Overview of everything
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: dashboardPath, 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-50',
      systemModule: 'DASHBOARD' // Not in DB, always visible
    },
    
    // 1.5 My Requests - Worker approval requests (Workers only)
    { 
      name: 'My Requests', 
      icon: ClipboardCheck, 
      path: '/my-requests', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      systemModule: 'MY_REQUESTS' // Worker-specific, always visible for workers
    },
    
    // 2. POS System - Main sales interface
    { 
      name: 'POS System', 
      icon: ShoppingCart, 
      path: '/dashboard/pos', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      systemModule: 'POS_SYSTEM'
    },
    
    // 2.5 Online Banking - Mobile services and online banking fees
    { 
      name: 'Online Banking', 
      icon: EasyPaisaIcon, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50',
      systemModule: 'SERVICE_MANAGEMENT',
      subModules: [
        { name: 'New Transaction', path: '/mobile-services', icon: Banknote },
        { name: 'Transaction History', path: '/mobile-services/history', icon: FileText }
      ]
    },
    
    // 2.6 Daily Closing - End of day reconciliation
    { 
      name: 'Daily Closing', 
      icon: DollarSign, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      systemModule: 'DAILY_CLOSING',
      subModules: [
        { name: 'Create Closing', path: '/daily-closing', icon: DollarSign },
        { name: 'View Records', path: '/daily-closing/records', icon: FileText }
      ]
    },
    
    // 3. Products - Product catalog management
    { 
      name: 'Products', 
      icon: Smartphone, 
      path: '/products',
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      systemModule: 'PRODUCT_MANAGEMENT'
    },
    
    // 4. Inventory - Stock management
    { 
      name: 'Inventory', 
      icon: Package, 
      path: '/inventory', 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      systemModule: 'INVENTORY_MANAGEMENT'
    },
    
    // 5. Customers - Customer relationship management
    { 
      name: 'Customers', 
      icon: Users, 
      path: '/customers', 
      color: 'text-pink-600', 
      bgColor: 'bg-pink-50',
      systemModule: 'CUSTOMER_MANAGEMENT'
    },
    
    // 6. Sales Transactions - Sales history
    { 
      name: 'Sales Transactions', 
      icon: FileText, 
      path: '/sales', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      systemModule: 'SALES_REPORTS'
    },
    
    // 7. Suppliers - Vendor management
    { 
      name: 'Suppliers', 
      icon: Truck, 
      path: '/suppliers', 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      systemModule: 'SUPPLIER_MANAGEMENT'
    },
    
    // 8. Purchase Management - Purchase orders and stock receiving
    { 
      name: 'Purchases', 
      icon: ShoppingBag, 
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-50',
      systemModule: 'PURCHASE_MANAGEMENT',
      subModules: [
        { name: 'Purchase Orders', path: '/purchases', icon: ShoppingBag },
        { name: 'New Purchase', path: '/purchases/new', icon: Plus },
      ]
    },
    
    // 11. Payments - Payment tracking
    { 
      name: 'Payments', 
      icon: CreditCard, 
      path: '/payments', 
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-50',
      systemModule: 'PAYMENT_PROCESSING'
    },
    
    // 12. Loans - Credit management
    { 
      name: 'Loans', 
      icon: FileText, 
      path: '/loans', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50',
      systemModule: 'LOAN_MANAGEMENT'
    },
    
    // 13. Messages - Owner-Worker Communication (All users) - 3rd from last
    { 
      name: 'Messages', 
      icon: MessageSquare, 
      path: '/dashboard/messages', 
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-50',
      systemModule: 'MESSAGES' // Communication system, visible to all shop users
    },
    
    // 14. Team Management - Worker management (Owner only)
    { 
      name: 'Team', 
      icon: Users, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      systemModule: 'TEAM_MANAGEMENT', // Not in worker permissions
      subModules: [
        { name: 'Workers', path: '/settings/workers', icon: Users },
        { name: 'Shift Settings', path: '/dashboard/owner/shift-settings', icon: Clock },
        { name: 'Approvals', path: '/approvals', icon: CheckCircle }
      ]
    },
    
    // 15. Shop Settings - Configuration
    { 
      name: 'Shop Settings', 
      icon: Settings, 
      path: '/settings/shop',
      color: 'text-gray-600', 
      bgColor: 'bg-gray-50',
      systemModule: 'SHOP_SETTINGS' // Not in worker permissions
    },
  ]

  // Filter modules based on user role and permissions
  const modules = React.useMemo(() => {
    if (!isWorker) {
      // Owners and super admins see everything EXCEPT "My Requests"
      return allModules.filter(module => module.systemModule !== 'MY_REQUESTS')
    }

    // For workers: filter based on VIEW permission from database
    if (!permissionsLoaded) {
      return [] // Don't show anything until permissions are loaded
    }

    // Worker permission filtering - Create deep copy to avoid mutation
    return allModules
      .map(module => ({
        ...module,
        subModules: module.subModules ? [...module.subModules] : undefined
      }))
      .filter(module => {
        // Dashboard, My Requests, and Messages are always visible to workers
        if (module.name === 'Dashboard') return true
        if (module.systemModule === 'MY_REQUESTS') return true
        if (module.systemModule === 'MESSAGES') return true // 💬 MESSAGES ALWAYS VISIBLE
        
        // Team Management and Shop Settings - never visible to workers
        if (module.systemModule === 'TEAM_MANAGEMENT') return false
        if (module.systemModule === 'SHOP_SETTINGS') return false
        
        // Check if worker has VIEW permission for this module
        if (module.systemModule) {
          const modulePerms = workerPermissions[module.systemModule] || []
          const hasView = modulePerms.includes('VIEW')
          
          console.log(`Worker permission check: ${module.name} (${module.systemModule}):`, {
            permissions: modulePerms,
            hasView,
            visible: hasView
          })
          
          // If no VIEW permission, hide the module
          if (!hasView) return false
          
          // Filter sub-modules based on CREATE permission
          if (module.subModules && modulePerms.length > 0) {
            const hasCreate = modulePerms.includes('CREATE')
            const hasEdit = modulePerms.includes('EDIT')
            
            // Daily Closing: Hide "Create Closing" if no CREATE permission
            if (module.systemModule === 'DAILY_CLOSING' && !hasCreate) {
              module.subModules = module.subModules.filter(sub => sub.name !== 'Create Closing')
            }
            
            // Mobile Services: Hide "New Service" if no CREATE permission
            if (module.systemModule === 'SERVICE_MANAGEMENT' && !hasCreate) {
              module.subModules = module.subModules.filter(sub => sub.name !== 'New Service')
            }
          }
        }
        
        return true
      })
  }, [isWorker, allModules, workerPermissions, permissionsLoaded])

  // Auto-expand the module that contains the current active page
  React.useEffect(() => {
    const activeModule = modules.find(module => {
      if (module.path && pathname === module.path) return true
      if (module.subModules) {
        return module.subModules.some(sub => pathname === sub.path)
      }
      return false
    })

    if (activeModule && activeModule.subModules && !expandedModules.includes(activeModule.name)) {
      setExpandedModules([activeModule.name])
    }
  }, [pathname])

  const isActive = (path: string) => pathname === path
  
  const isModuleActive = (module: Module) => {
    if (module.path && isActive(module.path)) return true
    if (module.subModules) {
      return module.subModules.some(sub => isActive(sub.path))
    }
    return false
  }

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleName) 
        ? prev.filter(m => m !== moduleName)
        : [...prev, moduleName]
    )
  }

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 flex flex-col fixed left-0 top-0 bottom-0 h-screen overflow-y-auto z-40 w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-lg flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Modules</span>
        </div>
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {modules.map((module) => {
          const Icon = module.icon
          const active = isModuleActive(module)
          const isExpanded = expandedModules.includes(module.name)
          const hasSubModules = module.subModules && module.subModules.length > 0
          const isCustomIcon = module.name === 'Online Banking' // Check by module name for EasyPaisa icon

          return (
            <div key={module.name}>
              {/* Main Module Button */}
              <button
                onClick={() => {
                  if (hasSubModules) {
                    toggleModule(module.name)
                  } else if (module.path) {
                    router.push(module.path)
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? `${module.bgColor} dark:bg-opacity-20 ${module.color} dark:text-white font-semibold shadow-sm`
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {isCustomIcon ? (
                  <Icon className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? module.color : 'text-gray-600 dark:text-gray-400'}`} />
                )}
                <span className="truncate text-sm flex-1 text-left">{module.name}</span>
                {hasSubModules && (
                  isExpanded ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  )
                )}
              </button>

              {/* Sub Modules */}
              {hasSubModules && isExpanded && (
                <div className="mt-1 ml-4 space-y-1">
                  {module.subModules!.map((subModule) => {
                    const SubIcon = subModule.icon
                    const subActive = isActive(subModule.path)

                    return (
                      <button
                        key={subModule.path}
                        onClick={() => router.push(subModule.path)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                          subActive
                            ? `${module.bgColor} dark:bg-opacity-20 ${module.color} dark:text-white font-medium`
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <SubIcon className={`h-4 w-4 flex-shrink-0 ${subActive ? module.color + ' dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                        <span className="truncate">{subModule.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer - AWG International Branding */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AWG International
        </p>
        <p className="text-[9px] text-center text-gray-400 dark:text-gray-500">
          All Rights Reserved
        </p>
      </div>
    </div>
    </>
  )
}
