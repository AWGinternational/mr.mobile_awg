'use client'

import { motion } from 'framer-motion'
import { Loader2, Shield, CheckCircle } from 'lucide-react'

interface AuthLoadingOverlayProps {
  message?: string
}

export function AuthLoadingOverlay({ message = 'Authenticating...' }: AuthLoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
      >
        {/* Animated Logo */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50" />
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {message}
          </h3>
          
          {/* Progress Steps */}
          <div className="space-y-3 pt-4">
            <LoadingStep 
              label="Verifying credentials" 
              delay={0} 
            />
            <LoadingStep 
              label="Checking permissions" 
              delay={0.5} 
            />
            <LoadingStep 
              label="Loading your workspace" 
              delay={1} 
            />
          </div>

          {/* Spinner */}
          <div className="flex justify-center pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>

          {/* Security Message */}
          <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
            🔒 Secure connection established
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function LoadingStep({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.3 }}
      >
        <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </motion.div>
        </div>
      </motion.div>
      <span>{label}</span>
    </motion.div>
  )
}

// Success overlay for when login completes
export function AuthSuccessOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1 
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-50" />
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Success Text */}
        <div className="text-center space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Login Successful!
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Redirecting to your dashboard...
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  )
}
