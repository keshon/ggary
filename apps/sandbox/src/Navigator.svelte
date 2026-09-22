<script lang="ts">
  import { Button, Nav } from '@ggary/svelte'
  import { READING_ORDER, navGroups, readingLabel, revealInList, watchReading } from './page-chrome'

  /**
   * The navigator: the page's map — categories, components, their variants —
   * with the one being read marked, and its component opened. A column at the
   * page's left edge where there is room; elsewhere a popover opened from a
   * button at the corner that says where you are.
   */
  let reading = $state(0)
  let list = $state<HTMLElement | null>(null)
  $effect(() => watchReading(READING_ORDER.map((entry) => entry.anchor), (index) => (reading = index)))
  $effect(() => {
    void reading
    revealInList(list)
  })
  const current = $derived(READING_ORDER[reading])

  function close(event: MouseEvent) {
    const toc = event.currentTarget as HTMLElement
    if ((event.target as Element).closest('a') && toc.matches(':popover-open')) toc.hidePopover()
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<aside id="toc" class="toc" bind:this={list} popover="" onclick={close}>
  <Nav label="Components" groups={navGroups(current?.anchor ?? null)} />
</aside>
<div class="toc-button">
  <Button emphasis="high" popovertarget="toc">
    <span data-icon="list" aria-hidden="true"></span>
    <span class="visually-hidden">Components: </span>
    <span class="toc-current">{readingLabel(current)}</span>
  </Button>
</div>
