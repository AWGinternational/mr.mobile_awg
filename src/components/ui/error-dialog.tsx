import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

interface ErrorDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  details?: string
}

export function ErrorDialog({ 
  open, 
  onClose, 
  title = 'Error', 
  message,
  details 
}: ErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Something went wrong
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 mb-2">{message}</p>
          {details && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-800 font-mono">{details}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

