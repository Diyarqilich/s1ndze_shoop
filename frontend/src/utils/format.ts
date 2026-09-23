export function formatPrice(value: string | number, currency = 'UZS') {
  const n = typeof value === 'string' ? Number(value) : value
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(n))} ${currency}`
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/**
 * Category names are stored once in the database (in English) and are
 * data, not UI copy — so switching the site language never translated
 * them. This looks up a per-language label by slug (see i18n locales'
 * "categories" section) and falls back to the raw DB name for any
 * category that isn't in that list yet, so a newly added category never
 * renders blank.
 */
export function categoryLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  slug: string,
  fallback: string,
) {
  return t(`categories.${slug}`, { defaultValue: fallback })
}
