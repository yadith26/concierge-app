export type ManagerTaskCategory =
  | 'call'
  | 'email'
  | 'follow_up'
  | 'document'
  | 'payment'
  | 'meeting'
  | 'vendor'
  | 'reminder'
  | 'other'

type ManagerCategoryOption = {
  value: ManagerTaskCategory
  label: string
}

const managerCategoryLabels: Record<ManagerTaskCategory, string> = {
  call: 'Llamada',
  email: 'Correo',
  follow_up: 'Seguimiento',
  document: 'Documento',
  payment: 'Pago',
  meeting: 'Reunion',
  vendor: 'Proveedor',
  reminder: 'Recordatorio',
  other: 'Otro',
}

const categoryKeywordMap: Record<ManagerTaskCategory, string[]> = {
  call: [
    'llamar',
    'llamada',
    'telefono',
    'phone',
    'call',
    'appel',
    'appeler',
    'звонок',
    'позвонить',
  ],
  email: [
    'correo',
    'email',
    'e-mail',
    'mail',
    'enviar',
    'escribir',
    'courriel',
    'envoyer',
    'почта',
    'письмо',
    'email',
  ],
  follow_up: [
    'seguimiento',
    'follow up',
    'follow-up',
    'dar seguimiento',
    'revisar estado',
    'suivi',
    'проверить',
    'контроль',
  ],
  document: [
    'contrato',
    'documento',
    'documentos',
    'lease',
    'seguro',
    'document',
    'contract',
    'assurance',
    'документ',
    'договор',
  ],
  payment: [
    'pagar',
    'pago',
    'factura',
    'cobro',
    'invoice',
    'payment',
    'pay',
    'payer',
    'facture',
    'оплата',
    'счет',
  ],
  meeting: [
    'reunion',
    'reunir',
    'cita',
    'meeting',
    'meet',
    'rendez vous',
    'rendez-vous',
    'réunion',
    'встреча',
  ],
  vendor: [
    'proveedor',
    'contratista',
    'plomero',
    'electricista',
    'exterminador',
    'supplier',
    'vendor',
    'contractor',
    'plumber',
    'electrician',
    'fournisseur',
    'поставщик',
    'подрядчик',
  ],
  reminder: [
    'recordar',
    'recordatorio',
    'reminder',
    'remind',
    'rappel',
    'напоминание',
    'напомнить',
  ],
  other: [],
}

export const managerTaskCategoryOptions: ManagerCategoryOption[] = [
  { value: 'call', label: managerCategoryLabels.call },
  { value: 'email', label: managerCategoryLabels.email },
  { value: 'follow_up', label: managerCategoryLabels.follow_up },
  { value: 'document', label: managerCategoryLabels.document },
  { value: 'payment', label: managerCategoryLabels.payment },
  { value: 'meeting', label: managerCategoryLabels.meeting },
  { value: 'vendor', label: managerCategoryLabels.vendor },
  { value: 'reminder', label: managerCategoryLabels.reminder },
  { value: 'other', label: managerCategoryLabels.other },
]

export function getManagerTaskCategoryLabel(category: string | null | undefined) {
  return (
    managerCategoryLabels[category as ManagerTaskCategory] ||
    managerCategoryLabels.other
  )
}

export function detectManagerTaskCategory(input: string) {
  const normalized = normalizeForCategory(input)

  const order: ManagerTaskCategory[] = [
    'call',
    'email',
    'payment',
    'document',
    'meeting',
    'vendor',
    'follow_up',
    'reminder',
  ]

  for (const category of order) {
    const keywords = categoryKeywordMap[category]
    if (keywords.some((keyword) => normalized.includes(normalizeForCategory(keyword)))) {
      return category
    }
  }

  return null
}

export function normalizeManagerTaskCategory(value: string | null | undefined) {
  const validCategories = new Set<ManagerTaskCategory>(
    managerTaskCategoryOptions.map((option) => option.value)
  )

  if (validCategories.has(value as ManagerTaskCategory)) {
    return value as ManagerTaskCategory
  }

  if (!value) return null

  if (['delivery', 'change', 'repair', 'paint', 'pest', 'inspection'].includes(value)) {
    return 'follow_up'
  }

  if (value === 'visit') return 'meeting'
  if (value === 'cleaning') return 'vendor'

  return 'other'
}

function normalizeForCategory(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
