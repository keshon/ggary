import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import {
  connect,
  createUploadMachine,
  type UploadEntry,
  type UploadedFile,
  type UploadFunction,
  type UploadItem,
  type UploadView,
  type UploadWords,
} from '@ggary/core/upload'
import { reactNormalizer } from '@ggary/core'
import { FileDrop } from '../file-drop'
import { useFormReset } from '../../utils/use-form-reset'

export interface UploadProps {
  /** Sends one file: `(file, { signal, onProgress }) => Promise`. Resolve with what the form submits for it. Without one, a file is there once chosen. */
  upload?: UploadFunction
  /** `rows`, a line a file under the zone; `tiles`, pictures in a grid, the zone the last of them. Default `rows`. */
  view?: UploadView
  /** Submits each file there under this name, with what its upload answered. */
  name?: string
  /** Checked again on every file, dropped ones too. */
  accept?: string
  /** The most bytes a file may have. */
  maxSize?: number
  /** The most files the list may hold. With 1, a new file takes the old one's place. */
  maxFiles?: number
  /** How many go at once. Default 3. */
  concurrency?: number
  disabled?: boolean
  /** The zone's call to action. */
  label?: string
  /** The limits — said before the choice, not after it. */
  hint?: string
  /** The files already there. */
  defaultFiles?: UploadedFile[]
  /** The list changed: a file added, there, failed or taken off. Not called for progress. */
  onFilesChange?: (items: UploadItem[]) => void
  locale?: string
  words?: UploadWords
}

/** Where there are no object URLs (a server, jsdom), a tile shows its icon. */
const canPreview = () => typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'

/** A picture of each image chosen, while it is on the list. */
function usePreviews(items: UploadItem[]) {
  const urls = useRef(new Map<string, string>())
  const [, bump] = useState(0)
  useEffect(() => {
    const live = new Set(items.map((item) => item.id))
    let changed = false
    for (const item of items) {
      if (canPreview() && item.file && item.file.type.startsWith('image/') && !urls.current.has(item.id)) {
        urls.current.set(item.id, URL.createObjectURL(item.file))
        changed = true
      }
    }
    for (const [id, url] of urls.current) {
      if (!live.has(id)) {
        URL.revokeObjectURL(url)
        urls.current.delete(id)
        changed = true
      }
    }
    if (changed) bump((n) => n + 1)
  }, [items])
  useEffect(() => () => {
    for (const url of urls.current.values()) URL.revokeObjectURL(url)
    urls.current.clear()
  }, [])
  return (entry: UploadEntry) => urls.current.get(entry.id) ?? entry.url
}

/** Files sent as they are chosen, each with how far it has gone, a way to cancel, and a way to try again. */
export function Upload(props: UploadProps) {
  const { view = 'rows', name, accept, maxSize, maxFiles, concurrency, disabled, label, hint, defaultFiles, locale, words } = props
  const id = `gg-upload-${useId().replace(/:/g, '')}`
  const latest = useRef(props)
  latest.current = props
  const [machine] = useState(() =>
    createUploadMachine({
      id, accept, maxSize, maxFiles, concurrency, disabled, defaultFiles,
      // The latest function, whichever render it came from; none, and a file is there once chosen.
      upload: (file, context) => latest.current.upload?.(file, context),
      onFilesChange: (items) => latest.current.onFilesChange?.(items),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { view, name, locale, words })
  const preview = usePreviews(state.items)

  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', accept: accept ?? null, maxSize: maxSize ?? null, maxFiles: maxFiles ?? null, concurrency, disabled }),
    [machine, accept, maxSize, maxFiles, concurrency, disabled]
  )
  useEffect(() => {
    machine.resume()
    return () => machine.dispose()
  }, [machine])

  const input = useRef<HTMLInputElement>(null)
  useFormReset(input, () => machine.send({ type: 'RESET', files: latest.current.defaultFiles ?? [] }))

  const add = (files: File[]) => {
    machine.send({ type: 'ADD', files })
    // The input only carries the choice here: emptied, the same file can be chosen again.
    if (input.current) input.current.value = ''
  }

  const zone = (
    <FileDrop
      ref={input}
      accept={accept}
      multiple={maxFiles !== 1}
      label={label}
      hint={view === 'rows' ? hint : undefined}
      disabled={disabled}
      listFiles={false}
      keepRefused
      onFilesChange={add}
    />
  )

  return (
    <div {...api.rootProps}>
      {view === 'rows' && zone}
      <ul {...api.listProps}>
        {api.entries.map((entry) => {
          const src = view === 'tiles' && entry.image && !entry.failed ? preview(entry) : null
          return (
            <li key={entry.id} {...api.getItemProps(entry)}>
              {entry.status === 'uploading' && <span {...api.getProgressProps(entry)} />}
              {src ? <img {...api.getPreviewProps(entry)} src={src} /> : <span {...api.getIconProps(entry)} />}
              <span {...api.getBodyProps(entry)}>
                <span {...api.getNameProps(entry)}>{entry.name}</span>
                {entry.meta && <span {...api.getMetaProps(entry)}>{entry.meta}</span>}
              </span>
              {entry.percentText && <span {...api.getPercentProps(entry)}>{entry.percentText}</span>}
              {entry.status === 'done' && view === 'rows' && <span {...api.getMarkProps(entry)} />}
              <span {...api.getActionsProps(entry)}>
                {entry.canRetry && (
                  <button {...api.getRetryProps(entry)}>
                    <span {...api.getActionIconProps('retry')} />
                    {api.retryText}
                  </button>
                )}
                <button {...api.getDismissProps(entry)}>
                  <span {...api.getActionIconProps('dismiss')} />
                </button>
              </span>
            </li>
          )
        })}
      </ul>
      {view === 'tiles' && zone}
      {view === 'tiles' && hint && <p {...api.hintProps}>{hint}</p>}
      <span {...api.statusProps}>
        {api.saidText}
      </span>
      {api.hiddenInputs.map((hidden) => (
        <input key={hidden.key} {...hidden.props} />
      ))}
    </div>
  )
}
