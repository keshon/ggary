<script lang="ts">
  import type { Component } from 'svelte'
  import { Button, Nav, SegmentedControl } from '@ggary/svelte'
  import { FRAMEWORKS, LOGO, currentPage, goToFramework, navGroups, onRouteChange } from '../site'
  import { MODES, getMode, onModeChange, setMode, type Mode } from '../theme'

  /** Each page's Svelte demo, loaded when it is first read. */
  const demos = import.meta.glob<{ default: Component }>('../pages/*/*.svelte')
  const load = (id: string) => Object.entries(demos).find(([path]) => path.startsWith(`../pages/${id}/`))?.[1]

  const capital = (text: string) => text[0].toUpperCase() + text.slice(1)

  let page = $state(currentPage())
  let mode = $state<Mode>(getMode())
  $effect(() => onRouteChange((next) => (page = next)))
  $effect(() => onModeChange((next) => (mode = next)))
  const demo = $derived(load(page.id)?.())

  let side = $state<HTMLElement | null>(null)
  function closeOnLink(event: MouseEvent) {
    if ((event.target as Element).closest('a') && side?.matches(':popover-open')) side.hidePopover()
  }
</script>

<div class="site">
  <header class="bar">
    <Button class="nav-button" size="sm" emphasis="low" aria-label="Components" popovertarget="side">
      <span data-icon="menu" aria-hidden="true"></span>
    </Button>
    <a class="brand" href="#/">
      <span class="brand-mark">{@html LOGO}</span>
      GGary
    </a>
    <SegmentedControl label="Framework" size="sm" items={FRAMEWORKS} value="svelte" onValueChange={goToFramework} />
    <div class="bar-end">
      <SegmentedControl label="Colour mode" size="sm" items={MODES.map((value) => ({ value, label: capital(value) }))} value={mode} onValueChange={(value: string) => setMode(value as Mode)} />
    </div>
  </header>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <aside class="side" id="side" popover="" bind:this={side} onclick={closeOnLink}>
    <Nav label="Components" numbered groups={navGroups(page)} />
  </aside>
  <main class="main">
    {#key page.id}
      <article class="page">
        <h1 class="page-title">{page.title}</h1>
        {#await demo then loaded}
          {#if loaded}<loaded.default />{/if}
        {/await}
      </article>
    {/key}
  </main>
</div>
