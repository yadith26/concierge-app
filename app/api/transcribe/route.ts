export const runtime = 'nodejs'

function resolveLanguage(locale: string | null) {
  if (!locale) return 'es'
  if (locale.startsWith('en')) return 'en'
  if (locale.startsWith('fr')) return 'fr'
  if (locale.startsWith('ru')) return 'ru'
  return 'es'
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: 'Missing OPENAI_API_KEY on the server.' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const locale = String(formData.get('locale') || '')

    if (!(file instanceof File)) {
      return Response.json({ error: 'Audio file is required.' }, { status: 400 })
    }

    if (!file.size) {
      return Response.json({ error: 'Audio file is empty.' }, { status: 400 })
    }

    const upstreamFormData = new FormData()
    upstreamFormData.append('file', file, file.name || 'dictation.webm')
    upstreamFormData.append('model', 'gpt-4o-mini-transcribe')
    upstreamFormData.append('response_format', 'json')
    upstreamFormData.append('language', resolveLanguage(locale))

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamFormData,
    })

    const data = (await response.json().catch(() => null)) as
      | { text?: string; error?: { message?: string } }
      | null

    if (!response.ok) {
      return Response.json(
        {
          error:
            data?.error?.message ||
            'OpenAI transcription request failed.',
        },
        { status: response.status }
      )
    }

    return Response.json({ text: data?.text || '' })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected transcription error.',
      },
      { status: 500 }
    )
  }
}
