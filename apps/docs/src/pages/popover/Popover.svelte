<script lang="ts">
  import { Button, CheckboxGroup, Field, Input, Popover, RadioGroup } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

{#snippet filters()}
  <CheckboxGroup
    label="Show"
    name="show"
    defaultValue={['open']}
    items={[
      { value: 'open', label: 'Only open issues' },
      { value: 'mine', label: 'Assigned to me' },
    ]}
  />
  <RadioGroup
    label="Sort"
    name="sort"
    defaultValue="newest"
    items={[
      { value: 'newest', label: 'Newest first' },
      { value: 'oldest', label: 'Oldest first' },
    ]}
  />
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label="title" wide>
      <div class="frame">
        <Popover defaultOpen closeOnOutside={false} title="Filters">
          {#snippet trigger(props)}<Button {...props}>Filters</Button>{/snippet}
          {@render filters()}
        </Popover>
      </div>
    </Specimen>
    <Specimen label={`title, closeButton, placement="bottom-end"`} wide>
      <div class="frame frame-end">
        <Popover defaultOpen closeOnOutside={false} title="Share" closeButton placement="bottom-end">
          {#snippet trigger(props)}<Button emphasis="low" {...props}>Share…</Button>{/snippet}
          <Field label="Link" hint="Anyone with the link can view"><Input readOnly defaultValue="https://example.com/p/atlas" /></Field>
        </Popover>
      </div>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="trigger">
      <Popover title="Filters">
        {#snippet trigger(props)}<Button {...props}>Filters</Button>{/snippet}
        {@render filters()}
      </Popover>
    </Specimen>
  {/snippet}
</DemoPage>
