<script lang="ts">
  import { connect, type FileDropProps } from '@ggary/core/file-drop'
  import { attachFileDrop, mergeProps, onFormReset, svelteNormalizer } from '@ggary/core'
  import { getContext } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = Omit<FileDropProps, 'files'> & {
    /** Bindable: the names shown under the call to action. Left alone, the component fills it. */
    files?: string[]
    onFilesChange?: (files: File[]) => void
    [key: string]: unknown
  }

  let {
    name, accept, multiple, label, hint, disabled, required, invalid,
    files = $bindable(), onFilesChange, ...rest
  }: Props = $props()

  let dragging = $state(false)
  let element: HTMLInputElement

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect({ name, accept, multiple, label, hint, disabled, required, invalid, files: files ?? [] }, svelteNormalizer, {
      dragging,
      field: field?.control,
      onFilesChange: (list) => {
        files = list.map((file) => file.name)
        onFilesChange?.(list)
      },
    })
  )

  $effect(() =>
    onFormReset(element, () => {
      files = []
    })
  )

  const attrs = $derived(mergeProps(rest, api.inputProps))
</script>

<label
  {...api.rootProps}
  {@attach (zone) => attachFileDrop(zone, () => element, { onDraggingChange: (next) => (dragging = next) })}
>
  <span {...api.iconProps}></span>
  <input bind:this={element} {...attrs} />
  <span {...api.textProps}>{api.label}</span>
  {#if api.showFiles}
    <span {...api.filesProps}>{api.filesText}</span>
  {/if}
  {#if api.showHint}
    <span {...api.hintProps}>{api.hint}</span>
  {/if}
</label>
