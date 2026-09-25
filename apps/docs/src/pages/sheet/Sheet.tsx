import { Button, Field, Input, Select, Sheet, Switch } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { roles } from '../../data/overlays'

/** Shown with the page, beside it rather than over it, so it can be seen without being opened. */
const shown = { defaultOpen: true, modal: false, closeOnOutside: false } as const

function Parameters() {
  return (
    <>
      <Select label="Model" items={roles} defaultValue="editor" />
      <Field label="Agents" hint="1 to 12">
        <Input type="number" defaultValue="7" />
      </Field>
      <Switch defaultChecked>Keep logs</Switch>
    </>
  )
}

const apply = <Button emphasis="high">Apply</Button>

export default function SheetPage() {
  return (
    <DemoPage
      variants={(['end', 'start'] as const).map((side) => (
        <Specimen key={side} label={`side="${side}"`} wide>
          <div className="frame">
            <Sheet {...shown} side={side} title="Run parameters" description="Applied to the next run." footer={apply}>
              <Parameters />
            </Sheet>
          </div>
        </Specimen>
      ))}
      sizes={(['sm', 'md', 'lg'] as const).map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <div className="frame">
            <Sheet {...shown} size={size} title="Run parameters" footer={apply}>
              <Parameters />
            </Sheet>
          </div>
        </Specimen>
      ))}
      composition={
        <Specimen label="trigger">
          <Sheet title="Run parameters" description="Applied to the next run." trigger={(props) => <Button {...props}>Parameters…</Button>} footer={apply}>
            <Parameters />
          </Sheet>
        </Specimen>
      }
    />
  )
}
