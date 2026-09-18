<script lang="ts">
  import { Nav, Shell } from '../../../packages/svelte/src/index'
  import type { ShellProps } from '../harness'

  let { collapse, brand, links, header, footer, body, defaultOpen, onOpenChange }: ShellProps = $props()
  const column = links.length > 0
</script>

{#snippet brandSnippet()}<a href="/">{brand}</a>{/snippet}
{#snippet asideSnippet()}<Nav label="Sections" groups={[{ items: links }]} />{/snippet}
{#snippet headerSnippet()}<span>{header}</span>{/snippet}
{#snippet footerSnippet()}<span>{footer}</span>{/snippet}

<Shell
  {collapse}
  {defaultOpen}
  {onOpenChange}
  brand={column && brand ? brandSnippet : undefined}
  aside={column ? asideSnippet : undefined}
  header={header ? headerSnippet : undefined}
  footer={footer ? footerSnippet : undefined}
>
  <p>{body}</p>
</Shell>
