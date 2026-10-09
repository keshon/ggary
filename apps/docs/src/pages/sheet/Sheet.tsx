import { Button, Dialog, Field, Input, Select, Sheet, Switch } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { roles } from '../../data/overlays'

import { DialogSpecimen } from '../../react/DialogSpecimen'

function Parameters() {
  return (
    <div className="select-pilot-layout">
      <Select label="Model" items={roles} defaultValue="editor" />
      <Field label="Agents" hint="1 to 12">
        <Input type="number" defaultValue="7" />
      </Field>
      <Switch defaultChecked>Keep logs</Switch>
    </div>
  )
}

const apply = <Button emphasis="high">Apply</Button>

export default function SheetPage() {
  return (
    <DemoPage
      variants={(['end', 'start'] as const).map((side) => (
        <Specimen key={side} label={`side="${side}"`} wide>
          <div className="frame">
            <DialogSpecimen placement={side} title="Run parameters" description="Applied to the next run." footer={apply}>
              <Parameters />
            </DialogSpecimen>
          </div>
        </Specimen>
      ))}
      sizes={(['sm', 'md', 'lg'] as const).map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <div className="frame">
            <DialogSpecimen placement="end" size={size} title="Run parameters" footer={apply}>
              <Parameters />
            </DialogSpecimen>
          </div>
        </Specimen>
      ))}
      composition={
        <><Specimen label="Base UI · sheet" wide>
          <Dialog placement="end" title="Base UI sheet" description="Scroll and Select integration." trigger={(props) => <Button {...props}>Open Base UI sheet</Button>} footer={apply}>
            <div className="select-pilot-layout"><Parameters />{Array.from({ length: 12 }, (_, i) => <p key={i}>Scrollable content {i + 1}</p>)}</div>
          </Dialog>
        </Specimen><Specimen label="trigger">
          <Sheet title="Run parameters" description="Applied to the next run." trigger={(props) => <Button {...props}>Parameters…</Button>} footer={apply}>
            <Parameters />
          </Sheet>
        </Specimen></>
      }
    />
  )
}
