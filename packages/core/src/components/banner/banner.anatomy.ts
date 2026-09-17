import { createAnatomy } from '../../types'

export const bannerAnatomy = createAnatomy('banner', ['root', 'icon', 'body', 'title', 'text', 'actions', 'close', 'close-icon'] as const)
export type BannerPart = (typeof bannerAnatomy.parts)[number]
