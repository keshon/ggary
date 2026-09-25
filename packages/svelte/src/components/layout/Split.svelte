<script lang="ts">
  import { connect, createSplitMachine, type SplitOrientation, type SplitPrimary } from '@ggary/core/split'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    /** The separator's name, required: "Resize the lead list". */
    label: string
    /** The first pane, in reading order. */
    first: Snippet
    second: Snippet
    orientation?: SplitOrientation
    primary?: SplitPrimary
    min?: number
    max?: number
    step?: number
    collapsible?: boolean
    defaultSize?: number
    /** The primary pane's starting size in px — a stored one. */
    size?: number
    collapsed?: boolean
    /** The least the other pane keeps, in px. Default 200. */
    restMin?: number
    onSizeChange?: (size: number, details: { collapsed: boolean }) => void
    style?: string
  }

  let {
    label, first, second, orientation, primary, min, max, step, collapsible, defaultSize, size, collapsed, restMin,
    onSizeChange, style, ...rest
  }: Props & { [key: string]: unknown } = $props()

  const machine = untrack(() =>
    createSplitMachine({
      id: uid('gg-split'), size, collapsed, orientation, primary, min, max, step, collapsible, defaultSize,
      onSizeChange: (next, details) => onSizeChange?.(next, details),
    })
  )
  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', orientation, primary, min, max, step, collapsible, defaultSize }))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, restMin }))
</script>

<div {...rest} {...api.rootProps} style={[api.rootProps.style, style].filter(Boolean).join('; ')}>
  <div {...api.startPaneProps}>{@render first()}</div>
  <div {...api.separatorProps}><span {...api.handleProps}></span></div>
  <div {...api.endPaneProps}>{@render second()}</div>
</div>
