# Translation System Setup

## Overview
I've set up a complete internationalization (i18n) system for your project with support for:
- 🇬🇧 English
- 🇫🇷 French (Français)
- 🇸🇦 Arabic (العربية) with RTL support

## What Was Added

### 1. Translation Files
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/fr.json` - French translations
- `src/i18n/locales/ar.json` - Arabic translations

### 2. i18n Configuration
- `src/i18n/config.ts` - i18n setup and initialization

### 3. Language Switcher Component
- `src/components/language-switcher.tsx` - Dropdown component for language selection

### 4. Updated Components
- **Header** (`src/components/layout/header.tsx`): Added language switcher next to the search button
- **Footer** (`src/components/layout/footer.tsx`): All text now uses translations
- **Main** (`src/main.tsx`): Initialized i18n configuration

## Installation Required

**IMPORTANT**: You need to install the i18n packages. Run this command:

```powershell
# If you have PowerShell execution policy issues, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then install the packages:
npm install i18next react-i18next
```

## Features

### Language Switcher
- Located in the header next to the search button
- Dropdown menu with flag icons
- Persists language selection in localStorage
- Automatically switches document direction for Arabic (RTL)

### Footer Translations
Currently, only the footer is translated. The translations include:
- Company name
- Subtitle
- Security message
- Copyright text
- "Made with ❤️" message

### Adding More Translations

To add translations to other components:

1. Add translation keys to the JSON files in `src/i18n/locales/`
2. Import `useTranslation` hook in your component:
   ```typescript
   import { useTranslation } from 'react-i18next'
   ```
3. Use the hook in your component:
   ```typescript
   const { t } = useTranslation()
   ```
4. Replace hardcoded text with translation keys:
   ```typescript
   <span>{t('your.translation.key')}</span>
   ```

## Example Translation Structure

```json
{
  "footer": {
    "company": "Tesca Tunisia",
    "subtitle": "Industrial Solutions"
  },
  "header": {
    "search": "Search",
    "notifications": "Notifications"
  }
}
```

## RTL Support

The system automatically:
- Detects when Arabic is selected
- Sets `dir="rtl"` on the document
- Switches back to `dir="ltr"` for English and French

## Next Steps

1. Install the required packages (see Installation Required section)
2. Test the language switcher in the header
3. Let me know which other components you want translated
4. I'll add the translation keys and update those components

## Troubleshooting

If you see TypeScript errors about missing modules:
- Make sure you've run `npm install i18next react-i18next`
- Restart your development server after installation
