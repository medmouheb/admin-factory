'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, ShieldAlert, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { refreshUsers } = useUsers()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.matricule) return
    try {
      setIsLoading(true)
      const res = await fetch(`/api/users/${currentRow.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.message || 'Échec de la suppression')
        return
      }
      toast.success('Utilisateur supprimé avec succès')
      onOpenChange(false)
      refreshUsers()
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmed = value.trim() === currentRow.matricule

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={!confirmed}
      isLoading={isLoading}
      title={
        <span className="flex items-center gap-2 text-rose-400">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15">
            <Trash2 className="h-4 w-4 text-rose-400" />
          </div>
          Supprimer l'utilisateur
        </span>
      }
      desc={
        <div className="space-y-4">
          {/* User info card */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(244,63,94,0.2)',
            }}
          >
            <p className="text-sm text-white/70 leading-relaxed">
              Vous êtes sur le point de supprimer définitivement{' '}
              <span className="font-bold text-white">
                {currentRow.firstName} {currentRow.lastName}
              </span>
              {' '}(matricule{' '}
              <span className="font-mono text-rose-300 font-bold">{currentRow.matricule}</span>
              ) — rôle{' '}
              <span className="font-bold text-rose-300 uppercase">{currentRow.role}</span>.
              Cette action est <span className="text-rose-400 font-bold">irréversible</span>.
            </p>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/60">
              Tapez le matricule{' '}
              <span className="font-mono text-rose-300 font-bold">{currentRow.matricule}</span>
              {' '}pour confirmer :
            </Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Saisir "${currentRow.matricule}"`}
              className="rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-rose-500/60 focus:ring-rose-500/20 transition-all"
            />
            {value && !confirmed && (
              <p className="text-xs text-rose-400">Le matricule ne correspond pas.</p>
            )}
            {confirmed && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                ✓ Confirmation valide — prêt à supprimer
              </p>
            )}
          </div>

          {/* Warning */}
          <div
            className="flex items-start gap-3 rounded-xl p-3"
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300/80">
              Toutes les données associées à cet utilisateur seront supprimées. Cette opération ne peut pas être annulée.
            </p>
          </div>
        </div>
      }
      confirmText={
        isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Suppression...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Supprimer définitivement
          </span>
        )
      }
      destructive
    />
  )
}
