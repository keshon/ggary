import { createAnatomy } from '../../types'

export const toastAnatomy = createAnatomy('toast', [
  'region',
  'list',
  'toast',
  'icon',
  'body',
  'title',
  'text',
  'action',
  'close',
  'close-icon',
  'announcer',
  'announcement',
] as const)

export type ToastPart = (typeof toastAnatomy.parts)[number]
