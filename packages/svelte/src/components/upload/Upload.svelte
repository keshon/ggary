<script lang="ts">
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
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { SvelteMap } from 'svelte/reactivity'
  import { untrack } from 'svelte'
  import FileDrop from '../file-drop/FileDrop.svelte'

  type Props = {
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

  /** Files sent as they are chosen, each with how far it has gone, a way to cancel, and a way to try again. */
  let { upload, view = 'rows', name, accept, maxSize, maxFiles, concurrency, disabled, label, hint, defaultFiles, onFilesChange, locale, words }: Props = $props()

  const machine = untrack(() =>
    createUploadMachine({
      id: uid('gg-upload'),
      accept, maxSize, maxFiles, concurrency, disabled, defaultFiles,
      // The latest function, whichever it is now; none, and a file is there once chosen.
      upload: (file, context) => upload?.(file, context),
      onFilesChange: (items) => onFilesChange?.(items),
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  $effect(() => {
    machine.resume()
    return () => machine.dispose()
  })
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { view, name, locale, words }))

  $effect(() => machine.send({ type: 'SYNC_OPTIONS', accept: accept ?? null, maxSize: maxSize ?? null, maxFiles: maxFiles ?? null, concurrency, disabled }))

  // A picture of each image chosen, while it is on the list; where there are no object URLs (jsdom), a tile shows its icon.
  const canPreview = () => typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
  const previews = new SvelteMap<string, string>()
  $effect(() => {
    const items = snapshot.items
    untrack(() => {
      const live = new Set(items.map((item) => item.id))
      for (const item of items) {
        if (canPreview() && item.file && item.file.type.startsWith('image/') && !previews.has(item.id)) previews.set(item.id, URL.createObjectURL(item.file))
      }
      for (const [id, url] of previews) {
        if (!live.has(id)) {
          URL.revokeObjectURL(url)
          previews.delete(id)
        }
      }
    })
  })
  $effect(() => () => {
    for (const url of previews.values()) URL.revokeObjectURL(url)
  })
  const preview = (entry: UploadEntry) => previews.get(entry.id) ?? entry.url

  let root = $state<HTMLDivElement | null>(null)
  const input = () => root?.querySelector<HTMLInputElement>("[data-scope='file-drop'][data-part='input']") ?? null

  $effect(() => onFormReset(input(), () => machine.send({ type: 'RESET', files: defaultFiles ?? [] })))

  function add(files: File[]) {
    machine.send({ type: 'ADD', files })
    // The input only carries the choice here: emptied, the same file can be chosen again.
    const element = input()
    if (element) element.value = ''
  }
</script>

{#snippet zone()}
  <FileDrop {accept} multiple={maxFiles !== 1} {label} hint={view === 'rows' ? hint : undefined} {disabled} listFiles={false} keepRefused onFilesChange={add} />
{/snippet}

<div bind:this={root} {...api.rootProps}>
  {#if view === 'rows'}{@render zone()}{/if}
  <ul {...api.listProps}>
    {#each api.entries as entry (entry.id)}
      {@const src = view === 'tiles' && entry.image && !entry.failed ? preview(entry) : null}
      <li {...api.getItemProps(entry)}>
        {#if entry.status === 'uploading'}<span {...api.getProgressProps(entry)}></span>{/if}
        {#if src}<img {...api.getPreviewProps(entry)} {src} />{:else}<span {...api.getIconProps(entry)}></span>{/if}
        <span {...api.getBodyProps(entry)}>
          <span {...api.getNameProps(entry)}>{entry.name}</span>
          {#if entry.meta}<span {...api.getMetaProps(entry)}>{entry.meta}</span>{/if}
        </span>
        {#if entry.percentText}<span {...api.getPercentProps(entry)}>{entry.percentText}</span>{/if}
        {#if entry.status === 'done' && view === 'rows'}<span {...api.getMarkProps(entry)}></span>{/if}
        <span {...api.getActionsProps(entry)}>
          {#if entry.canRetry}
            <button {...api.getRetryProps(entry)}><span {...api.getActionIconProps('retry')}></span>{api.retryText}</button>
          {/if}
          <button {...api.getDismissProps(entry)}><span {...api.getActionIconProps('dismiss')}></span></button>
        </span>
      </li>
    {/each}
  </ul>
  {#if view === 'tiles'}{@render zone()}{/if}
  {#if view === 'tiles' && hint}<p {...api.hintProps}>{hint}</p>{/if}
  <span {...api.statusProps}>{api.saidText}</span>
  {#each api.hiddenInputs as hidden (hidden.key)}<input {...hidden.props} />{/each}
</div>
