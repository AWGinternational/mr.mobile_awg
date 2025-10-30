'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Send } from 'lucide-react'

interface ApprovalRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestType: 'CREATE' | 'UPDATE' | 'DELETE'
  tableName: string
  recordData: any
  onSubmit: (reason: string) => Promise<void>
}

export function ApprovalRequestDialog({
  open,
  onOpenChange,
  requestType,
  tableName,
  recordData,
  onSubmit
}: ApprovalRequestDialogProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(reason)
      setReason('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getActionText = () => {
    switch (requestType) {
      case 'CREATE':
        return 'create'
      case 'UPDATE':
        return 'update'
      case 'DELETE':
        return 'delete'
      default:
        return 'modify'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            Request Approval
          </DialogTitle>
          <DialogDescription>
            Submit a request to your shop owner to {getActionText()} this {tableName} record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You don't have permission to {getActionText()} <strong>{tableName}</strong> records directly.
              Submit a request to your shop owner for approval.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Request Details
            </div>
            <div className="text-xs text-gray-600 font-mono bg-white p-3 rounded border overflow-x-auto">
              <div><strong>Action:</strong> {requestType}</div>
              <div><strong>Table:</strong> {tableName}</div>
              <div className="mt-2"><strong>Data:</strong></div>
              <pre className="mt-1">{JSON.stringify(recordData, null, 2)}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-base">
              Reason for Request <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to perform this action..."
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">
              Your shop owner will review this request and decide whether to approve or reject it.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setReason('')
                onOpenChange(false)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
