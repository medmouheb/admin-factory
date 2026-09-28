'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Shared glass style used by ALL dialogs ────────────────── */
const DIALOG_OVERLAY_CLS =
  'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
  'fixed inset-0 z-50 ' +
  // Rich dark overlay with blur tint
  'bg-[rgba(4,2,20,0.75)] backdrop-blur-[2px]'

const DIALOG_CONTENT_CLS =
  // Animations
  'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ' +
  // Position
  'fixed top-[50%] left-[50%] z-50 ' +
  'w-full max-w-[calc(100%-2rem)] sm:max-w-lg ' +
  'translate-x-[-50%] translate-y-[-50%] ' +
  'duration-200 ' +
  // ── GLASS DARK SHELL ──
  'rounded-2xl border-0 p-0 shadow-none bg-transparent'

/* The actual inner glass card rendered inside every DialogContent */
function GlassShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl', className)}
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
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/80 to-transparent pointer-events-none" />
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(99,102,241,0.3) 0%, transparent 70%)',
        }}
      />
      {/* Bottom-right orb */}
      <div
        className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
        }}
      />
      {/* Bottom-left orb */}
      <div
        className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }}
      />
      {children}
    </div>
  )
}

/* ─── Dialog components ─────────────────────────────────────── */

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(DIALOG_OVERLAY_CLS, className)}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(DIALOG_CONTENT_CLS, className)}
        {...props}
      >
        <GlassShell>
          {/* Content (scrollable portion handled by consumer) */}
          <div className="relative z-10">{children}</div>

          {/* Close button */}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className={cn(
                'absolute end-4 top-4 z-20 rounded-xl p-1.5',
                'text-white/30 hover:text-white/70',
                'bg-white/[0.04] hover:bg-white/[0.10]',
                'border border-white/[0.06] hover:border-white/[0.15]',
                'transition-all duration-200',
                'focus:outline-none focus:ring-1 focus:ring-violet-500/50',
                '[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0'
              )}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </GlassShell>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 px-6 pt-6 pb-5 text-center sm:text-start', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end',
        'border-t border-white/[0.06]',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-bold text-white', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-white/45 text-sm mt-1', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
