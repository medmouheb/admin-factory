import { Logo } from '@/assets/logo'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language-switcher'

import { UserAuthForm } from './components/user-auth-form'

export function SignIn2() {
  const { t } = useTranslation()
  
  return (
    <div className='relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center justify-center'>
              <Logo className='me-2' />
              <h1 className='text-xl font-medium'>Tesca Tunisie</h1>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
        <div className='mx-auto flex w-full max-w-sm flex-col justify-center space-y-2'>
          <div className='flex flex-col space-y-2 text-start'>
            <h2 className='text-lg font-semibold tracking-tight'>{t('auth.signIn')}</h2>
            <p className='text-muted-foreground text-sm'>
              {t('auth.enterUsernamePassword')} <br />
              {t('auth.toLogIntoAccount')}
            </p>
          </div>
          <UserAuthForm />
          <p className='text-muted-foreground px-8 text-center text-sm'>
            {t('auth.byClickingSignIn')}{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              {t('auth.termsOfService')}
            </a>{' '}
            {t('common.and')}{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              {t('auth.privacyPolicy')}
            </a>
            .
          </p>
        </div>
      </div>

      <div
        className={cn(
          'bg-muted relative h-full overflow-hidden max-lg:hidden',
          'bg-muted relative h-full overflow-hidden max-lg:hidden'
        )}
      >
        <img
          src='/images/tesca-signin.jpg'
          className='h-full w-full object-cover'
          alt='Tesca Admin'
        />
      </div>
    </div>
  )
}
