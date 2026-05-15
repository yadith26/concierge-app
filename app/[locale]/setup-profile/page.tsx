'use client'

import { Building2, ChevronRight, LogOut } from 'lucide-react'
import BottomNav from '@/components/layout/BottomNav'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import PageHeader from '@/components/layout/PageHeader'
import { Link } from '@/i18n/navigation'
import SetupProfileAvatarCard from '@/components/setup-profile/SetupProfileAvatarCard'
import SetupProfileEmailCard from '@/components/setup-profile/SetupProfileEmailCard'
import SetupProfilePersonalInfoCard from '@/components/setup-profile/SetupProfilePersonalInfoCard'
import SetupProfileBuildingCard from '@/components/setup-profile/SetupProfileBuildingCard'
import { useSetupProfilePage } from '@/hooks/useSetupProfilePage'

export default function SetupProfilePage() {
  const {
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
    selectedBuildingId,
    joinInviteCode,
    setJoinInviteCode,
    buildingConnectionMode,
    setBuildingConnectionMode,
    hasBuilding,
    avatarKey,
    setAvatarKey,
    displayProfilePhotoUrl,
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
  } = useSetupProfilePage()

  if (initialLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#F6F8FC]">
        <p className="text-[#6E7F9D]">{t('setupProfile.loading')}</p>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-[#F6F8FC]">
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
        <PageHeader
          compact={compactHeader}
          title={
            hasExistingProfile
              ? t('setupProfile.header.editTitle')
              : t('setupProfile.header.createTitle')
          }
          showUserButton
          avatarEmoji={selectedAvatar.emoji}
          profilePhotoUrl={displayProfilePhotoUrl}
          expandedHeightClass="h-[150px]"
          compactHeightClass="h-[82px]"
          expandedTitleClass="pt-2 text-[32px] leading-none"
          compactTitleClass="pt-1 text-[22px] leading-none"
        >
          <p className="text-sm text-[18px] font-medium text-[#142952]">
            {t('setupProfile.header.subtitle')}
          </p>
        </PageHeader>

        <section
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-32 pt-3"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <SetupProfileAvatarCard
              t={t}
              firstName={firstName}
              lastName={lastName}
              userEmail={userEmail}
              buildingLabel={
                buildings
                  .map((building) => building.name?.trim())
                  .filter(Boolean)
                  .join(', ') || buildingName
              }
              buildingsCount={buildings.length}
              profileRole={profileRole}
              avatarKey={avatarKey}
              setAvatarKey={setAvatarKey}
              profilePhotoUrl={displayProfilePhotoUrl}
              avatarPickerOpen={avatarPickerOpen}
              setAvatarPickerOpen={setAvatarPickerOpen}
              avatarPickerRef={avatarPickerRef}
              selectedAvatar={selectedAvatar}
              onProfilePhotoSelected={handleProfilePhotoSelected}
              onClearProfilePhoto={clearProfilePhoto}
            />

            <SetupProfilePersonalInfoCard
              t={t}
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              locale={locale}
              setLocale={setLocale}
              languageOpen={languageOpen}
              setLanguageOpen={setLanguageOpen}
              languageRef={languageRef}
              selectedLanguage={selectedLanguage}
            />

            <SetupProfileEmailCard
              currentEmail={userEmail}
              emailChangeMessage={emailChangeMessage}
              emailChangeMessageType={emailChangeMessageType}
              newEmail={newEmail}
              onChangeNewEmail={setNewEmail}
              onSubmitEmailChange={handleEmailChange}
              saving={changingEmail}
              t={t}
            />

            {profileRole === 'manager' ? (
              <div className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2F66C8]">
                    <Building2 size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-[20px] font-bold text-[#142952]">
                      {t('setupProfile.managerBuildings.title')}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6E7F9D]">
                      {t('setupProfile.managerBuildings.description')}
                    </p>
                  </div>
                </div>

                <Link
                  href="/manager/buildings#manage-buildings"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-[22px] border border-[#DCE7F5] bg-[#EEF4FF] px-4 py-3 text-sm font-bold text-[#2F66C8]"
                >
                  {t('setupProfile.managerBuildings.cta')}
                  <ChevronRight size={18} />
                </Link>
              </div>
            ) : (
              <SetupProfileBuildingCard
                t={t}
                buildings={buildings}
                selectedBuildingId={selectedBuildingId}
                buildingName={buildingName}
                setBuildingName={setBuildingName}
                buildingAddress={buildingAddress}
                setBuildingAddress={setBuildingAddress}
                buildingInviteCode={buildingInviteCode}
                joinInviteCode={joinInviteCode}
                setJoinInviteCode={setJoinInviteCode}
                buildingConnectionMode={buildingConnectionMode}
                setBuildingConnectionMode={setBuildingConnectionMode}
                profileRole={profileRole}
                hasBuilding={hasBuilding}
                disconnectingBuildingId={disconnectingBuildingId}
                onSelectBuilding={selectBuilding}
                onDisconnectBuilding={(building) => {
                  void disconnectBuilding(building)
                }}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[22px] bg-[#2F66C8] py-4 font-semibold text-white shadow-[0_12px_24px_rgba(47,102,200,0.24)] transition hover:bg-[#2859B2] disabled:opacity-70"
            >
              {loading
                ? t('setupProfile.actions.saving')
                : t('setupProfile.actions.saveChanges')}
            </button>

            {message && (
              <div
                className={`rounded-2xl px-4 py-3 text-center text-sm font-medium ${
                  messageType === 'success'
                    ? 'border border-[#D8E9DB] bg-[#F3FBF5] text-[#1F7A3D]'
                    : 'border border-[#F1D3D3] bg-[#FFF5F5] text-[#C53030]'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                void handleSignOut()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-[#E3EAF3] bg-white py-4 font-semibold text-[#6E7F9D] shadow-[0_8px_20px_rgba(20,41,82,0.05)] transition hover:bg-[#FBFCFE]"
            >
              <LogOut size={18} />
              {t('setupProfile.actions.signOut')}
            </button>
          </form>
        </section>

        {profileRole === 'manager' && selectedBuildingId ? (
          <ManagerBottomNav buildingId={selectedBuildingId} active="home" />
        ) : null}

        {profileRole === 'concierge' ? (
          <BottomNav
            active="dashboard"
            buildingId={selectedBuildingId ?? undefined}
          />
        ) : null}
      </div>
    </main>
  )
}
