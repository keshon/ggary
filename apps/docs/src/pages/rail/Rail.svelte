<script lang="ts">
  import { Flex, FlexItem, List, ListItem, Panel, Rail } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { leads, railItems } from '../../data/layout'

  /** A rail is as tall as its column; on a page the column is a stage's. */
  const column = 'block-size: 320px'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="current · count · end">
      <div style={column}><Rail label="Workspaces" items={railItems} /></div>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="beside a Panel" wide>
      <Flex gap="none" style={column}>
        <Rail label="Workspaces" items={railItems} />
        <FlexItem grow>
          <Panel title="Leads" body="list" plain>
            <List ariaLabel="Leads">
              {#each leads.slice(0, 4) as lead (lead)}<ListItem title={lead} />{/each}
            </List>
          </Panel>
        </FlexItem>
      </Flex>
    </Specimen>
  {/snippet}
</DemoPage>
