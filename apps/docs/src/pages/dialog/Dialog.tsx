import { Button, ConfigProvider, Dialog, Field, Input, Popover, Select } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { roles, terms } from '../../data/overlays'
import { useState } from 'react'

function BackendPilot() {
  const [events, setEvents] = useState('No interaction yet')
  return <div className="select-pilot-layout">
    <Dialog title="Base UI dialog" description="GGary visuals, Base UI focus and dismissal."
      trigger={(props) => <Button {...props}>Open Base UI dialog</Button>}
      footer={<form method="dialog"><Button type="submit" value="save">Save and close</Button></form>}
      onOpenChange={(next, details) => setEvents(`${next ? 'Opened' : 'Closed'}: ${details.reason}${details.returnValue ? ` (${details.returnValue})` : ''}`)}>
      <div className="select-pilot-layout">
        <Field label="Pilot name"><Input defaultValue="Garry" /></Field>
        <Select label="Pilot role" items={roles} defaultValue="editor" />
        <Dialog title="Nested Base UI dialog" trigger={(props) => <Button {...props}>Open nested dialog</Button>}>
          <Input aria-label="Nested input" placeholder="Focus stays here" />
        </Dialog>
      </div>
    </Dialog>
    <output>{events}</output>
  </div>
}

import { DialogSpecimen } from '../../react/DialogSpecimen'

const actions = (save: string, destructive = false) => (
  <>
    <Button emphasis="minimal">Cancel</Button>
    <Button emphasis="high" destructive={destructive}>
      {save}
    </Button>
  </>
)

export default function DialogPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="title, description, footer" wide>
            <div className="frame">
              <DialogSpecimen title="Edit profile" description="Changes show on your public profile." footer={actions('Save')}>
                <Field label="Display name">
                  <Input defaultValue="Garry" />
                </Field>
                <Select label="Role" items={roles} defaultValue="editor" />
              </DialogSpecimen>
            </div>
          </Specimen>
          <Specimen label={`role="alertdialog" closeButton={false}`} wide>
            <div className="frame">
              <DialogSpecimen role="alertdialog" size="sm" closeButton={false} title="Delete project?" description="This cannot be undone." footer={actions('Delete', true)}>
                <p>Everything in “Atlas” goes, including its run history and settings.</p>
              </DialogSpecimen>
            </div>
          </Specimen>
        </>
      }
      sizes={(['sm', 'md', 'lg'] as const).map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <div className="frame">
            <DialogSpecimen size={size} title="Terms of service" footer={<Button emphasis="high">Accept</Button>}>
              {terms.map((clause) => (
                <p key={clause}>{clause}</p>
              ))}
            </DialogSpecimen>
          </div>
        </Specimen>
      ))}
      composition={
        <><Specimen label="Base UI · dialog + Select + nested dialog" wide><BackendPilot /></Specimen>
        <Specimen label="Base UI · local dark + RTL + Popover" wide>
          <ConfigProvider mode="dark" dir="rtl">
            <Dialog title="Scoped dialog" trigger={(props) => <Button {...props}>Open scoped dialog</Button>}>
              <div className="select-pilot-layout">
                <Select label="Scoped dialog role" items={roles} defaultValue="editor" />
                <Popover title="Popover overlay" trigger={(props) => <Button {...props}>Open scoped popover</Button>}>
                  <Input aria-label="Legacy popover input" placeholder="Still compatible" />
                </Popover>
              </div>
            </Dialog>
          </ConfigProvider>
        </Specimen>
        <Specimen label="trigger">
          <Dialog title="Edit profile" description="Changes show on your public profile." trigger={(props) => <Button {...props}>Edit profile</Button>} footer={actions('Save')}>
            <Field label="Display name">
              <Input defaultValue="Garry" />
            </Field>
          </Dialog>
        </Specimen></>
      }
    />
  )
}
