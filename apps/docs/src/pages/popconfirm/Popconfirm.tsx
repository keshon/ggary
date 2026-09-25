import { useEffect, useRef, type ReactNode } from 'react'
import { Button, Popconfirm } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { never, pressConfirm, refused } from './data'

/** Its question answered "yes" as the page loads. Once: StrictMode runs the effect twice. */
function Answered({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  useEffect(() => {
    if (done.current || !host.current) return
    done.current = true
    pressConfirm(host.current)
  }, [])
  return (
    <div ref={host} className="frame">
      {children}
    </div>
  )
}

const lead = {
  title: 'Delete this lead?',
  description: 'Its history goes with it. This cannot be undone.',
  destructive: true,
  confirmLabel: 'Delete',
  trigger: (props: Record<string, unknown>) => (
    <Button {...props} destructive>
      Delete lead
    </Button>
  ),
}

export default function PopconfirmPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="title, confirmLabel" wide>
            <div className="frame">
              <Popconfirm defaultOpen title="Publish the page now?" confirmLabel="Publish" trigger={(props) => <Button {...props}>Publish</Button>} />
            </div>
          </Specimen>
          <Specimen label="destructive, description" wide>
            <div className="frame">
              <Popconfirm defaultOpen {...lead} />
            </div>
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="onConfirm: pending" wide>
            <Answered>
              <Popconfirm defaultOpen {...lead} onConfirm={never} />
            </Answered>
          </Specimen>
          <Specimen label="onConfirm: failed" wide>
            <Answered>
              <Popconfirm defaultOpen {...lead} onConfirm={refused} />
            </Answered>
          </Specimen>
        </>
      }
      composition={
        <Specimen label="trigger">
          <Popconfirm title="Publish the page now?" confirmLabel="Publish" trigger={(props) => <Button {...props}>Publish</Button>} />
        </Specimen>
      }
    />
  )
}
