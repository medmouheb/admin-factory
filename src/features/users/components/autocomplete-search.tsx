import { useState, useEffect, useRef } from 'react'
import { Search, User, Mail, Hash } from 'lucide-react'
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
  placeholder = 'Search users...',
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
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm)
        )
      }).slice(0, 8) // Limit to 8 results
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

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="bg-primary/20 text-primary font-semibold">
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="pl-10 h-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {isOpen && filteredUsers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredUsers.map((user, index) => {
              const fullName = `${user.firstName} ${user.lastName}`
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-md transition-all duration-200',
                    'hover:bg-primary/10 hover:shadow-sm',
                    'focus:outline-none focus:bg-primary/10',
                    'group relative overflow-hidden',
                    highlightedIndex === index && 'bg-primary/10 shadow-sm',
                    'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent',
                    'before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {highlightMatch(fullName, query)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {highlightMatch(user.matricule || '', query)}
                        </span>
                        {user.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {highlightMatch(user.email, query)}
                          </span>
                        )}
                      </div>
                      {user.role && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {user.role}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isOpen && query.trim() && filteredUsers.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 p-4">
          <div className="text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No users found matching "{query}"</p>
          </div>
        </div>
      )}
    </div>
  )
}
