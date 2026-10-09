import { Button, CheckboxGroup, ConfigProvider, Dialog, Field, Input, Popover, RadioGroup, Select } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

function Filters() {
  return (
    <>
      <CheckboxGroup
        label="Show"
        name="show"
        defaultValue={['open']}
        items={[
          { value: 'open', label: 'Only open issues' },
          { value: 'mine', label: 'Assigned to me' },
        ]}
      />
      <RadioGroup
        label="Sort"
        name="sort"
        defaultValue="newest"
        items={[
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
        ]}
      />
    </>
  )
}

export default function PopoverPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="title" wide>
            <div data-scope="popover" data-part="content" style={{ position: 'relative', inset: 'auto' }}>
              <h2 data-scope="popover" data-part="title">Filters</h2>
              <Filters />
            </div>
          </Specimen>
          <Specimen label="title + closeButton" wide>
            <div data-scope="popover" data-part="content" style={{ position: 'relative', inset: 'auto' }}>
              <h2 data-scope="popover" data-part="title">Share</h2>
              <span data-scope="popover" data-part="close" aria-hidden="true">×</span>
              <Field label="Link" hint="Anyone with the link can view">
                <Input readOnly defaultValue="https://example.com/p/atlas" />
              </Field>
            </div>
          </Specimen>
        </>
      }
      composition={
        <>
        <Specimen label="Base UI · Select + nested Popover">
          <Popover title="Preferences" closeButton trigger={(props) => <Button {...props}>Open preferences</Button>}>
            <div className="select-pilot-layout">
              <Field label="Name"><Input defaultValue="Garry" /></Field>
              <Select label="Preference role" defaultValue="editor" items={[{ value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }]} />
              <Popover title="Nested preferences" trigger={(props) => <Button {...props}>Open nested popover</Button>}>
                <Input aria-label="Nested preference" defaultValue="Nested value" />
              </Popover>
            </div>
          </Popover>
        </Specimen>
        <Specimen label="Base UI · Dialog + local dark/RTL + Popover">
          <ConfigProvider mode="dark" dir="rtl">
            <Dialog title="Popover host" trigger={(props) => <Button {...props}>Open popover host</Button>}>
              <Popover title="Hosted preferences" trigger={(props) => <Button {...props}>Open hosted popover</Button>}>
                <div className="select-pilot-layout">
                  <Input aria-label="Hosted input" defaultValue="Hosted value" />
                  <Select label="Hosted role" defaultValue="editor" items={[{ value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }]} />
                </div>
              </Popover>
            </Dialog>
          </ConfigProvider>
        </Specimen>
        <Specimen label="trigger">
          <Popover title="Filters" trigger={(props) => <Button {...props}>Filters</Button>}>
            <Filters />
          </Popover>
        </Specimen>
        </>
      }
    />
  )
}
