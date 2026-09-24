<script lang="ts">
  import { COPY_IDLE, connect, createCopier, type CodeBlockProps, type CopyState } from '@ggary/core/code'
  import { svelteNormalizer } from '@ggary/core'

  type Props = CodeBlockProps & { [key: string]: unknown }

  let { code, numbered, start, label, copyValue, onCopy, words, ...rest }: Props = $props()

  let copy = $state<CopyState>(COPY_IDLE)
  const copier = createCopier((next) => (copy = next))
  // No timer answers into a component that has gone.
  $effect(() => () => copier.destroy())

  const api = $derived(
    connect({ code, numbered, start, label, copyValue, words, copy }, svelteNormalizer, { onCopyPress: (): void =>
      void copier.copy(api.copyText, { onCopy, words }) })
  )
</script>

<!-- One line inside the content: its whitespace is preserved, so the markup's own would show. -->
<div {...api.rootProps} {...rest}>
  <div {...api.contentProps}>{#if api.numbered}{#each api.lines as line (line.number)}<div {...api.lineProps(line)}><span {...api.lineNumberProps}>{line.number}</span><span {...api.lineSourceProps}>{line.source}</span></div>{/each}{:else}{code}{/if}</div>
  <button {...api.copyProps}><span {...api.copyIconProps}></span></button>
  <span {...api.liveProps}>{api.said}</span>
</div>
