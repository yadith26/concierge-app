export const avatarOptions = [
  { key: 'avatar-1', emoji: '\u{1F471}' },
  { key: 'avatar-2', emoji: '\u{1F9D1}' },
  { key: 'avatar-3', emoji: '\u{1F468}\u200D\u{1F4BC}' },
  { key: 'avatar-4', emoji: '\u{1F469}\u200D\u{1F4BC}' },
  { key: 'avatar-5', emoji: '\u{1F9D5}' },
  { key: 'avatar-6', emoji: '\u{1F477}' },
  { key: 'avatar-7', emoji: '\u{1F9D1}\u200D\u{1F527}' },
  { key: 'avatar-8', emoji: '\u2728' },
] as const

export type AvatarKey = (typeof avatarOptions)[number]['key']

export function getAvatarEmoji(avatarKey?: string | null) {
  return avatarOptions.find((avatar) => avatar.key === avatarKey)?.emoji ?? null
}
