'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { avatarOptions as profileAvatarOptions } from '@/lib/profile/avatarOptions'
import {
  removeProfilePhoto,
  uploadProfilePhoto,
} from '@/lib/profile/profilePhotoActions'
import {
  connectBuildingByCode,
  createBuildingForUser,
  fetchBuildingsForUser,
  unlinkBuildingFromUser,
  updateBuilding,
  type BuildingSummary,
} from '@/lib/buildings/buildingMembershipService'

export const languageOptions = [
  { value: 'es', label: 'Espa\u00f1ol' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Fran\u00e7ais' },
  { value: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
] as const

type ProfileRole = 'concierge' | 'manager'
type BuildingConnectionMode = 'edit' | 'create' | 'join'

export function useSetupProfilePage() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [buildingName, setBuildingName] = useState('')
  const [buildingAddress, setBuildingAddress] = useState('')
  const [buildingInviteCode, setBuildingInviteCode] = useState('')
  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [currentBuilding, setCurrentBuilding] = useState<BuildingSummary | null>(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  )
  const [removeCurrentProfilePhoto, setRemoveCurrentProfilePhoto] =
    useState(false)
  const [joinInviteCode, setJoinInviteCode] = useState('')
  const [buildingConnectionMode, setBuildingConnectionMode] =
    useState<BuildingConnectionMode>('create')
  const [avatarKey, setAvatarKey] = useState('avatar-1')
  const [locale, setLocale] = useState('es')
  const [profileRole, setProfileRole] = useState<ProfileRole>('concierge')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailChangeMessage, setEmailChangeMessage] = useState('')
  const [emailChangeMessageType, setEmailChangeMessageType] = useState<
    'success' | 'error' | ''
  >('')
  const [changingEmail, setChangingEmail] = useState(false)
  const [disconnectingBuildingId, setDisconnectingBuildingId] = useState<
    string | null
  >(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [compactHeader, setCompactHeader] = useState(false)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [buildingId, setBuildingId] = useState<string | null>(null)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)

  const scrollRef = useRef<HTMLElement | null>(null)
  const avatarPickerRef = useRef<HTMLDivElement | null>(null)
  const languageRef = useRef<HTMLDivElement | null>(null)

  const selectedAvatar =
    profileAvatarOptions.find((avatar) => avatar.key === avatarKey) ||
    profileAvatarOptions[0]

  const selectedLanguage =
    languageOptions.find((option) => option.value === locale) ||
    languageOptions[0]

  const persistSelectedBuildingId = (nextBuildingId: string | null, currentUserId?: string | null) => {
    if (typeof window === 'undefined' || !currentUserId) return

    const storageKey = `setup-profile:selected-building-id:${currentUserId}`

    if (!nextBuildingId) {
      window.localStorage.removeItem(storageKey)
      return
    }

    window.localStorage.setItem(storageKey, nextBuildingId)
  }

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await getSafeAuthUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        setUserId(user.id)
        setUserEmail(user.email ?? '')
        const nextProfileRole: ProfileRole =
          user.user_metadata?.role === 'manager' ? 'manager' : 'concierge'

        setProfileRole(nextProfileRole)
        setLocale(
          typeof user.user_metadata?.locale === 'string'
            ? user.user_metadata.locale
            : 'es'
        )

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData) {
          setFirstName(profileData.first_name ?? '')
          setLastName(profileData.last_name ?? '')
          setAvatarKey(profileData.avatar_key ?? 'avatar-1')
          setProfilePhotoUrl(profileData.profile_photo_url ?? null)
          setLocale(profileData.locale ?? 'es')
          const existingRole: ProfileRole =
            profileData.role === 'manager' ? 'manager' : 'concierge'
          setProfileRole(existingRole)
          setHasExistingProfile(true)
        }

        const effectiveRole =
          profileData?.role === 'manager' ? 'manager' : nextProfileRole

        const nextBuildings = await fetchBuildingsForUser({
          userId: user.id,
          role: effectiveRole,
        }).catch(() => [])

        setBuildings(nextBuildings)

        const persistedBuildingId =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(
                `setup-profile:selected-building-id:${user.id}`
              )
            : null

        const buildingData =
          nextBuildings.find((building) => building.id === persistedBuildingId) ||
          nextBuildings.find((building) => building.id === profileData?.building_id) ||
          nextBuildings[0] ||
          null

        if (buildingData) {
          setBuildingId(buildingData.id)
          setBuildingName(buildingData.name ?? '')
          setBuildingAddress(buildingData.address ?? '')
          setBuildingInviteCode(buildingData.invite_code ?? '')
          setCurrentBuilding(buildingData)
          persistSelectedBuildingId(buildingData.id, user.id)
          setHasExistingProfile(true)
          setBuildingConnectionMode('edit')
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar tu informacion.'
        )
        setMessageType('error')
      } finally {
        setInitialLoading(false)
      }
    }

    void loadUserData()
  }, [router])

  useEffect(() => {
    if (initialLoading) return

    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      setCompactHeader(element.scrollTop > 18)
    }

    handleScroll()
    element.addEventListener('scroll', handleScroll)

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [initialLoading])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarPickerRef.current &&
        !avatarPickerRef.current.contains(event.target as Node)
      ) {
        setAvatarPickerOpen(false)
      }

      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setLanguageOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setMessageType('')

    if (!userId || !userEmail) {
      setMessage(t('setupProfile.messages.userError'))
      setMessageType('error')
      return
    }

    setLoading(true)

    let nextProfilePhotoUrl = removeCurrentProfilePhoto ? null : profilePhotoUrl

    try {
      if (profilePhotoFile) {
        nextProfilePhotoUrl = await uploadProfilePhoto({
          file: profilePhotoFile,
          previousPhotoUrl: profilePhotoUrl,
          userId,
        })
      } else if (removeCurrentProfilePhoto && profilePhotoUrl) {
        await removeProfilePhoto(profilePhotoUrl)
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `No se pudo guardar la foto: ${error.message}`
          : 'No se pudo guardar la foto.'
      )
      setMessageType('error')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email: userEmail,
      avatar_key: avatarKey,
      profile_photo_url: nextProfilePhotoUrl,
      locale,
      role: profileRole,
    })

    if (profileError) {
      setMessage(
        `${t('setupProfile.messages.profileSaveError')}: ${profileError.message}`
      )
      setMessageType('error')
      setLoading(false)
      return
    }

    if (buildingConnectionMode === 'join') {
      try {
        const buildingToJoin = await connectBuildingByCode({
          inviteCode: joinInviteCode,
          userId,
          role: profileRole,
        })

        setBuildingId(buildingToJoin.id)
        setBuildingName(buildingToJoin.name ?? '')
        setBuildingAddress(buildingToJoin.address ?? '')
        setBuildingInviteCode(buildingToJoin.invite_code ?? '')
        setCurrentBuilding(buildingToJoin)
        persistSelectedBuildingId(buildingToJoin.id, userId)
        setBuildings((prev) =>
          prev.some((building) => building.id === buildingToJoin.id)
            ? prev
            : [...prev, buildingToJoin]
        )
        setBuildingConnectionMode('edit')
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : 'No se pudo conectar el edificio.'
        )
        setMessageType('error')
        setLoading(false)
        return
      }

      setHasExistingProfile(true)
      setAvatarPickerOpen(false)
      setLanguageOpen(false)
      setMessage(t('setupProfile.messages.success'))
      setMessageType('success')
      setLoading(false)

      router.replace(profileRole === 'manager' ? '/manager' : '/dashboard', {
        locale,
      })
      router.refresh()
      return
    }

    if (buildingConnectionMode === 'edit' && buildingId) {
      try {
        const updatedBuilding = await updateBuilding({
          buildingId,
          name: buildingName,
          address: buildingAddress,
          inviteCode: buildingInviteCode,
          userId,
          role: profileRole,
        })

        setBuildingInviteCode(updatedBuilding.invite_code ?? '')
        setCurrentBuilding(updatedBuilding)
        setBuildings((prev) =>
          prev.map((building) =>
            building.id === updatedBuilding.id ? updatedBuilding : building
          )
        )
      } catch (error) {
        setMessage(
          `${t('setupProfile.messages.buildingSaveError')}: ${
            error instanceof Error ? error.message : ''
          }`
        )
        setMessageType('error')
        setLoading(false)
        return
      }
      setHasExistingProfile(true)
      setAvatarPickerOpen(false)
      setLanguageOpen(false)
      setMessage(t('setupProfile.messages.success'))
      setMessageType('success')
      setLoading(false)

      router.replace(profileRole === 'manager' ? '/manager' : pathname, {
        locale,
      })
      router.refresh()
      return
    }

    if (!buildingName.trim()) {
      setMessage('Escribe el nombre del edificio.')
      setMessageType('error')
      setLoading(false)
      return
    }

    setProfilePhotoUrl(nextProfilePhotoUrl)
    setProfilePhotoFile(null)
    setRemoveCurrentProfilePhoto(false)
    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview)
      setProfilePhotoPreview(null)
    }

    try {
      const createdBuilding = await createBuildingForUser({
        name: buildingName,
        address: buildingAddress,
        userId,
        role: profileRole,
      })

      setBuildingId(createdBuilding.id)
      setBuildingName(createdBuilding.name ?? '')
      setBuildingAddress(createdBuilding.address ?? '')
      setBuildingInviteCode(createdBuilding.invite_code ?? '')
      setCurrentBuilding(createdBuilding)
      persistSelectedBuildingId(createdBuilding.id, userId)
      setBuildings((prev) =>
        prev.some((building) => building.id === createdBuilding.id)
          ? prev
          : [...prev, createdBuilding]
      )
      setBuildingConnectionMode('edit')
    } catch (error) {
      setMessage(
        `${t('setupProfile.messages.buildingSaveError')}: ${
          error instanceof Error ? error.message : ''
        }`
      )
      setMessageType('error')
      setLoading(false)
      return
    }
    setHasExistingProfile(true)
    setAvatarPickerOpen(false)
    setLanguageOpen(false)
    setMessage(t('setupProfile.messages.success'))
    setMessageType('success')
    setLoading(false)

    router.replace(profileRole === 'manager' ? '/manager' : pathname, {
      locale,
    })
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login', { locale })
  }

  const handleEmailChange = async () => {
    const cleanEmail = newEmail.trim().toLowerCase()
    setEmailChangeMessage('')
    setEmailChangeMessageType('')

    if (!cleanEmail) {
      setEmailChangeMessage(t('setupProfile.emailAccess.emptyError'))
      setEmailChangeMessageType('error')
      return
    }

    if (cleanEmail === userEmail?.toLowerCase()) {
      setEmailChangeMessage(t('setupProfile.emailAccess.sameEmailError'))
      setEmailChangeMessageType('error')
      return
    }

    setChangingEmail(true)

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/${locale}/setup-profile`
          : undefined

      const { error } = await supabase.auth.updateUser(
        { email: cleanEmail },
        redirectTo ? { emailRedirectTo: redirectTo } : undefined
      )

      if (error) {
        throw error
      }

      setNewEmail('')
      setEmailChangeMessage(t('setupProfile.emailAccess.success'))
      setEmailChangeMessageType('success')
    } catch (error) {
      setEmailChangeMessage(
        error instanceof Error
          ? error.message
          : t('setupProfile.emailAccess.genericError')
      )
      setEmailChangeMessageType('error')
    } finally {
      setChangingEmail(false)
    }
  }

  const handleBuildingConnectionModeChange = (mode: BuildingConnectionMode) => {
    setBuildingConnectionMode(mode)

    if (mode === 'create') {
      setBuildingName('')
      setBuildingAddress('')
      setBuildingInviteCode('')
      return
    }

    if (mode === 'join') {
      setJoinInviteCode('')
      return
    }

    if (mode === 'edit' && currentBuilding) {
      setBuildingName(currentBuilding.name ?? '')
      setBuildingAddress(currentBuilding.address ?? '')
      setBuildingInviteCode(currentBuilding.invite_code ?? '')
    }
  }

  const handleProfilePhotoSelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Selecciona una imagen valida.')
      setMessageType('error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('La foto no puede pasar de 5 MB.')
      setMessageType('error')
      return
    }

    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview)
    }

    setProfilePhotoFile(file)
    setProfilePhotoPreview(URL.createObjectURL(file))
    setRemoveCurrentProfilePhoto(false)
    setMessage('')
    setMessageType('')
  }

  const clearProfilePhoto = () => {
    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview)
    }

    setProfilePhotoFile(null)
    setProfilePhotoPreview(null)
    setRemoveCurrentProfilePhoto(Boolean(profilePhotoUrl))
  }

  useEffect(() => {
    return () => {
      if (profilePhotoPreview) {
        URL.revokeObjectURL(profilePhotoPreview)
      }
    }
  }, [profilePhotoPreview])

  const selectBuilding = (building: BuildingSummary) => {
    setBuildingId(building.id)
    setBuildingName(building.name ?? '')
    setBuildingAddress(building.address ?? '')
    setBuildingInviteCode(building.invite_code ?? '')
    setCurrentBuilding(building)
    setBuildingConnectionMode('edit')
    persistSelectedBuildingId(building.id, userId)
  }

  const disconnectBuilding = async (building: BuildingSummary) => {
    if (!userId || disconnectingBuildingId) return

    setDisconnectingBuildingId(building.id)
    setMessage('')
    setMessageType('')

    try {
      await unlinkBuildingFromUser({
        buildingId: building.id,
        role: profileRole,
        userId,
      })

      const nextBuildings = buildings.filter((item) => item.id !== building.id)
      setBuildings(nextBuildings)

      if (buildingId === building.id) {
        const nextBuilding = nextBuildings[0] ?? null

        if (nextBuilding) {
          selectBuilding(nextBuilding)
        } else {
          setBuildingId(null)
          setBuildingName('')
          setBuildingAddress('')
          setBuildingInviteCode('')
          setCurrentBuilding(null)
          setBuildingConnectionMode('create')
          persistSelectedBuildingId(null, userId)
        }
      }

      setMessage('El edificio fue desvinculado de tu cuenta.')
      setMessageType('success')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo desvincular el edificio.'
      )
      setMessageType('error')
    } finally {
      setDisconnectingBuildingId(null)
    }
  }

  return {
    t,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    buildingName,
    setBuildingName,
    buildingAddress,
    setBuildingAddress,
    buildingInviteCode,
    buildings,
    selectedBuildingId: buildingId,
    joinInviteCode,
    setJoinInviteCode,
    buildingConnectionMode,
    setBuildingConnectionMode: handleBuildingConnectionModeChange,
    hasBuilding: Boolean(buildingId),
    avatarKey,
    setAvatarKey,
    profilePhotoUrl,
    profilePhotoPreview,
    displayProfilePhotoUrl:
      profilePhotoPreview ||
      (removeCurrentProfilePhoto ? null : profilePhotoUrl),
    locale,
    setLocale,
    message,
    messageType,
    loading,
    newEmail,
    setNewEmail,
    emailChangeMessage,
    emailChangeMessageType,
    changingEmail,
    disconnectingBuildingId,
    initialLoading,
    compactHeader,
    avatarPickerOpen,
    setAvatarPickerOpen,
    languageOpen,
    setLanguageOpen,
    userEmail,
    profileRole,
    hasExistingProfile,
    scrollRef,
    avatarPickerRef,
    languageRef,
    selectedAvatar,
    selectedLanguage,
    handleSubmit,
    handleSignOut,
    handleEmailChange,
    handleProfilePhotoSelected,
    clearProfilePhoto,
    selectBuilding,
    disconnectBuilding,
  }
}
