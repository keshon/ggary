<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type DiffProps, type DiffWords } from '@ggary/core/diff'
  import { svelteNormalizer } from '@ggary/core'
  import FileChange from '../file-change/FileChange.svelte'

  type Props = DiffProps & {
    /** The diff's fixed text: the statistics, a folded stretch, the name of the body. */
    words?: DiffWords
    [key: string]: unknown
  }

  let { path, change, rows, before, after, context, locale: ownLocale, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'diff', ownWords))
  const api = $derived(connect({ path, change, rows, before, after, context, locale }, svelteNormalizer, { words }))
</script>

<div {...rest} {...api.rootProps}>
  <div {...api.headProps}>
    {#if change !== undefined}<FileChange {change} />{/if}
    <span {...api.pathProps}>{path}</span>
    <span {...api.statProps}>
      <span {...api.addedProps}>{api.addedText}</span>
      <span {...api.removedProps}>{api.removedText}</span>
    </span>
  </div>
  <div {...api.bodyProps}>
    {#each api.rows as row (row.key)}
      {#if row.fold !== undefined}
        <div {...api.foldProps}>{row.fold}</div>
      {:else}
        <div {...row.rowProps}>
          {#each row.numbers as number}<span {...api.numProps}>{number ?? ''}</span>{/each}
          <span {...api.codeProps}>{row.line?.text}</span>
        </div>
      {/if}
    {/each}
  </div>
</div>
