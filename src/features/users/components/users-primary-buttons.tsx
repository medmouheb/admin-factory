import { UserPlus } from 'lucide-react'
import { useUsers } from './users-provider'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  const { t } = useTranslation()

  const translatedAdd = t('users.addUser')
  const addLabel = translatedAdd && translatedAdd !== 'users.addUser' ? translatedAdd : 'Nouvel Utilisateur'

  return (
    <div className='flex gap-2'>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen('add')}
        className="flex items-center justify-center gap-2.5 rounded-2xl bg-white text-violet-900 dark:bg-violet-600 dark:text-white px-5 py-3 text-sm font-bold shadow-xl hover:bg-violet-50 dark:hover:bg-violet-500 hover:shadow-violet-500/25 hover:shadow-2xl transition-all border border-white/60 dark:border-violet-400/30 cursor-pointer"
      >
        <UserPlus className="h-5 w-5 text-violet-700 dark:text-violet-200" />
        <span>{addLabel}</span>
      </motion.button>
    </div>
  )
}

