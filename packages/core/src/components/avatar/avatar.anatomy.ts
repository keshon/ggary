import { createAnatomy } from '../../types'

export const avatarAnatomy = createAnatomy('avatar', ['root', 'image', 'fallback', 'group', 'more'] as const)
export type AvatarPart = (typeof avatarAnatomy.parts)[number]
