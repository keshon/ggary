import { useEffect, useRef } from 'react'
import { Card, ContextMenu } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { fileMenu, stageOpen } from './data'

/** The menu asked for once, as the page loads. Once only: StrictMode runs the effect twice. */
function useOpened() {
  const host = useRef<HTMLDivElement>(null)
  const staged = useRef(false)
  useEffect(() => {
    if (staged.current) return
    staged.current = true
    requestAnimationFrame(() => host.current && stageOpen(host.current))
  }, [])
  return host
}

export default function ContextMenuPage() {
  const opened = useOpened()
  return (
    <DemoPage
      states={
        <Specimen label="open">
          <div ref={opened}>
            <ContextMenu items={fileMenu} label="Actions for report.pdf" trigger={(props) => <Card {...props} tabIndex={0} interactive title="report.pdf" subtitle="PDF · 1.2 MB" />} />
          </div>
        </Specimen>
      }
    />
  )
}
