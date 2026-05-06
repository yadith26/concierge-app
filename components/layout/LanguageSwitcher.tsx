'use client'

import {useLocale} from 'next-intl'
import {usePathname, useRouter} from '@/i18n/navigation'

const locales = [
  {code: 'es', label: 'ES'},
  {code: 'en', label: 'EN'},
  {code: 'fr', label: 'FR'},
  {code: 'ru', label: 'RU'},
] as const

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(nextLocale: string) {
    router.replace(pathname, {locale: nextLocale})
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#D9E0EA] bg-white/90 px-2 py-1 shadow-sm">
      {locales.map((item) => {
        const isActive = locale === item.code

        return (
          <button
            key={item.code}
            type="button"
            onClick={() => handleChange(item.code)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? 'bg-[#2F66C8] text-white'
                : 'text-[#6E7F9D] hover:bg-[#F3F6FB]'
            }`}
            aria-pressed={isActive}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}