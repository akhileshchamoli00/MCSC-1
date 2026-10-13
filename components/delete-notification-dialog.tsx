import { useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification?: any | null;
  count?: number;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteNotificationDialog({
  open,
  onOpenChange,
  notification,
  count,
  onConfirm,
  isDeleting = false,
}: DeleteNotificationDialogProps) {
  const isBatch = typeof count === "number" && count > 1;

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        if (typeof document !== "undefined") {
          document.body.style.pointerEvents = "";
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (typeof document !== "undefined") {
            document.body.style.pointerEvents = "";
          }
        }}
        className="max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-background text-foreground z-[99999]"
      >
        <DialogHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <DialogTitle className="text-base font-bold text-foreground">
                {isBatch ? `Delete ${count} Notifications?` : "Delete Notification?"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {isBatch
                  ? `Are you sure you want to permanently delete these ${count} notifications? This action cannot be undone.`
                  : "Are you sure you want to remove this notification? This action cannot be undone."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Notification details card for single deletion */}
        {!isBatch && notification && (
          <div className="p-3 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/70 space-y-1.5 text-left my-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-foreground truncate" title={notification.title}>
                {notification.title || "Notification"}
              </p>
              {notification.system_area && (
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                    notification.system_area === "business"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                  }`}
                >
                  {notification.system_area === "business" ? "ERP" : notification.system_area.toUpperCase()}
                </span>
              )}
            </div>
            {notification.message && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {notification.message}
              </p>
            )}
            {notification.created_at && (
              <p className="text-[10px] text-muted-foreground/70 font-mono pt-0.5">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isDeleting}
            onClick={onConfirm}
            className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs cursor-pointer"
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            <span>{isBatch ? `Delete ${count} Notifications` : "Delete"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
