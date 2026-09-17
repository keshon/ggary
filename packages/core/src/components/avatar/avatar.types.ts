export type AvatarSize = 'sm' | 'md' | 'lg'

/** `loading` and `error` show the initials; `loaded` shows the image over them. */
export type AvatarImageStatus = 'none' | 'loading' | 'loaded' | 'error'

export interface AvatarProps {
  /** Who it is. The initials come from it, and so does the accessible name. */
  name: string
  src?: string
  size?: AvatarSize
  /** The name is written beside it: hide the avatar from assistive tech, so the name is not read twice. */
  decorative?: boolean
}

export interface AvatarPerson {
  name: string
  src?: string
}

export interface AvatarGroupProps {
  /** The group's name, such as "7 participants". */
  label: string
  people: AvatarPerson[]
  /** Show at most this many; the rest become "+N". */
  max?: number
  size?: AvatarSize
}
