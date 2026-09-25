<script lang="ts">
  import type { ColumnDef, DataGridController } from '@ggary/core/data-grid'
  import {
    Badge,
    Button,
    Cluster,
    DataGrid,
    EmptyState,
    GridBulkBar,
    GridColumns,
    GridDetail,
    GridFilters,
    GridRowMenu,
    KeyValueList,
    Menu,
    Search,
    Select,
    Stack,
  } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import {
    assignLeads,
    failingSource,
    leadColumns,
    leadFacts,
    leadKey,
    leadMenu,
    leadViews,
    leads,
    managerItems,
    ownSource,
    runLeadMenu,
    saveLead,
    silentSource,
    slowSource,
    stageAllMatching,
    stageInvalid,
    stageSaves,
    stageSelected,
    stageStale,
    stagedSave,
    statusItems,
    statusTone,
    wonQuery,
    type Lead,
  } from './data'

  type Grid = DataGridController<Lead>
  const LOCALE = 'en-GB'
  const base = { columns: leadColumns, rowKey: leadKey, label: 'Leads', locale: LOCALE }
  const none: Lead[] = []

  let filtered = $state<Grid>()
  let tools = $state<Grid>()
  let bulk = $state<Grid>()
  let live = $state<Grid>()
</script>

{#snippet statusCell(lead: Lead, column: ColumnDef<Lead>, text: string)}
  {#if column.id === 'status'}<Badge tone={statusTone[lead.status]}>{text}</Badge>{:else}{text}{/if}
{/snippet}
{#snippet noLeads()}
  <EmptyState title="No leads yet" description="Import them from a spreadsheet, or add the first one by hand.">
    <Button emphasis="high">Import leads</Button>
  </EmptyState>
{/snippet}
{#snippet assignTrigger(props: Record<string, unknown>)}<Button {...props} size="sm" emphasis="medium">Assign to…</Button>{/snippet}
{#snippet detail(lead: Lead, index: number)}
  <Stack>
    <Select label="Status" items={statusItems} value={lead.status} onValueChange={(status) => status && void live?.saveCell(index, 'status', status)} />
    <KeyValueList items={leadFacts(lead)} />
  </Stack>
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label="rows" wide><DataGrid {...base} rows={leads} /></Specimen>
    <Specimen label="selectable" wide><DataGrid {...base} rows={leads} selectable /></Specimen>
    <Specimen label={"rowHeight={28}"} wide><DataGrid {...base} rows={leads} rowHeight={28} /></Specimen>
    <Specimen label={"rowHeight={44}"} wide><DataGrid {...base} rows={leads} rowHeight={44} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="loading" wide><DataGrid {...base} source={silentSource} /></Specimen>
    <Specimen label="stale" wide><DataGrid {...base} source={slowSource} bind:controller={() => undefined, stageStale} /></Specimen>
    <Specimen label="empty" wide><DataGrid {...base} rows={leads} initialQuery={{ search: 'Zeppelin' }} /></Specimen>
    <Specimen label="error" wide><DataGrid {...base} source={failingSource} /></Specimen>
    <Specimen label="sorted · filtered" wide>
      <Stack gap="tight">
        {#if filtered}<GridFilters grid={filtered} words={{ locale: LOCALE }} />{/if}
        <DataGrid {...base} rows={leads} initialQuery={wonQuery} bind:controller={filtered} />
      </Stack>
    </Specimen>
    <Specimen label="selected" wide><DataGrid {...base} rows={leads} selectable bind:controller={() => undefined, stageSelected} /></Specimen>
    <Specimen label="all matching selected" wide><DataGrid {...base} rows={leads} selectable bind:controller={() => undefined, stageAllMatching} /></Specimen>
    <Specimen label="editing · invalid" wide><DataGrid {...base} rows={leads} bind:controller={() => undefined, stageInvalid} /></Specimen>
    <Specimen label="saving · save failed" wide>
      <DataGrid {...base} rows={leads} onCellEdit={stagedSave} bind:controller={() => undefined, stageSaves} />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="Search · GridColumns · GridFilters, views" wide>
      <Stack gap="tight">
        <Cluster gap="tight">
          <Search label="Search the leads" placeholder="Company, contact or email" onValueChange={(search) => tools?.send({ type: 'SET_SEARCH', search })} />
          {#if tools}<GridColumns grid={tools} />{/if}
        </Cluster>
        {#if tools}<GridFilters grid={tools} views={leadViews} words={{ locale: LOCALE }} />{/if}
        <DataGrid {...base} rows={leads} bind:controller={tools} />
      </Stack>
    </Specimen>
    <Specimen label="GridBulkBar" wide>
      <Stack gap="tight">
        {#if bulk}
          {@const grid = bulk}
          <GridBulkBar {grid} words={{ locale: LOCALE }}>
            <Menu items={managerItems} onSelect={(manager) => void assignLeads(grid, manager)} trigger={assignTrigger} />
          </GridBulkBar>
        {/if}
        <DataGrid
          {...base}
          source={ownSource}
          selectable
          bind:controller={
            () => bulk,
            (grid) => {
              bulk = grid
              stageSelected(grid)
            }
          }
        />
      </Stack>
    </Specimen>
    <Specimen label="GridRowMenu · GridDetail" wide>
      <DataGrid {...base} source={ownSource} selectable onCellEdit={saveLead} cell={statusCell} bind:controller={live} />
      {#if live}
        {@const grid = live}
        <GridRowMenu {grid} items={leadMenu} onSelect={(value, target) => void runLeadMenu(grid, value, target)} />
        <GridDetail {grid} title={(lead) => lead.company} description={(lead) => `Lead ${lead.id}`} words={{ locale: LOCALE }} children={detail} />
      {/if}
    </Specimen>
    <Specimen label="a cell of your own: Badge" wide><DataGrid {...base} rows={leads} cell={statusCell} /></Specimen>
    <Specimen label="empty: EmptyState" wide><DataGrid {...base} rows={none} empty={noLeads} /></Specimen>
    <Specimen label={`dir="rtl"`} wide>
      <div dir="rtl"><DataGrid {...base} rows={leads} selectable /></div>
    </Specimen>
  {/snippet}
</DemoPage>
