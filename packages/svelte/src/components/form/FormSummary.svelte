<script lang="ts">
  import { connectSummary, type FormSummaryWords } from '@ggary/core/form'
  import { svelteNormalizer } from '@ggary/core'
  import { getContext } from 'svelte'
  import { FORM_CONTEXT, useFormState, type FormMachine } from './context.svelte'

  type Props = {
    words?: FormSummaryWords
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  }

  /** The form's errors in one place, each a link to its field. Shown after a submit that found some. */
  let { words, headingLevel }: Props = $props()

  const machine = getContext<FormMachine | undefined>(FORM_CONTEXT)
  const form = useFormState()
  $effect(() => {
    if (!machine) return
    machine.send({ type: 'SUMMARY_MOUNT' })
    return () => machine.send({ type: 'SUMMARY_UNMOUNT' })
  })
  const api = $derived(form.current ? connectSummary(form.current, svelteNormalizer, { words, headingLevel }) : null)
</script>

{#if api}
  <div {...api.rootProps}>
    <div {...api.titleProps}>{api.title}</div>
    {#if api.message}<p {...api.messageProps}>{api.message}</p>{/if}
    {#if api.items.length > 0}
      <ul {...api.listProps}>
        {#each api.items as item (`${item.id}-${item.name}`)}
          <li {...api.itemProps}><a {...api.getLinkProps(item)}>{api.itemText(item)}</a></li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
