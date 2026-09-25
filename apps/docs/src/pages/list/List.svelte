<script lang="ts">
  import { Avatar, Badge, Button, Icon, List, ListItem } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { reviewers, reviewersLater, type Reviewer } from '../../data/reviewers'

  type How = 'link' | 'press' | 'plain'
  const VARIANTS = ['divided', 'bordered', 'cards'] as const
  const HOWS = ['link', 'press', 'plain'] as const
  let rows = $state<Reviewer[]>(reviewers)
</script>

{#snippet row(who: Reviewer, how: How)}
  {#snippet leading()}<Avatar name={who.name} size="sm" decorative />{/snippet}
  {#snippet meta()}<Badge tone={who.tone}>{who.word}</Badge><span>{who.when}</span>{/snippet}
  {#snippet actions()}<Button size="sm" emphasis="minimal" aria-label={`More for ${who.name}`}><Icon name="more" /></Button>{/snippet}
  <ListItem
    title={who.name}
    description={who.line}
    href={how === 'link' ? '#/list' : undefined}
    onSelect={how === 'press' ? () => {} : undefined}
    current={who.current ? (how === 'link' ? 'page' : true) : undefined}
    disabled={who.disabled}
    {leading}
    {meta}
    {actions}
  />
{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each VARIANTS as variant (variant)}
      <Specimen label={`variant="${variant}"`} wide>
        <List {variant} label="Reviewers" count="4 of 16">
          {#each reviewers as who (who.name)}{@render row(who, 'link')}{/each}
        </List>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="current · disabled · onLoadMore" wide>
      <List variant="bordered" label="Reviewers" count={`${rows.length} of 6`} hasMore={rows.length < 6} onLoadMore={async () => (rows = [...rows, ...(await reviewersLater())])} words={{ more: `Show ${6 - rows.length} more` }}>
        {#each rows as who (who.name)}{@render row(who, 'press')}{/each}
      </List>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    {#each HOWS as how (how)}
      <Specimen label={how === 'link' ? 'ListItem href' : how === 'press' ? 'ListItem onSelect' : 'ListItem, plain'} wide>
        <List ariaLabel="Reviewers">
          {#each reviewers.slice(0, 2) as who (who.name)}{@render row(who, how)}{/each}
        </List>
      </Specimen>
    {/each}
  {/snippet}
</DemoPage>
