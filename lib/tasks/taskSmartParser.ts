import type {
  PestTarget,
  TaskCategory,
  TaskPriority,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'

import es from '@/lib/tasks/smart-parser/es.json'
import en from '@/lib/tasks/smart-parser/en.json'
import fr from '@/lib/tasks/smart-parser/fr.json'
import ru from '@/lib/tasks/smart-parser/ru.json'

export type SmartTaskParseResult = {
  cleanedTitle: string
  detectedCategory: TaskCategory | null
  detectedPriority: TaskPriority | null
  detectedDate: string | null
  detectedTime: string | null
  detectedLocation: string | null
  detectedAreas: string[]
  detectedApartments: string[]
  detectedPestTargets: PestTarget[]
  detectedVisitType: TreatmentVisitType | null
  shouldAutoSubmit: boolean
}

type ParserLocale = 'es' | 'en' | 'fr' | 'ru'

type ParserRules = {
  apartmentPrefix: string
  apartmentAliases: string[]
  dateWords: {
    today: string[]
    tomorrow: string[]
    dayAfterTomorrow: string[]
  }
  timeWords: {
    morning: string[]
    early: string[]
    noon: string[]
    afternoon: string[]
    night: string[]
  }
  timePrefixes: string[]
  pestTargets: {
    cucarachas: string[]
    roedores: string[]
    chinches: string[]
  }
  locationWords: {
    lobby: string[]
    basement: string[]
    hallway: string[]
    mainEntrance: string[]
    garage: string[]
    stairs: string[]
    elevator: string[]
    terrace: string[]
    laundry: string[]
    area: string[]
    building: string[]
  }
  categories: Record<TaskCategory, string[]>
  priorities: {
    high: string[]
    low: string[]
  }
  visitTypes: Record<TreatmentVisitType, string[]>
}

const parserRulesByLocale: Record<ParserLocale, ParserRules> = {
  es,
  en,
  fr,
  ru,
}

const apartmentListConnectors = new Set(['y', 'and', 'et', 'и', ','])

type ParsedApartmentNumber = {
  value: string
  consumed: number
}

function getParserLocale(locale?: string): ParserLocale {
  const normalized = (locale || 'es').toLowerCase()

  if (normalized.startsWith('en')) return 'en'
  if (normalized.startsWith('fr')) return 'fr'
  if (normalized.startsWith('ru')) return 'ru'

  return 'es'
}

function getParserRules(locale?: string): ParserRules {
  return parserRulesByLocale[getParserLocale(locale)]
}

function formatDateToInput(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeSmartText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildWordRegex(words: string[]) {
  const normalizedWords = words
    .map((word) => escapeRegex(normalizeSmartText(word.trim())))
    .filter(Boolean)

  if (normalizedWords.length === 0) return null

  return new RegExp(`\\b(?:${normalizedWords.join('|')})\\b`, 'i')
}

function buildContainsRegex(words: string[]) {
  const normalizedWords = words
    .map((word) => escapeRegex(normalizeSmartText(word.trim())))
    .filter(Boolean)

  if (normalizedWords.length === 0) return null

  return new RegExp(`(?:${normalizedWords.join('|')})`, 'i')
}

function extractSmartDate(text: string, rules: ParserRules): string | null {
  const normalized = normalizeSmartText(text)
  const today = new Date()

  const dayAfterTomorrowRegex = buildWordRegex(rules.dateWords.dayAfterTomorrow)
  if (dayAfterTomorrowRegex?.test(normalized)) {
    const d = new Date(today)
    d.setDate(d.getDate() + 2)
    return formatDateToInput(d)
  }

  const tomorrowRegex = buildWordRegex(rules.dateWords.tomorrow)
  if (tomorrowRegex?.test(normalized)) {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return formatDateToInput(d)
  }

  const todayRegex = buildWordRegex(rules.dateWords.today)
  if (todayRegex?.test(normalized)) {
    return formatDateToInput(today)
  }

  return null
}

function padTime(n: number) {
  return `${n}`.padStart(2, '0')
}

function adjustHourWithDayPeriod(
  hour: number,
  context: string,
  rules: ParserRules
) {
  const normalizedContext = normalizeSmartText(context)
  const isAfternoonContext =
    buildContainsRegex(rules.timeWords.afternoon)?.test(normalizedContext) ||
    /\bde la tarde\b/.test(normalizedContext)
  const isNightContext =
    buildContainsRegex(rules.timeWords.night)?.test(normalizedContext) ||
    /\bde la noche\b/.test(normalizedContext)
  const isMorningContext =
    buildContainsRegex(rules.timeWords.morning)?.test(normalizedContext) ||
    buildContainsRegex(rules.timeWords.early)?.test(normalizedContext) ||
    /\bde la manana\b/.test(normalizedContext)
  const isNoonContext =
    buildContainsRegex(rules.timeWords.noon)?.test(normalizedContext) ||
    /\bdel mediodia\b/.test(normalizedContext)

  if (isAfternoonContext || isNightContext) {
    if (hour < 12) return hour + 12
    return hour
  }

  if (isMorningContext) {
    if (hour === 12) return 0
    return hour
  }

  if (isNoonContext) {
    if (hour < 12) return hour + 12
    return hour
  }

  return hour
}

function extractSmartTime(
  text: string,
  rules: ParserRules,
  locale: ParserLocale
): string | null {
  const normalized = normalizeSmartText(text)
  const prefixes = rules.timePrefixes.map(escapeRegex).join('|')

  const explicitHourMatch = normalized.match(
    new RegExp(
      `\\b(?:${prefixes})\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?\\b`,
      'i'
    )
  )

  if (explicitHourMatch) {
    let hour = Number(explicitHourMatch[1])
    const minute = Number(explicitHourMatch[2] ?? '0')
    const meridiem = explicitHourMatch[3]

    if (meridiem === 'pm' && hour < 12) hour += 12
    if (meridiem === 'am' && hour === 12) hour = 0
    if (!meridiem && explicitHourMatch.index !== undefined) {
      const trailingContext = normalized.slice(
        explicitHourMatch.index,
        explicitHourMatch.index + explicitHourMatch[0].length + 40
      )
      hour = adjustHourWithDayPeriod(hour, trailingContext, rules)
    }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${padTime(hour)}:${padTime(minute)}`
    }
  }

  const simpleTimeMatch = normalized.match(/\b(\d{1,2}):(\d{2})\b/)
  if (simpleTimeMatch) {
    const hour = Number(simpleTimeMatch[1])
    const minute = Number(simpleTimeMatch[2])

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${padTime(hour)}:${padTime(minute)}`
    }
  }

  if (prefixes) {
    const tokens = normalized
      .replace(/[,.:]/g, ' ')
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)

    for (let index = 0; index < tokens.length; index += 1) {
      const current = tokens[index]
      const next = tokens[index + 1]

      let hourStartIndex = -1

      if ((current === 'a' && next === 'las') || (current === 'a' && next === 'la')) {
        hourStartIndex = index + 2
      } else if (current === 'alas' || current === 'al') {
        hourStartIndex = index + 1
      }

      if (hourStartIndex === -1) continue

      const spokenHour = parseSpokenApartmentToken(tokens, hourStartIndex, locale)
      if (!spokenHour) continue

      const parsedHour = Number(spokenHour.value)
      if (Number.isNaN(parsedHour) || parsedHour < 0 || parsedHour > 23) continue
      const trailingContext = tokens
        .slice(hourStartIndex + spokenHour.consumed, hourStartIndex + spokenHour.consumed + 4)
        .join(' ')
      const adjustedHour = adjustHourWithDayPeriod(parsedHour, trailingContext, rules)

      return `${padTime(adjustedHour)}:00`
    }
  }

  if (buildContainsRegex(rules.timeWords.morning)?.test(normalized)) return '09:00'
  if (buildContainsRegex(rules.timeWords.early)?.test(normalized)) return '08:00'
  if (buildContainsRegex(rules.timeWords.noon)?.test(normalized)) return '12:00'
  if (buildContainsRegex(rules.timeWords.afternoon)?.test(normalized)) return '15:00'
  if (buildContainsRegex(rules.timeWords.night)?.test(normalized)) return '19:00'

  return null
}

function extractPestTargets(text: string, rules: ParserRules): PestTarget[] {
  const normalized = normalizeSmartText(text)
  const targets: PestTarget[] = []

  if (buildWordRegex(rules.pestTargets.cucarachas)?.test(normalized)) {
    targets.push('cucarachas')
  }

  if (buildWordRegex(rules.pestTargets.roedores)?.test(normalized)) {
    targets.push('roedores')
  }

  if (buildWordRegex(rules.pestTargets.chinches)?.test(normalized)) {
    targets.push('chinches')
  }

  return targets
}

function normalizeApartmentAliases(text: string, rules: ParserRules) {
  let result = normalizeSmartText(text)

  for (const alias of rules.apartmentAliases) {
    const aliasRegex = new RegExp(`\\b${escapeRegex(normalizeSmartText(alias))}\\b`, 'gi')
    result = result.replace(aliasRegex, 'apto')
  }

  return result
}

function parseSpanishNumberTokens(
  tokens: string[],
  startIndex: number
): ParsedApartmentNumber | null {
  const units: Record<string, number> = {
    cero: 0,
    un: 1,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
  }
  const teens: Record<string, number> = {
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    diecisiete: 17,
    dieciocho: 18,
    diecinueve: 19,
  }
  const tens: Record<string, number> = {
    veinte: 20,
    treinta: 30,
    cuarenta: 40,
    cincuenta: 50,
    sesenta: 60,
    setenta: 70,
    ochenta: 80,
    noventa: 90,
  }

  const first = tokens[startIndex]
  if (!first) return null

  const veintiMatch = first.match(/^veinti([a-z]+)$/)
  if (veintiMatch && units[veintiMatch[1]]) {
    return { value: String(20 + units[veintiMatch[1]]), consumed: 1 }
  }

  if (teens[first] !== undefined) {
    return { value: String(teens[first]), consumed: 1 }
  }

  if (tens[first] !== undefined) {
    if (tokens[startIndex + 1] === 'y' && units[tokens[startIndex + 2]] !== undefined) {
      return {
        value: String(tens[first] + units[tokens[startIndex + 2]]),
        consumed: 3,
      }
    }

    return { value: String(tens[first]), consumed: 1 }
  }

  if (first === 'cien') {
    return { value: '100', consumed: 1 }
  }

  if (first === 'ciento') {
    const next = parseSpanishNumberTokens(tokens, startIndex + 1)
    if (next) {
      return { value: String(100 + Number(next.value)), consumed: 1 + next.consumed }
    }
    return { value: '100', consumed: 1 }
  }

  if (units[first] !== undefined) {
    return { value: String(units[first]), consumed: 1 }
  }

  return null
}

function parseEnglishNumberTokens(
  tokens: string[],
  startIndex: number
): ParsedApartmentNumber | null {
  const units: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
  }
  const teens: Record<string, number> = {
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
  }
  const tens: Record<string, number> = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  }

  const first = tokens[startIndex]
  if (!first) return null

  if (teens[first] !== undefined) {
    return { value: String(teens[first]), consumed: 1 }
  }

  if (tens[first] !== undefined) {
    if (units[tokens[startIndex + 1]] !== undefined) {
      return {
        value: String(tens[first] + units[tokens[startIndex + 1]]),
        consumed: 2,
      }
    }

    return { value: String(tens[first]), consumed: 1 }
  }

  if (first === 'one' && tokens[startIndex + 1] === 'hundred') {
    const next = parseEnglishNumberTokens(tokens, startIndex + 2)
    if (next) {
      return { value: String(100 + Number(next.value)), consumed: 2 + next.consumed }
    }
    return { value: '100', consumed: 2 }
  }

  if (units[first] !== undefined) {
    return { value: String(units[first]), consumed: 1 }
  }

  return null
}

function parseSpokenApartmentToken(
  tokens: string[],
  startIndex: number,
  locale: ParserLocale
) {
  const token = tokens[startIndex]
  if (!token) return null

  if (/^[a-z]?\d+[a-z]?$/i.test(token)) {
    return { value: token.toUpperCase(), consumed: 1 }
  }

  if (locale === 'es') {
    return parseSpanishNumberTokens(tokens, startIndex)
  }

  if (locale === 'en') {
    return parseEnglishNumberTokens(tokens, startIndex)
  }

  return null
}

function extractSmartApartments(
  text: string,
  rules: ParserRules,
  locale: ParserLocale
): string[] {
  const normalized = normalizeApartmentAliases(text, rules)

  const match = normalized.match(
    /\bapto\b\s+((?:[a-z]?\d+[a-z]?(?:\s*,\s*|\s+y\s+|\s+and\s+|\s+et\s+|\s+и\s+|\s+)?)+)/i
  )

  if (match?.[1]) {
    const rawBlock = match[1]

    const apartments = rawBlock
      .split(/\s*,\s*|\s+y\s+|\s+and\s+|\s+et\s+|\s+и\s+|\s+/i)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => /^[a-z]?\d+[a-z]?$/i.test(item))
      .map((item) => `${rules.apartmentPrefix} ${item.toUpperCase()}`)

    if (apartments.length > 0) {
      return Array.from(new Set(apartments))
    }
  }

  const tokens = normalized
    .replace(/,/g, ' , ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const apartments: string[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index] !== 'apto') continue

    let cursor = index + 1

    while (cursor < tokens.length) {
      if (apartmentListConnectors.has(tokens[cursor])) {
        cursor += 1
        continue
      }

      const parsed = parseSpokenApartmentToken(tokens, cursor, locale)
      if (!parsed) break

      apartments.push(`${rules.apartmentPrefix} ${parsed.value.toUpperCase()}`)
      cursor += parsed.consumed

      const nextToken = tokens[cursor] || ''
      const nextParsed = parseSpokenApartmentToken(tokens, cursor, locale)

      if (!apartmentListConnectors.has(nextToken) && !nextParsed) {
        break
      }
    }
  }

  return Array.from(new Set(apartments))
}

function extractSmartAreas(
  text: string,
  rules: ParserRules
): string[] {
  const original = text.trim()
  const normalizedOriginal = normalizeSmartText(original)
  const matches: string[] = []

  const singleWordLocations: Array<[string[], string]> = [
    [rules.locationWords.lobby, capitalize(rules.locationWords.lobby[0] || 'Lobby')],
    [rules.locationWords.basement, capitalize(rules.locationWords.basement[0] || 'Basement')],
    [rules.locationWords.hallway, capitalize(rules.locationWords.hallway[0] || 'Hallway')],
    [rules.locationWords.mainEntrance, capitalize(rules.locationWords.mainEntrance[0] || 'Main entrance')],
    [rules.locationWords.garage, capitalize(rules.locationWords.garage[0] || 'Garage')],
    [rules.locationWords.stairs, capitalize(rules.locationWords.stairs[0] || 'Stairs')],
    [rules.locationWords.elevator, capitalize(rules.locationWords.elevator[0] || 'Elevator')],
    [rules.locationWords.terrace, capitalize(rules.locationWords.terrace[0] || 'Terrace')],
    [rules.locationWords.laundry, capitalize(rules.locationWords.laundry[0] || 'Laundry')],
  ]

  for (const [words, label] of singleWordLocations) {
    if (buildContainsRegex(words)?.test(normalizedOriginal)) {
      matches.push(label)
    }
  }

  const areaMatch = buildLocationPhraseMatch(original, rules.locationWords.area)
  if (areaMatch) matches.push(areaMatch)

  const buildingMatch = buildLocationPhraseMatch(original, rules.locationWords.building)
  if (buildingMatch) matches.push(buildingMatch)

  return Array.from(new Set(matches))
}

function extractSmartLocation(
  text: string,
  rules: ParserRules,
  locale: ParserLocale
): string | null {
  const apartments = extractSmartApartments(text, rules, locale)
  if (apartments.length > 0) {
    return apartments[0]
  }

  const areas = extractSmartAreas(text, rules)
  return areas[0] || null
}

function buildLocationPhraseMatch(text: string, keywords: string[]) {
  for (const keyword of keywords) {
    const match = text.match(
      new RegExp(
        `\\b(${escapeRegex(keyword)}\\s+[\\p{L}0-9-]+(?:\\s+[\\p{L}0-9-]+)*)\\b`,
        'iu'
      )
    )
    if (match?.[1]) {
      return capitalize(match[1].replace(/\s{2,}/g, ' ').trim())
    }
  }

  return null
}

function extractSmartCategory(text: string, rules: ParserRules): TaskCategory | null {
  const normalized = normalizeSmartText(text)

  const order: TaskCategory[] = [
    'cleaning',
    'pest',
    'paint',
    'inspection',
    'visit',
    'change',
    'delivery',
    'repair',
    'other',
  ]

  for (const category of order) {
    if (buildContainsRegex(rules.categories[category])?.test(normalized)) {
      return category
    }
  }

  return null
}

function extractSmartPriority(text: string, rules: ParserRules): TaskPriority | null {
  const normalized = normalizeSmartText(text)

  if (buildContainsRegex(rules.priorities.high)?.test(normalized)) {
    return 'high'
  }

  if (buildContainsRegex(rules.priorities.low)?.test(normalized)) {
    return 'low'
  }

  return null
}

function extractSmartVisitType(
  text: string,
  rules: ParserRules
): TreatmentVisitType | null {
  const normalized = normalizeSmartText(text)

  if (buildContainsRegex(rules.visitTypes.seguimiento)?.test(normalized)) {
    return 'seguimiento'
  }

  if (buildContainsRegex(rules.visitTypes.preventivo)?.test(normalized)) {
    return 'preventivo'
  }

  if (buildContainsRegex(rules.visitTypes.nuevo)?.test(normalized)) {
    return 'nuevo'
  }

  return null
}

function cleanSmartTitle(text: string, rules: ParserRules) {
  let cleaned = text

  const removableDateWords = [
    ...rules.dateWords.today,
    ...rules.dateWords.tomorrow,
    ...rules.dateWords.dayAfterTomorrow,
  ]

  const removableTimeWords = [
    ...rules.timeWords.morning,
    ...rules.timeWords.early,
    ...rules.timeWords.noon,
    ...rules.timeWords.afternoon,
    ...rules.timeWords.night,
  ]

  const removablePriorityWords = [
    ...rules.priorities.high,
    ...rules.priorities.low,
  ]

  const removableVisitTypeWords = [
    ...rules.visitTypes.nuevo,
    ...rules.visitTypes.seguimiento,
    ...rules.visitTypes.preventivo,
  ]

  const removableApartmentAliases = rules.apartmentAliases

  const allRemovableWords = [
    ...removableDateWords,
    ...removableTimeWords,
    ...removablePriorityWords,
    ...removableVisitTypeWords,
  ]

  if (allRemovableWords.length > 0) {
    cleaned = cleaned.replace(
      new RegExp(
        `\\b(?:${allRemovableWords
          .map((word) => escapeRegex(word))
          .join('|')})\\b`,
        'gi'
      ),
      ''
    )
  }

  cleaned = cleaned.replace(
    /\b(?:\d{1,2}:\d{2})\b/gi,
    ''
  )

  cleaned = cleaned.replace(
    /\b(?:a las|alas|a la|al)\s+(?:\d{1,2}|[\p{L}]+)(?::\d{2})?(?:\s*(?:am|pm))?(?:\s+de\s+la\s+(?:mañana|manana|tarde|noche)|\s+del\s+(?:mediodía|mediodia))?\b/giu,
    ''
  )

  if (rules.timePrefixes.length > 0) {
    cleaned = cleaned.replace(
      new RegExp(
        `\\b(?:${rules.timePrefixes.map(escapeRegex).join('|')})\\s*\\d{1,2}(?::\\d{2})?\\s*(am|pm)?\\b`,
        'gi'
      ),
      ''
    )
  }

  if (removableApartmentAliases.length > 0) {
    cleaned = cleaned.replace(
      new RegExp(
        `\\b(?:${removableApartmentAliases
          .map((word) => escapeRegex(word))
          .join('|')})\\b\\s+(?:[a-z]?\\d+[a-z]?(?:\\s*,\\s*|\\s+y\\s+|\\s+and\\s+|\\s+et\\s+|\\s+и\\s+|\\s+)?)+`,
        'gi'
      ),
      ''
    )
  }

  const areaBuildingWords = [
    ...rules.locationWords.area,
    ...rules.locationWords.building,
  ]

  if (areaBuildingWords.length > 0) {
    cleaned = cleaned.replace(
      new RegExp(
        `\\b(?:${areaBuildingWords.map(escapeRegex).join('|')})\\s+[\\p{L}0-9-]+(?:\\s+[\\p{L}0-9-]+)*\\b`,
        'giu'
      ),
      ''
    )
  }

  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
  cleaned = cleaned.replace(/^[,.\-:;\s]+|[,.\-:;\s]+$/g, '')

  if (!cleaned) return text.trim()

  return capitalize(cleaned)
}

function capitalize(text: string) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function parseSmartTaskInput(
  input: string,
  locale: string = 'es'
): SmartTaskParseResult {
  const parserLocale = getParserLocale(locale)
  const rules = getParserRules(locale)

  const detectedCategory = extractSmartCategory(input, rules)
  const detectedDate = extractSmartDate(input, rules)
  const detectedTime = extractSmartTime(input, rules, parserLocale)
  const detectedApartments = extractSmartApartments(input, rules, parserLocale)
  const detectedAreas = extractSmartAreas(input, rules)
  const detectedLocation = extractSmartLocation(input, rules, parserLocale)
  const detectedPriority = extractSmartPriority(input, rules)
  const detectedVisitType = extractSmartVisitType(input, rules)
  const detectedPestTargets = extractPestTargets(input, rules)
  const cleanedTitle = cleanSmartTitle(input, rules)

  const shouldAutoSubmit =
    cleanedTitle.trim().length >= 4 &&
    !!detectedDate &&
    detectedCategory !== 'pest'

  return {
    cleanedTitle,
    detectedCategory,
    detectedPriority,
    detectedDate,
    detectedTime,
    detectedLocation,
    detectedAreas,
    detectedApartments,
    detectedPestTargets,
    detectedVisitType,
    shouldAutoSubmit,
  }
}
