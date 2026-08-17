import React, { createContext, useContext, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, HelpCircle, X, ShieldAlert } from "lucide-react"

export type ConfirmOptions = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "warning" | "default"
}

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "Confirm Action",
    description: "Are you sure you want to proceed?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default"
  })

  // Store promise resolver
  const resolverRef = useRef<(value: boolean) => void>(() => {})

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      title: opts.title,
      description: opts.description,
      confirmText: opts.confirmText || (opts.variant === "destructive" ? "Delete" : "Confirm"),
      cancelText: opts.cancelText || "Cancel",
      variant: opts.variant || "default"
    })
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    resolverRef.current(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolverRef.current(false)
  }

  const getVariantStyles = () => {
    switch (options.variant) {
      case "destructive":
        return {
          icon: <Trash2 className="h-5 w-5 text-rose-400" />,
          iconBg: "bg-rose-500/10 border-rose-500/20",
          confirmButtonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
        }
      case "warning":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
          iconBg: "bg-amber-500/10 border-amber-500/20",
          confirmButtonClass: "bg-amber-600 text-white hover:bg-amber-700"
        }
      default:
        return {
          icon: <HelpCircle className="h-5 w-5 text-primary" />,
          iconBg: "bg-primary/10 border-primary/20",
          confirmButtonClass: "bg-primary text-primary-foreground hover:bg-primary/90"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Reusable Confirm Modal Dialog */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCancel()
          }}
          tabIndex={-1}
        >
          {/* Backdrop Click */}
          <div className="fixed inset-0" onClick={handleCancel} />

          {/* Dialog Container */}
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl text-card-foreground overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            
            {/* Header / Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${styles.iconBg}`}>
                  {styles.icon}
                </div>
                <div className="space-y-1.5 flex-1 pr-6">
                  <h3 className="text-base font-semibold text-foreground leading-none">
                    {options.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {options.description}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-border/80 bg-muted/20 px-6 py-3.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8.5 px-3 text-xs bg-background text-muted-foreground hover:text-foreground"
              >
                {options.cancelText}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                className={`h-8.5 px-4 text-xs font-semibold shadow-sm ${styles.confirmButtonClass}`}
                autoFocus
              >
                {options.confirmText}
              </Button>
            </div>

          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context
}
