import { useCallback, useState, type ReactNode } from 'react'
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
} from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
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

/** A grid and what stands around it, sharing its controller. */
function WithGrid({ stage, children }: { stage?: (grid?: Grid) => void; children: (grid: Grid | undefined, ref: (grid: Grid) => void) => ReactNode }) {
  const [grid, setGrid] = useState<Grid>()
  const ref = useCallback(
    (next: Grid) => {
      setGrid(next)
      stage?.(next)
    },
    [stage]
  )
  return <>{children(grid, ref)}</>
}

const statusCell = (lead: Lead, column: ColumnDef<Lead>, text: string) => (column.id === 'status' ? <Badge tone={statusTone[lead.status]}>{text}</Badge> : text)

export default function DataGridPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="rows" wide>
            <DataGrid {...base} rows={leads} />
          </Specimen>
          <Specimen label="selectable" wide>
            <DataGrid {...base} rows={leads} selectable />
          </Specimen>
          <Specimen label="rowHeight={28}" wide>
            <DataGrid {...base} rows={leads} rowHeight={28} />
          </Specimen>
          <Specimen label="rowHeight={44}" wide>
            <DataGrid {...base} rows={leads} rowHeight={44} />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="loading" wide>
            <DataGrid {...base} source={silentSource} />
          </Specimen>
          <Specimen label="stale" wide>
            <DataGrid {...base} source={slowSource} controllerRef={stageStale} />
          </Specimen>
          <Specimen label="empty" wide>
            <DataGrid {...base} rows={leads} initialQuery={{ search: 'Zeppelin' }} />
          </Specimen>
          <Specimen label="error" wide>
            <DataGrid {...base} source={failingSource} />
          </Specimen>
          <Specimen label="sorted · filtered" wide>
            <WithGrid>
              {(grid, ref) => (
                <Stack gap="tight">
                  {grid && <GridFilters grid={grid} words={{ locale: LOCALE }} />}
                  <DataGrid {...base} rows={leads} initialQuery={wonQuery} controllerRef={ref} />
                </Stack>
              )}
            </WithGrid>
          </Specimen>
          <Specimen label="selected" wide>
            <DataGrid {...base} rows={leads} selectable controllerRef={stageSelected} />
          </Specimen>
          <Specimen label="all matching selected" wide>
            <DataGrid {...base} rows={leads} selectable controllerRef={stageAllMatching} />
          </Specimen>
          <Specimen label="editing · invalid" wide>
            <DataGrid {...base} rows={leads} controllerRef={stageInvalid} />
          </Specimen>
          <Specimen label="saving · save failed" wide>
            <DataGrid {...base} rows={leads} onCellEdit={stagedSave} controllerRef={stageSaves} />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="Search · GridColumns · GridFilters, views" wide>
            <WithGrid>
              {(grid, ref) => (
                <Stack gap="tight">
                  <Cluster gap="tight">
                    <Search label="Search the leads" placeholder="Company, contact or email" onValueChange={(search) => grid?.send({ type: 'SET_SEARCH', search })} />
                    {grid && <GridColumns grid={grid} />}
                  </Cluster>
                  {grid && <GridFilters grid={grid} views={leadViews} words={{ locale: LOCALE }} />}
                  <DataGrid {...base} rows={leads} controllerRef={ref} />
                </Stack>
              )}
            </WithGrid>
          </Specimen>
          <Specimen label="GridBulkBar" wide>
            <WithGrid stage={stageSelected}>
              {(grid, ref) => (
                <Stack gap="tight">
                  {grid && (
                    <GridBulkBar grid={grid} words={{ locale: LOCALE }}>
                      <Menu
                        items={managerItems}
                        onSelect={(manager) => void assignLeads(grid, manager)}
                        trigger={(props) => (
                          <Button {...props} size="sm" emphasis="medium">
                            Assign to…
                          </Button>
                        )}
                      />
                    </GridBulkBar>
                  )}
                  <DataGrid {...base} source={ownSource} selectable controllerRef={ref} />
                </Stack>
              )}
            </WithGrid>
          </Specimen>
          <Specimen label="GridRowMenu · GridDetail" wide>
            <WithGrid>
              {(grid, ref) => (
                <>
                  <DataGrid {...base} source={ownSource} selectable onCellEdit={saveLead} renderCell={statusCell} controllerRef={ref} />
                  {grid && <GridRowMenu grid={grid} items={leadMenu} onSelect={(value, target) => void runLeadMenu(grid, value, target)} />}
                  {grid && (
                    <GridDetail grid={grid} title={(lead) => lead.company} description={(lead) => `Lead ${lead.id}`} words={{ locale: LOCALE }}>
                      {(lead, index) => (
                        <Stack>
                          <Select label="Status" items={statusItems} value={lead.status} onValueChange={(status) => status && void grid.saveCell(index, 'status', status)} />
                          <KeyValueList items={leadFacts(lead)} />
                        </Stack>
                      )}
                    </GridDetail>
                  )}
                </>
              )}
            </WithGrid>
          </Specimen>
          <Specimen label="a cell of your own: Badge" wide>
            <DataGrid {...base} rows={leads} renderCell={statusCell} />
          </Specimen>
          <Specimen label="empty: EmptyState" wide>
            <DataGrid
              {...base}
              rows={[]}
              empty={
                <EmptyState title="No leads yet" description="Import them from a spreadsheet, or add the first one by hand.">
                  <Button emphasis="high">Import leads</Button>
                </EmptyState>
              }
            />
          </Specimen>
          <Specimen label={`dir="rtl"`} wide>
            <div dir="rtl">
              <DataGrid {...base} rows={leads} selectable />
            </div>
          </Specimen>
        </>
      }
    />
  )
}
