import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
]

export function LanguageSwitcher() {
    const { i18n } = useTranslation()

    useEffect(() => {
        // Set document direction based on language
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = i18n.language
    }, [i18n.language])

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng)
        localStorage.setItem('language', lng)
        // Update document direction
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = lng
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 transition-all duration-300 hover:scale-110 hover:rotate-3 relative overflow-hidden group
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent
            before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
            shadow-sm hover:shadow-md hover:shadow-primary/20"
                    title="Change Language"
                >
                    <Languages className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`cursor-pointer flex items-center gap-2 ${i18n.language === lang.code ? 'bg-primary/10 font-semibold' : ''
                            }`}
                    >
                        <span className="text-xl">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {i18n.language === lang.code && (
                            <span className="ml-auto text-primary">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
