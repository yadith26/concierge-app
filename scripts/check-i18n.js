/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

const messagesDir = path.join(process.cwd(), 'messages')
const locales = ['es', 'en', 'fr', 'ru']

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function flattenKeys(input, prefix = '') {
  if (!isObject(input)) {
    return prefix ? [prefix] : []
  }

  return Object.entries(input).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key

    if (isObject(value)) {
      return flattenKeys(value, nextKey)
    }

    return [nextKey]
  })
}

function loadLocale(locale) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const localeMaps = Object.fromEntries(locales.map((locale) => [locale, loadLocale(locale)]))
const localeKeys = Object.fromEntries(
  locales.map((locale) => [locale, new Set(flattenKeys(localeMaps[locale]))])
)

const baseLocale = 'es'
const baseKeys = localeKeys[baseLocale]

const blockingIssues = []
const warningIssues = []

for (const locale of locales) {
  if (locale === baseLocale) continue

  const currentKeys = localeKeys[locale]
  const missing = [...baseKeys].filter((key) => !currentKeys.has(key))
  const extra = [...currentKeys].filter((key) => !baseKeys.has(key))

  if (missing.length) {
    blockingIssues.push({
      locale,
      missing,
      extra: [],
    })
  }

  if (extra.length) {
    warningIssues.push({
      locale,
      extra,
    })
  }
}

if (!blockingIssues.length && !warningIssues.length) {
  console.log('i18n OK: todos los locales tienen las mismas keys que es.json')
  process.exit(0)
}

for (const issue of blockingIssues) {
  console.log(`\\nLocale ${issue.locale}:`)

  if (issue.missing.length) {
    console.log(`  Missing (${issue.missing.length}):`)
    issue.missing.slice(0, 50).forEach((key) => console.log(`    - ${key}`))
    if (issue.missing.length > 50) {
      console.log(`    ... y ${issue.missing.length - 50} mas`)
    }
  }

}

for (const issue of warningIssues) {
  console.log(`\\nLocale ${issue.locale}:`)
  console.log(`  Extra (${issue.extra.length}) [warning]:`)
  issue.extra.slice(0, 50).forEach((key) => console.log(`    + ${key}`))
  if (issue.extra.length > 50) {
    console.log(`    ... y ${issue.extra.length - 50} mas`)
  }
}

process.exit(blockingIssues.length ? 1 : 0)
