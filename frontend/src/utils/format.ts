export function formatPrice(value: string | number, currency = 'UZS') {
  const n = typeof value === 'string' ? Number(value) : value
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(n))} ${currency}`
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
