const fs = require('fs')
const path = require('path')

const messagesDir = path.join(process.cwd(), 'messages')
const baseLocale = 'es'
const locales = ['es', 'en', 'fr', 'ru']

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function flatten(obj, prefix = '') {
  const result = {}

  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const nextKey = prefix ? `${prefix}.${key}` : key

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      Object.assign(result, flatten(value, nextKey))
    } else {
      result[nextKey] = value
    }
  }

  return result
}

function main() {
  const basePath = path.join(messagesDir, `${baseLocale}.json`)
  const baseJson = readJson(basePath)
  const baseKeys = Object.keys(flatten(baseJson)).sort()

  let hasErrors = false

  for (const locale of locales) {
    if (locale === baseLocale) continue

    const localePath = path.join(messagesDir, `${locale}.json`)
    const localeJson = readJson(localePath)
    const localeKeys = Object.keys(flatten(localeJson)).sort()

    const missing = baseKeys.filter((key) => !localeKeys.includes(key))
    const extra = localeKeys.filter((key) => !baseKeys.includes(key))

    if (missing.length || extra.length) {
      hasErrors = true
      console.log(`\n=== ${locale}.json ===`)

      if (missing.length) {
        console.log('Missing keys:')
        missing.forEach((key) => console.log(`  - ${key}`))
      }

      if (extra.length) {
        console.log('Extra keys:')
        extra.forEach((key) => console.log(`  - ${key}`))
      }
    }
  }

  if (hasErrors) {
    console.log('\nI18n check failed.')
    process.exit(1)
  }

  console.log('All locale files are consistent.')
}

main()