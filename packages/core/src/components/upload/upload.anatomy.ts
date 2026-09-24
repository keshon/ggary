import { createAnatomy } from '../../types'

/**
 * Files sent as they are chosen, each on its own line with how far it has
 * gone. The zone to drop them in is FileDrop, whole, with its own scope; this
 * is the list under it — or, as tiles, the pictures before it — and what is
 * said as files arrive and fail.
 *
 * A row is a list item whose background is its progress bar: the `progress`
 * part fills it from the start edge, and is the `progressbar` a screen reader
 * hears. A tile carries the same parts over a picture. The buttons are the
 * row's own — `data-action` says retry, cancel or remove — not the kit's
 * Buttons, whose props would take the part's scope.
 */
export const uploadAnatomy = createAnatomy('upload', [
  'root',
  'list',
  'item',
  'progress',
  'preview',
  'icon',
  'body',
  'name',
  'meta',
  'percent',
  'mark',
  'actions',
  'action',
  'action-icon',
  'hint',
  'status',
] as const)
export type UploadPart = (typeof uploadAnatomy.parts)[number]
