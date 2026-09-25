import { Button, Dialog, Field, Input, Select } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { roles, terms } from '../../data/overlays'

/** Shown with the page, beside it rather than over it, so it can be seen without being opened. */
const shown = { defaultOpen: true, modal: false, closeOnOutside: false } as const

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
              <Dialog {...shown} title="Edit profile" description="Changes show on your public profile." footer={actions('Save')}>
                <Field label="Display name">
                  <Input defaultValue="Garry" />
                </Field>
                <Select label="Role" items={roles} defaultValue="editor" />
              </Dialog>
            </div>
          </Specimen>
          <Specimen label={`role="alertdialog" closeButton={false}`} wide>
            <div className="frame">
              <Dialog {...shown} role="alertdialog" size="sm" closeButton={false} title="Delete project?" description="This cannot be undone." footer={actions('Delete', true)}>
                <p>Everything in “Atlas” goes, including its run history and settings.</p>
              </Dialog>
            </div>
          </Specimen>
        </>
      }
      sizes={(['sm', 'md', 'lg'] as const).map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <div className="frame">
            <Dialog {...shown} size={size} title="Terms of service" footer={<Button emphasis="high">Accept</Button>}>
              {terms.map((clause) => (
                <p key={clause}>{clause}</p>
              ))}
            </Dialog>
          </div>
        </Specimen>
      ))}
      composition={
        <Specimen label="trigger">
          <Dialog title="Edit profile" description="Changes show on your public profile." trigger={(props) => <Button {...props}>Edit profile</Button>} footer={actions('Save')}>
            <Field label="Display name">
              <Input defaultValue="Garry" />
            </Field>
          </Dialog>
        </Specimen>
      }
    />
  )
}
