import type { RouteException } from '../../api'

/** «https://www.Sber.ru/path» → «sber.ru». Не похоже на сайт — null. Кириллицу оставляем: бэкенд сам переведёт в punycode. */
export function normalizeSite(value: string): string | null {
  let v = value.trim().toLowerCase()
  v = v.replace(/^[a-z]+:\/\//, '').split('/')[0].split('?')[0].split(':')[0]
  v = v.replace(/^\*?\.+/, '').replace(/\.+$/, '')
  if (v.startsWith('www.')) v = v.slice(4)
  return /^([\p{L}\p{N}-]+\.)+[\p{L}\p{N}-]{2,63}$/u.test(v) ? v : null
}

/** «xn--e1afmkfd.xn--p1ai» показываем как есть: перевести обратно в браузере без библиотеки нельзя. */
export function siteLabel(v: string): string {
  return v.replace(/^domain:/, '')
}

const matches = (site: string, rule: string) => {
  const r = siteLabel(rule)
  return site === r || site.endsWith('.' + r)
}

export type RouteVerdict = { via: 'direct' | 'proxy'; why: string }

/** Куда пойдёт сайт с этими правилами. Порядок как в Happ: «через VPN» важнее «напрямую». */
export function routeFor(site: string, opts: {
  bypass: boolean; direct: string[]; proxy: string[]; exceptions: RouteException[]
}): RouteVerdict {
  const own = opts.exceptions
  const ownProxy = own.find((e) => e.action === 'proxy' && matches(site, e.value))
  if (ownProxy) return { via: 'proxy', why: 'в исключениях «через VPN»' }
  if (opts.proxy.some((r) => matches(site, r))) return { via: 'proxy', why: 'администратор: всегда через VPN' }
  const ownDirect = own.find((e) => e.action === 'direct' && matches(site, e.value))
  if (ownDirect) return { via: 'direct', why: 'в исключениях «напрямую»' }
  if (opts.direct.some((r) => matches(site, r))) return { via: 'direct', why: 'администратор: напрямую' }
  if (!opts.bypass) return { via: 'proxy', why: 'обход российских сайтов выключен' }
  if (/\.(ru|su|рф|xn--p1ai)$/.test(site)) return { via: 'direct', why: 'российский домен, если сайт не заблокирован' }
  return { via: 'proxy', why: 'через VPN; если сайт стоит на российском сервере — напрямую' }
}
