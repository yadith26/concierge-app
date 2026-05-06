import { supabase } from '@/lib/supabase'

type SafeAuthUserResponse = {
  data: {
    user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null
  }
  error: Error | null
}

let pendingAuthUserRequest: Promise<SafeAuthUserResponse> | null = null

export async function getSafeAuthUser(): Promise<SafeAuthUserResponse> {
  if (!pendingAuthUserRequest) {
    pendingAuthUserRequest = (async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (session?.user) {
        return {
          data: { user: session.user },
          error: null,
        }
      }

      if (sessionError) {
        return {
          data: { user: null },
          error: sessionError,
        }
      }

      const { data, error } = await supabase.auth.getUser()
      return { data, error }
    })().finally(() => {
      pendingAuthUserRequest = null
    })
  }

  return pendingAuthUserRequest
}
