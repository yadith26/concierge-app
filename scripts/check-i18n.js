/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

const messagesDir = path.join(process.cwd(), 'messages')
const locales = ['es', 'en', 'fr', 'ru']
const baseLocale = 'es'
const warnExtraKeys = process.env.CHECK_I18N_WARN_EXTRAS === '1'
const suspiciousEncodingPattern = /(Ã|Ð|�|\?{3,})/
const simplePlaceholderNames = new Set([
  'apartments',
  'building',
  'buildingName',
  'category',
  'code',
  'count',
  'date',
  'email',
  'from',
  'itemLabel',
  'itemName',
  'location',
  'name',
  'quantity',
  'requestTitle',
  'role',
  'task',
  'taskTitle',
  'time',
  'to',
  'unit',
])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function flattenMessages(input, prefix = '') {
  if (!isObject(input)) {
    return prefix ? [[prefix, input]] : []
  }

  return Object.entries(input).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key

    if (isObject(value)) {
      return flattenMessages(value, nextKey)
    }

    return [[nextKey, value]]
  })
}

function loadLocale(locale) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function getPlaceholders(message) {
  if (typeof message !== 'string') return []

  const placeholders = new Set()
  const hasPlural = /,\s*plural\s*,/.test(message)
  const formattedArgumentRegex = /{([a-zA-Z_][a-zA-Z0-9_]*)\s*,/g
  let match = formattedArgumentRegex.exec(message)

  while (match) {
    placeholders.add(match[1])
    match = formattedArgumentRegex.exec(message)
  }

  if (!hasPlural) {
    const simpleArgumentRegex = /{([a-zA-Z_][a-zA-Z0-9_]*)}/g
    match = simpleArgumentRegex.exec(message)

    while (match) {
      if (simplePlaceholderNames.has(match[1])) {
        placeholders.add(match[1])
      }
      match = simpleArgumentRegex.exec(message)
    }
  }

  return [...placeholders].sort()
}

function hasPluralWithoutOther(message) {
  if (typeof message !== 'string') return false
  return /,\s*plural\s*,/.test(message) && !/\bother\s*{/.test(message)
}

function printIssueGroup(title, issues, marker = '-') {
  if (!issues.length) return

  console.log(`\n${title} (${issues.length}):`)
  issues.slice(0, 60).forEach((issue) => console.log(`  ${marker} ${issue}`))

  if (issues.length > 60) {
    console.log(`  ... y ${issues.length - 60} más`)
  }
}

const localeMaps = Object.fromEntries(
  locales.map((locale) => [locale, loadLocale(locale)])
)
const flattenedByLocale = Object.fromEntries(
  locales.map((locale) => [locale, flattenMessages(localeMaps[locale])])
)
const valueByLocale = Object.fromEntries(
  locales.map((locale) => [locale, new Map(flattenedByLocale[locale])])
)
const keySetByLocale = Object.fromEntries(
  locales.map((locale) => [locale, new Set(valueByLocale[locale].keys())])
)

const baseKeys = keySetByLocale[baseLocale]
const blockingIssues = []
const warningIssues = []

for (const locale of locales) {
  const currentKeys = keySetByLocale[locale]
  const currentValues = valueByLocale[locale]

  if (locale !== baseLocale) {
    const missing = [...baseKeys].filter((key) => !currentKeys.has(key))
    const extra = [...currentKeys].filter((key) => !baseKeys.has(key))

    missing.forEach((key) =>
      blockingIssues.push(`${locale}: falta key "${key}"`)
    )
    if (warnExtraKeys) {
      extra.forEach((key) =>
        warningIssues.push(`${locale}: key extra "${key}"`)
      )
    }
  }

  for (const [key, value] of currentValues) {
    if (typeof value !== 'string') continue

    if (hasPluralWithoutOther(value)) {
      blockingIssues.push(`${locale}: plural sin other en "${key}"`)
    }

    if (suspiciousEncodingPattern.test(value)) {
      blockingIssues.push(`${locale}: posible encoding roto en "${key}"`)
    }
  }
}

for (const key of baseKeys) {
  const baseValue = valueByLocale[baseLocale].get(key)
  const basePlaceholders = getPlaceholders(baseValue)

  if (!basePlaceholders.length) continue

  for (const locale of locales) {
    if (locale === baseLocale) continue
    const value = valueByLocale[locale].get(key)
    if (typeof value !== 'string') continue

    const placeholders = getPlaceholders(value)
    const missing = basePlaceholders.filter(
      (placeholder) => !placeholders.includes(placeholder)
    )
    const extra = placeholders.filter(
      (placeholder) => !basePlaceholders.includes(placeholder)
    )

    if (missing.length || extra.length) {
      blockingIssues.push(
        `${locale}: placeholders distintos en "${key}" ` +
          `(faltan: ${missing.join(', ') || 'ninguno'}; sobran: ${
            extra.join(', ') || 'ninguno'
          })`
      )
    }
  }
}

printIssueGroup('Errores i18n', blockingIssues)
printIssueGroup('Warnings i18n', warningIssues, '+')

if (blockingIssues.length) {
  process.exit(1)
}

console.log('i18n OK: keys, plurales, placeholders y encoding básico validados')
process.exit(0)
