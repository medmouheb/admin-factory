import { useState, useEffect, useRef } from 'react'
import { Search, User, Mail, Hash, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { type User as UserType } from '../data/schema'

type AutocompleteSearchProps = {
  users: UserType[]
  onSelect: (user: UserType) => void
  placeholder?: string
  className?: string
}

export function AutocompleteSearch({
  users,
  onSelect,
  placeholder = 'Rechercher un utilisateur...',
  className,
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Filter users based on query
  const filteredUsers = query.trim()
    ? users.filter((user) => {
        const searchTerm = query.toLowerCase()
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
        return (
          user.matricule?.toLowerCase().includes(searchTerm) ||
          fullName.includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.phone?.toLowerCase().includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm)
        )
      }).slice(0, 8)
    : []

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredUsers.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredUsers[highlightedIndex]) {
          handleSelect(filteredUsers[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleSelect = (user: UserType) => {
    onSelect(user)
    setQuery('')
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(value.trim().length > 0)
    setHighlightedIndex(0)
  }

  const highlightMatch = (text: string, queryText: string) => {
    if (!queryText.trim()) return text
    
    const parts = text.split(new RegExp(`(${queryText})`, 'gi'))
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === queryText.toLowerCase() ? (
            <span key={index} className="bg-violet-500/35 text-violet-200 font-bold px-1 rounded">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    )
  }

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-400 pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          className={cn(
            'pl-12 pr-4 h-12 rounded-2xl text-sm font-medium transition-all duration-300',
            'bg-[rgba(16,12,42,0.85)] border border-violet-500/30 text-white placeholder:text-violet-300/40',
            'backdrop-blur-xl',
            'hover:border-violet-400/50 hover:bg-[rgba(22,16,58,0.9)]',
            'focus:border-violet-400 focus:ring-4 focus:ring-violet-500/25 focus:shadow-[0_0_25px_rgba(139,92,246,0.3)]'
          )}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-violet-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/10 transition-colors cursor-pointer"
          >
            Effacer
          </button>
        )}
      </div>

      {isOpen && filteredUsers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[rgba(15,11,40,0.97)] border border-violet-500/35 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_30px_rgba(139,92,246,0.22)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-[420px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-violet-500/30">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-300/70 flex items-center gap-1.5 border-b border-violet-500/15 mb-1">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span>Suggestions de recherche</span>
          </div>
          {filteredUsers.map((user, index) => {
            const fullName = `${user.firstName} ${user.lastName}`
            return (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer',
                  'group relative overflow-hidden flex items-center gap-3',
                  highlightedIndex === index
                    ? 'bg-gradient-to-r from-violet-600/35 to-indigo-600/25 text-white border border-violet-500/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/25 text-violet-300 border border-violet-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate text-white">
                    {highlightMatch(fullName, query)}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-violet-300">
                      <Hash className="h-3 w-3" />
                      {highlightMatch(user.matricule || '', query)}
                    </span>
                    {user.email && (
                      <span className="flex items-center gap-1 truncate text-slate-400">
                        <Mail className="h-3 w-3 text-fuchsia-400/80" />
                        {highlightMatch(user.email, query)}
                      </span>
                    )}
                  </div>
                </div>
                {user.role && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full capitalize bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {user.role}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {isOpen && query.trim() && filteredUsers.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[rgba(15,11,40,0.97)] border border-violet-500/35 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200 p-6 text-center">
          <Search className="h-8 w-8 mx-auto mb-2 text-violet-400/50" />
          <p className="text-sm font-semibold text-slate-200">Aucun résultat trouvé pour "{query}"</p>
          <p className="text-xs text-slate-400 mt-1">Vérifiez l'orthographe du matricule ou du nom</p>
        </div>
      )}
    </div>
  )
}
