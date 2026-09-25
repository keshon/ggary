import { useEffect, useRef, type ReactNode } from 'react'
import { Avatar, Badge, Cluster, ClusterSpacer, Flex, Kanban, Progress, Stack, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { crowded, dealStages, deals, formatAmount, hold, manyDeals, stageAdding, stageLifted, stagePendingMove, type Deal } from './data'

/** Runs `stage` on the board inside once, as the page loads. Once only — StrictMode runs the effect twice. */
function Stage({ stage, children }: { stage: (host: HTMLElement) => void; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null)
  const staged = useRef(false)
  useEffect(() => {
    if (staged.current) return
    staged.current = true
    requestAnimationFrame(() => host.current && stage(host.current))
  }, [stage])
  return <div ref={host}>{children}</div>
}

function DealBody({ deal }: { deal: Deal }) {
  return (
    <Stack gap="tight">
      <Text emphasis="low">{deal.company}</Text>
      {deal.labels && (
        <Cluster gap="tight">
          {deal.labels.map((label) => (
            <Badge key={label} emphasis="low">
              {label}
            </Badge>
          ))}
        </Cluster>
      )}
      {deal.checklist && (
        <Progress
          size="sm"
          value={deal.checklist.done}
          max={deal.checklist.total}
          label={`Checklist, ${deal.checklist.done} of ${deal.checklist.total}`}
          valueText={`${deal.checklist.done} of ${deal.checklist.total}`}
          hideLabel
          tone={deal.checklist.done === deal.checklist.total ? 'ok' : 'running'}
        />
      )}
      <Cluster gap="tight">
        <Text strong>{formatAmount(deal.amount)}</Text>
        {deal.due && <Badge tone={deal.due.tone}>{deal.due.text}</Badge>}
        <ClusterSpacer />
        {deal.owner && <Avatar name={deal.owner} size="sm" />}
      </Cluster>
    </Stack>
  )
}

const body = (deal: Deal) => <DealBody deal={deal} />

export default function KanbanPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="titles only" wide>
            <Kanban columns={dealStages} cards={deals} words={{ label: 'Deals' }} />
          </Specimen>
          <Specimen label="card body" wide>
            <Kanban columns={dealStages} cards={deals} words={{ label: 'Deals' }}>
              {body}
            </Kanban>
          </Specimen>
          <Specimen label="onAdd" wide>
            <Kanban columns={dealStages} cards={deals} onAdd={hold} words={{ label: 'Deals' }} />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="limit · over the limit · empty" wide>
            <Kanban columns={dealStages} cards={crowded} words={{ label: 'Deals' }} />
          </Specimen>
          <Specimen label="lifted" wide>
            <Stage stage={stageLifted}>
              <Kanban columns={dealStages} cards={deals} onMove={hold} words={{ label: 'Deals' }} />
            </Stage>
          </Specimen>
          <Specimen label="moving" wide>
            <Stage stage={stagePendingMove}>
              <Kanban columns={dealStages} cards={deals} onMove={hold} words={{ label: 'Deals' }} />
            </Stage>
          </Specimen>
          <Specimen label="adding · added, saving" wide>
            <Stage stage={stageAdding}>
              <Kanban columns={dealStages} cards={deals} onAdd={hold} words={{ label: 'Deals' }} />
            </Stage>
          </Specimen>
        </>
      }
      composition={
        <Specimen label="in a set height, each column scrolls" wide>
          <Flex direction="column" style={{ blockSize: '26rem' }}>
            <Kanban columns={dealStages} cards={manyDeals} onAdd={hold} words={{ label: 'Deals' }}>
              {body}
            </Kanban>
          </Flex>
        </Specimen>
      }
    />
  )
}
