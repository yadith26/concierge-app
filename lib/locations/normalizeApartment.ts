function normalizeApartmentPrefix(text: string) {
  return text
    .replace(/^apartamento\b\s*/i, 'apto ')
    .replace(/^apartment\b\s*/i, 'apto ')
    .replace(/^appartement\b\s*/i, 'apto ')
    .replace(/^appt\b\s*/i, 'apto ')
    .replace(/^apart\b\s*/i, 'apto ')
    .replace(/^apto\b\s*/i, 'apto ')
    .replace(/^apt\b\s*/i, 'apto ')
}

export function normalizeApartmentKey(value: string) {
  if (!value.trim()) return ''

  let text = value.trim().toLowerCase()

  text = text.replace(/[./\\-]/g, ' ')
  text = text.replace(/\s+/g, ' ')
  text = normalizeApartmentPrefix(text)

  return text.replace(/\s+/g, '')
}

export function formatApartmentLabel(value: string) {
  if (!value.trim()) return ''

  let text = value.trim()

  text = text.replace(/[./\\-]/g, ' ')
  text = text.replace(/\s+/g, ' ')
  text = normalizeApartmentPrefix(text)
  text = text.replace(/^apto\s*/i, 'Apto ')

  return text.trim()
}

export function isApartmentReference(value?: string | null) {
  const compactValue = (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[./\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const commonAreaPatterns = [
    /^lobby$/i,
    /^garage$/i,
    /^garaje$/i,
    /^hallway$/i,
    /^pasillo$/i,
    /^stairs$/i,
    /^escalera$/i,
    /^elevator$/i,
    /^ascensor$/i,
    /^terrace$/i,
    /^terraza$/i,
    /^basement$/i,
    /^sotano$/i,
    /^sótano$/i,
    /^laundry$/i,
    /^lavanderia$/i,
    /^lavandería$/i,
  ]

  return !commonAreaPatterns.some((pattern) => pattern.test(compactValue))
}
