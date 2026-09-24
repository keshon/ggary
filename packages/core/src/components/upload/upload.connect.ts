import type { Dict, Normalizer } from '../../types'
import { formatBytes } from '../../utils/bytes'
import { uploadAnatomy as anatomy } from './upload.anatomy'
import { isRefused } from './upload.machine'
import type { UploadEvent, UploadItem, UploadState, UploadWords } from './upload.types'

export type UploadView = 'rows' | 'tiles'

export interface UploadConnectOptions {
  /** `rows`, a line a file under the zone; `tiles`, pictures in a grid with the zone the last of them. Default `rows`. */
  view?: UploadView
  /** Submits each file there under this name, with what its upload answered. */
  name?: string
  locale?: string
  words?: UploadWords
}

/** A file as a row or a tile draws it: its words worked out. */
export interface UploadEntry {
  id: string
  name: string
  status: UploadItem['status']
  /** 0 to 100 while it goes and the upload has said how far; null otherwise. */
  percent: number | null
  /** The percent in the locale's figures: `64%`, `64 %`. Empty while it is not known. */
  percentText: string
  /** The line under the name: its size, "Waiting", or why it is not there. */
  meta: string
  failed: boolean
  canRetry: boolean
  /** An image: a tile shows its picture. */
  image: boolean
  url: string | null
  item: UploadItem
}

const IMAGE = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i

/**
 * The list is a list, and a file is an item in it, named by its file's name.
 * Progress is a real `progressbar` inside the item, named for the file, valued
 * in percent; while the upload has not said how far, it has no value, which a
 * screen reader says as busy. A file there, or failed, is said once in a
 * polite live region — not every percent, which would drown the page.
 */
export function connect<T = Dict>(
  state: UploadState,
  send: (event: UploadEvent) => void,
  normalize: Normalizer<T>,
  options: UploadConnectOptions = {}
) {
  const { view = 'rows', name, locale, words = {} } = options
  const size = (bytes: number | null) => (bytes === null ? '' : formatBytes(bytes, locale))
  const percentFormat = new Intl.NumberFormat(locale, { style: 'percent' })

  const reason = (item: UploadItem): string => {
    switch (item.error) {
      case 'too-large':
        return (words.tooLarge ?? ((limit) => `Too large — the limit is ${limit}`))(size(state.maxSize))
      case 'wrong-type':
        return words.wrongType ?? 'Not a type this takes'
      case 'too-many':
        return (words.tooMany ?? ((max) => `Too many — up to ${max} files`))(state.maxFiles ?? 0)
      case 'failed':
        return item.message || (words.failed ?? 'Upload failed')
      default:
        return ''
    }
  }

  const entries: UploadEntry[] = state.items.map((item) => {
    const percent = item.status === 'uploading' && item.progress !== null ? Math.round(item.progress * 100) : null
    const meta = item.status === 'error' ? reason(item) : item.status === 'waiting' ? (words.waiting ?? 'Waiting') : size(item.size)
    return {
      id: item.id,
      name: item.name,
      status: item.status,
      percent,
      percentText: percent === null ? '' : percentFormat.format(percent / 100),
      meta,
      failed: item.status === 'error',
      canRetry: item.status === 'error' && !isRefused(item),
      image: item.type.startsWith('image/') || (!item.type && IMAGE.test(item.name)) || (item.url !== null && IMAGE.test(item.url)),
      url: item.url,
      item,
    }
  })

  const busy = state.items.some((item) => item.status === 'uploading' || item.status === 'waiting')
  const said = state.said
  const saidText = !said
    ? ''
    : said.what === 'done'
      ? (words.saidDone ?? ((file) => `${file} uploaded`))(said.name)
      : (words.saidError ?? ((file, why) => `${file} failed: ${why}`))(said.name, reason(state.items.find((item) => item.id === said.id) ?? ({ error: 'failed', message: null } as UploadItem)))

  const action = (entry: UploadEntry, kind: 'retry' | 'cancel' | 'remove', label: string, event: UploadEvent) =>
    normalize({
      ...anatomy.attrs('action'),
      type: 'button',
      'data-action': kind,
      // Retry shows its word; its name adds the file's, so ten Retry buttons are not ten of the same.
      'aria-label': label,
      disabled: state.disabled || undefined,
      onClick: () => send(event),
    })

  return {
    view,
    entries,
    busy,
    /** The live region's words: the last file there, or failed. The region stays put; only its words change. */
    saidText,
    retryText: words.retry ?? 'Retry',
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: state.id,
      'data-view': view,
      'data-busy': busy ? '' : undefined,
      'data-disabled': state.disabled ? '' : undefined,
      'data-empty': state.items.length === 0 ? '' : undefined,
    }),
    listProps: normalize({
      ...anatomy.attrs('list'),
      role: 'list',
      'aria-label': words.list ?? 'Files',
      'aria-busy': busy ? 'true' : undefined,
      'data-view': view,
    }),
    getItemProps: (entry: UploadEntry) =>
      normalize({
        ...anatomy.attrs('item'),
        role: 'listitem',
        'data-status': entry.status,
        'data-refused': isRefused(entry.item) ? '' : undefined,
        'data-image': entry.image ? '' : undefined,
        'data-view': view,
        style: { '--gg-progress': entry.status === 'done' ? 1 : entry.percent !== null ? entry.percent / 100 : 0 },
      }),
    /** The fill behind a row, or the ring on a tile; only while the file goes. */
    getProgressProps: (entry: UploadEntry) =>
      normalize({
        ...anatomy.attrs('progress'),
        role: 'progressbar',
        'aria-label': (words.uploading ?? ((file) => `Uploading ${file}`))(entry.name),
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': entry.percent ?? undefined,
        'data-indeterminate': entry.percent === null ? '' : undefined,
        'data-view': view,
      }),
    getPreviewProps: (entry: UploadEntry) => normalize({ ...anatomy.attrs('preview'), alt: '', 'data-view': view }),
    getIconProps: (entry: UploadEntry) =>
      normalize({ ...anatomy.attrs('icon'), 'data-icon': entry.failed ? 'status-error' : 'file', 'data-status': entry.status, 'aria-hidden': 'true' }),
    /** The tick on a row that is there. */
    getMarkProps: (_entry: UploadEntry) => normalize({ ...anatomy.attrs('mark'), 'data-icon': 'status-ok', 'aria-hidden': 'true' }),
    getBodyProps: (_entry: UploadEntry) => normalize({ ...anatomy.attrs('body'), 'data-view': view }),
    getNameProps: (entry: UploadEntry) => normalize({ ...anatomy.attrs('name'), title: entry.name, 'data-view': view }),
    getMetaProps: (entry: UploadEntry) => normalize({ ...anatomy.attrs('meta'), 'data-status': entry.status, 'data-view': view }),
    /** The figure beside a row going, or inside a tile's ring. Hidden from a screen reader: the bar says it. */
    getPercentProps: (entry: UploadEntry) => normalize({ ...anatomy.attrs('percent'), 'aria-hidden': 'true', 'data-view': view, 'data-status': entry.status }),
    getActionsProps: (_entry: UploadEntry) => normalize({ ...anatomy.attrs('actions'), 'data-view': view }),
    getRetryProps: (entry: UploadEntry) => action(entry, 'retry', (words.retryFile ?? ((file) => `Retry ${file}`))(entry.name), { type: 'RETRY', id: entry.id }),
    /** Cancel while it waits or goes; remove once it is there or failed. The same place, the same ×. */
    getDismissProps: (entry: UploadEntry) =>
      entry.status === 'uploading' || entry.status === 'waiting'
        ? action(entry, 'cancel', (words.cancelFile ?? ((file) => `Cancel ${file}`))(entry.name), { type: 'CANCEL', id: entry.id })
        : action(entry, 'remove', (words.removeFile ?? ((file) => `Remove ${file}`))(entry.name), { type: 'REMOVE', id: entry.id }),
    getActionIconProps: (kind: 'retry' | 'dismiss') =>
      normalize({ ...anatomy.attrs('action-icon'), 'data-icon': kind === 'retry' ? 'refresh' : 'close', 'aria-hidden': 'true' }),
    hintProps: normalize({ ...anatomy.attrs('hint'), 'data-view': view }),
    statusProps: normalize({ ...anatomy.attrs('status'), role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }),
    /** One hidden input a file there, when there is a name: what its upload answered, or its name. */
    hiddenInputs: name
      ? state.items
          .filter((item) => item.status === 'done')
          .map((item) => ({ key: item.id, props: normalize({ type: 'hidden', name, value: item.value ?? item.name }) }))
      : [],
  }
}

export type UploadApi<T = Dict> = ReturnType<typeof connect<T>>
