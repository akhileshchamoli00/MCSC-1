"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderNumber?: string
  isDeleting: boolean
  onConfirmDelete: () => void
}

export function DeleteOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  isDeleting,
  onConfirmDelete,
}: DeleteOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Confirm Order Deletion
          </DialogTitle>
          <DialogDescription className="text-xs pt-1">
            Are you sure you want to delete order <span className="font-mono font-bold text-foreground">{orderNumber}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 border-t border-border/40 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirmDelete}
            className="shadow-xs font-bold"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Delete Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
