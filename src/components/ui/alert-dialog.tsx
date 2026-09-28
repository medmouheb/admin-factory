import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

/* ─── Shared dark overlay ───────────────────────────────────── */
const OVERLAY_CLS =
  'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
  'fixed inset-0 z-50 bg-[rgba(4,2,20,0.75)] backdrop-blur-[2px]'

/* ─── Shared glass content shell ────────────────────────────── */
const CONTENT_CLS =
  'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ' +
  'fixed top-[50%] left-[50%] z-50 ' +
  'w-full max-w-[calc(100%-2rem)] sm:max-w-lg ' +
  'translate-x-[-50%] translate-y-[-50%] ' +
  'duration-200 rounded-2xl border-0 p-0 shadow-none bg-transparent'

/* ─── Glass shell wrapper ───────────────────────────────────── */
function AlertGlassShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background:
          'linear-gradient(145deg, rgba(18,14,52,0.97) 0%, rgba(12,10,38,0.99) 100%)',
        border: '1px solid rgba(139,92,246,0.28)',
        boxShadow:
          '0 0 0 1px rgba(139,92,246,0.08),' +
          '0 32px 80px rgba(0,0,0,0.72),' +
          '0 8px 32px rgba(99,102,241,0.22)',
      }}
    >
      {/* Iridescent top bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/80 to-transparent pointer-events-none" />
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(99,102,241,0.28) 0%, transparent 70%)',
        }}
      />
      {/* Corner orbs */}
      <div
        className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ─── Components ────────────────────────────────────────────── */

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(OVERLAY_CLS, className)}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(CONTENT_CLS, className)}
        {...props}
      >
        <AlertGlassShell>{children}</AlertGlassShell>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'flex flex-col gap-2 px-6 pt-6 pb-4 text-center sm:text-start',
        className
      )}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end',
        'border-t border-white/[0.06]',
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-bold text-white', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-white/50 text-sm', className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(
        buttonVariants(),
        'rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium',
        'text-white/40 hover:text-white/70',
        'bg-white/[0.04] hover:bg-white/[0.08]',
        'border border-white/[0.08] hover:border-white/[0.15]',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
