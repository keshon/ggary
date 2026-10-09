import { Card, ContextMenu } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { fileMenu } from './data'

export default function ContextMenuPage() {
  return (
    <DemoPage states={
      <Specimen label="Right-click or Shift+F10">
        <ContextMenu items={fileMenu} label="Actions for report.pdf" trigger={(props) => <Card {...props} tabIndex={0} interactive title="report.pdf" subtitle="PDF · 1.2 MB" />} />
      </Specimen>
    } />
  )
}
