import { useEffect, useRef, type ReactNode } from 'react'
import { Avatar, Gantt } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { hold, lateStart, midRange, rolloutGroups, rolloutPlan, stageChange } from './data'

const SCALES = ['day', 'week', 'month'] as const

/** Runs `stage` on the chart inside once, as the page loads. Once only — StrictMode runs the effect twice. */
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

const plan = { groups: rolloutGroups, locale: 'en-GB', words: { label: 'CRM rollout' } }

export default function GanttPage() {
  return (
    <DemoPage
      variants={
        <>
          {SCALES.map((scale) => (
            <Specimen key={scale} label={`scale="${scale}"`} wide>
              <Gantt tasks={rolloutPlan} scale={scale} {...plan} />
            </Specimen>
          ))}
          <Specimen label="range" wide>
            <Gantt tasks={rolloutPlan} range={midRange} {...plan} />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="onTaskChange · locked" wide>
            <Gantt tasks={rolloutPlan} onTaskChange={hold} {...plan} />
          </Specimen>
          <Specimen label="saving" wide>
            <Stage stage={stageChange}>
              <Gantt tasks={rolloutPlan} onTaskChange={hold} {...plan} />
            </Stage>
          </Specimen>
          <Specimen label="conflict" wide>
            <Gantt tasks={lateStart} {...plan} />
          </Specimen>
          <Specimen label={`defaultCollapsed={["phase-prep", "phase-pilot"]}`} wide>
            <Gantt tasks={rolloutPlan} defaultCollapsed={['phase-prep', 'phase-pilot']} {...plan} />
          </Specimen>
          <Specimen label="tasks={[]}" wide>
            <Gantt tasks={[]} {...plan} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="Avatar + title" wide>
          <Gantt tasks={rolloutPlan} {...plan}>
            {(task) => (
              <>
                <Avatar name={task.owner} size="sm" decorative /> {task.title}
              </>
            )}
          </Gantt>
        </Specimen>
      }
    />
  )
}
