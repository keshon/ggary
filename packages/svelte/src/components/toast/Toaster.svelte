<script lang="ts">
  import { connect, keepRegionOpen, toaster as pageToaster, type Toaster, type ToastPlacement } from '@ggary/core/toast'
  import { svelteNormalizer } from '@ggary/core'
  import { untrack } from 'svelte'

  type Props = {
    /** The queue to show. Default: the page's, which `toast()` adds to. */
    toaster?: Toaster
    placement?: ToastPlacement
    /** The region's accessible name. Default "Notifications". */
    label?: string
    closeLabel?: string
  }

  /*
   * The region toasts appear in. Render one per page, anywhere: it lives in the
   * top layer. Show a toast from anywhere with `toast({ title })`.
   */
  let { toaster = pageToaster, placement, label, closeLabel }: Props = $props()

  // The effect below follows a new `toaster`; this is only the first paint.
  let snapshot = $state(untrack(() => toaster.getState()))
  $effect(() => {
    snapshot = toaster.getState()
    return toaster.subscribe((next) => (snapshot = next))
  })

  const api = $derived(connect(snapshot, toaster, svelteNormalizer, { placement, label, closeLabel }))

  // Opened once and kept open: a live region that is not displayed announces nothing.
  let region: HTMLElement
  $effect(() => keepRegionOpen(region))
</script>

<section bind:this={region} {...api.regionProps}>
  <div {...api.politeProps}>
    {#key snapshot.announcement.nonce}{#if api.politeText}<p {...api.announcementProps}>{api.politeText}</p>{/if}{/key}
  </div>
  <div {...api.assertiveProps}>
    {#key snapshot.announcement.nonce}{#if api.assertiveText}<p {...api.announcementProps}>{api.assertiveText}</p>{/if}{/key}
  </div>
  <ol {...api.listProps}>
    {#each api.toasts as toast (toast.id)}
      <li {...api.getToastProps(toast)}>
        {#if toast.tone}
          <span {...api.getIconProps(toast)}></span>
        {/if}
        <div {...api.bodyProps}>
          <p {...api.titleProps}>{toast.title}</p>
          {#if toast.text}
            <p {...api.textProps}>{toast.text}</p>
          {/if}
        </div>
        {#if toast.action}
          <button {...api.getActionProps(toast)}>{toast.action.label}</button>
        {/if}
        <button {...api.getCloseProps(toast)}><span {...api.closeIconProps}></span></button>
      </li>
    {/each}
  </ol>
</section>
