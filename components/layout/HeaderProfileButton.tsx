'use client'

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { getAvatarEmoji } from '@/lib/profile/avatarOptions'
import { supabase } from '@/lib/supabase'

type HeaderProfileButtonProps = {
  avatarEmoji?: string | null
  avatarKey?: string | null
  compact?: boolean
  href?: string
  profilePhotoUrl?: string | null
  variant?: 'app' | 'manager'
}

export default function HeaderProfileButton({
  avatarEmoji,
  avatarKey,
  compact = false,
  href = '/setup-profile',
  profilePhotoUrl,
  variant = 'app',
}: HeaderProfileButtonProps) {
  const [loadedAvatarKey, setLoadedAvatarKey] = useState<string | null>(null)
  const [loadedProfilePhotoUrl, setLoadedProfilePhotoUrl] = useState<
    string | null
  >(null)
  const effectiveAvatarKey = avatarKey ?? loadedAvatarKey
  const effectiveProfilePhotoUrl = profilePhotoUrl ?? loadedProfilePhotoUrl
  const resolvedAvatarEmoji = avatarEmoji ?? getAvatarEmoji(effectiveAvatarKey)
  const roundedClass =
    variant === 'manager'
      ? compact
        ? 'rounded-[18px]'
        : 'rounded-[24px]'
      : 'rounded-[22px]'
  const sizeClass = compact
    ? 'flex h-11 w-11 items-center justify-center'
    : 'flex h-14 w-14 items-center justify-center'

  useEffect(() => {
    if (
      avatarEmoji ||
      avatarKey !== undefined ||
      profilePhotoUrl !== undefined
    ) {
      return
    }

    let active = true

    const loadAvatar = async () => {
      const {
        data: { user },
      } = await getSafeAuthUser()

      if (!user || !active) return

      const { data } = await supabase
        .from('profiles')
        .select('avatar_key, profile_photo_url')
        .eq('id', user.id)
        .maybeSingle()

      if (active) {
        setLoadedAvatarKey(
          typeof data?.avatar_key === 'string' ? data.avatar_key : null
        )
        setLoadedProfilePhotoUrl(
          typeof data?.profile_photo_url === 'string'
            ? data.profile_photo_url
            : null
        )
      }
    }

    void loadAvatar()

    return () => {
      active = false
    }
  }, [avatarEmoji, avatarKey, profilePhotoUrl])

  return (
    <Link
      href={href}
      className={`shrink-0 border border-[#D9E0EA] bg-white/85 text-[#6E7F9D] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm transition-all duration-300 hover:bg-white ${sizeClass} ${roundedClass}`}
      aria-label="Ir al perfil"
    >
      {effectiveProfilePhotoUrl ? (
        <span
          className="h-full w-full rounded-[inherit] bg-cover bg-center"
          style={{ backgroundImage: `url("${effectiveProfilePhotoUrl}")` }}
          aria-hidden="true"
        />
      ) : resolvedAvatarEmoji ? (
        <span className={compact ? 'text-[20px]' : 'text-[24px]'}>
          {resolvedAvatarEmoji}
        </span>
      ) : (
        <User size={compact ? 20 : 24} />
      )}
    </Link>
  )
}
