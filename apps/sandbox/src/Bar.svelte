<script lang="ts">
  import { SegmentedControl } from '@ggary/svelte'
  import { LOGO, PAGES, goToPage, watchBar } from './page-chrome'
  import { MODES, getMode, onModeChange, setMode, type Mode } from './theme'

  /** The bar at the top: the mark and the name, the framework, the colour mode. */
  const capital = (text: string) => text[0].toUpperCase() + text.slice(1)
  let mode = $state<Mode>(getMode())
  $effect(() => onModeChange((next) => (mode = next)))
  $effect(() => watchBar())
</script>

<a class="brand" href="#top" aria-label="GGary UI, to the top">
  <span class="brand-mark">{@html LOGO}</span>
  <span class="wordmark">GGary</span>
</a>
<SegmentedControl label="Framework" size="sm" items={PAGES} value="svelte" onValueChange={goToPage} />
<div class="theme-controls">
  <SegmentedControl
    label="Colour mode"
    size="sm"
    items={MODES.map((value) => ({ value, label: capital(value) }))}
    value={mode}
    onValueChange={(value) => setMode(value as Mode)}
  />
</div>
