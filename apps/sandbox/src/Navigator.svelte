<script lang="ts">
  import { Button, Nav } from '@ggary/svelte'
  import { revealInList, watchReading, watchSections, type PageSection } from './page-chrome'

  /**
   * The navigator: every section, the one being read marked. A column at the
   * page's left edge where there is room; elsewhere a popover opened from a
   * button at the corner that says where you are.
   */
  let { app }: { app: HTMLElement } = $props()
  let sections = $state.raw<PageSection[]>([])
  let reading = $state(0)
  let list = $state<HTMLElement | null>(null)
  $effect(() => watchSections(app, (next) => (sections = next)))
  $effect(() => watchReading(sections.map((section) => section.id), (index) => (reading = index)))
  $effect(() => revealInList(list, reading))
  const number = (index: number) => String(index + 1).padStart(2, '0')

  function close(event: MouseEvent) {
    const toc = event.currentTarget as HTMLElement
    if ((event.target as Element).closest('a') && toc.matches(':popover-open')) toc.hidePopover()
  }
</script>

{#if sections.length > 0}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <aside id="toc" class="toc" bind:this={list} popover="" onclick={close}>
    <p class="toc-title">On this page</p>
    <Nav label="Sections" groups={[{ items: sections.map((section, index) => ({ label: section.title, href: `#${section.id}`, current: index === reading })) }]} />
  </aside>
  <div class="toc-button">
    <Button emphasis="high" popovertarget="toc">
      <span data-icon="list" aria-hidden="true"></span>
      <span class="visually-hidden">Sections: </span>
      <span class="toc-current">{number(reading)} · {sections[reading]?.title}</span>
    </Button>
  </div>
{/if}
