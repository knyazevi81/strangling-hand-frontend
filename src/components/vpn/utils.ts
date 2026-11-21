export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

export function timeAgo(iso: string | null): string {
  if (!iso) return 'ни разу'
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (sec < 60) return `${sec} с назад`
  if (sec < 3600) return `${Math.round(sec / 60)} мин назад`
  if (sec < 86400) return `${Math.round(sec / 3600)} ч назад`
  return `${Math.round(sec / 86400)} дн назад`
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} Б`
  const units = ['КБ', 'МБ', 'ГБ', 'ТБ']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

const FLAGS: Record<string, string> = {
  RU: '🇷🇺', DE: '🇩🇪', FI: '🇫🇮', NL: '🇳🇱', SE: '🇸🇪', PL: '🇵🇱', EE: '🇪🇪', LV: '🇱🇻',
  LT: '🇱🇹', KZ: '🇰🇿', TR: '🇹🇷', US: '🇺🇸', GB: '🇬🇧', FR: '🇫🇷', AM: '🇦🇲', GE: '🇬🇪',
}

/** Флаг по двухбуквенному коду, иначе сам текст страны. */
export function countryLabel(country: string | null): string {
  if (!country) return ''
  const code = country.trim().toUpperCase()
  return FLAGS[code] ? `${FLAGS[code]} ${code}` : country
}

/** Короткое имя профиля без названия сервиса: «in-msk-1 · REALITY». */
export function shortProfile(name: string): string {
  const parts = name.split(' · ')
  return parts.length > 2 ? parts.slice(1).join(' · ') : name
}

/** Ссылка, которая открывает Happ и добавляет подписку. */
export function happLink(subscriptionUrl: string): string {
  return `happ://add/${subscriptionUrl}`
}
