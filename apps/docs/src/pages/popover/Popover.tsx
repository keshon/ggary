import { Button, CheckboxGroup, Field, Input, Popover, RadioGroup } from '@ggary/react'
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
            <div className="frame">
              <Popover defaultOpen closeOnOutside={false} title="Filters" trigger={(props) => <Button {...props}>Filters</Button>}>
                <Filters />
              </Popover>
            </div>
          </Specimen>
          <Specimen label={`title, closeButton, placement="bottom-end"`} wide>
            <div className="frame frame-end">
              <Popover defaultOpen closeOnOutside={false} title="Share" closeButton placement="bottom-end" trigger={(props) => <Button emphasis="low" {...props}>Share…</Button>}>
                <Field label="Link" hint="Anyone with the link can view">
                  <Input readOnly defaultValue="https://example.com/p/atlas" />
                </Field>
              </Popover>
            </div>
          </Specimen>
        </>
      }
      composition={
        <Specimen label="trigger">
          <Popover title="Filters" trigger={(props) => <Button {...props}>Filters</Button>}>
            <Filters />
          </Popover>
        </Specimen>
      }
    />
  )
}
