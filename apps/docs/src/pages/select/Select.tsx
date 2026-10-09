import { Button, ConfigProvider, Dialog, Form, FormSummary, Popover, Select, Sheet, TimePicker } from '@ggary/react'
import { useState } from 'react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { stages } from '../../data/inputs-pickers'

const SIZES = ['sm', 'md', 'lg'] as const

function FormPilot() {
  const [result, setResult] = useState('No submission yet')
  return <Form validate={(data) => data.get('stage') ? {} : { stage: 'Choose a stage' }} onSubmit={async (data) => { setResult(`Submitted: ${data.get('stage')}`) }}>
    <div className="select-pilot-layout">
    <FormSummary />
    <Select label="Form stage" name="stage" items={stages} placeholder="Choose a stage" />
    <div className="select-pilot-actions">
    <Button type="submit">Submit stage</Button>
    <Button type="reset">Reset stage</Button>
    </div>
    <output>{result}</output>
    </div>
  </Form>
}

function ControlledPilot() {
  const [value, setValue] = useState<string | null>('talks')
  const [requested, setRequested] = useState<string | null>(null)
  const [calls, setCalls] = useState(0)
  return <div className="select-pilot-layout">
    <Select label="Controlled stage" items={stages} value={value} onValueChange={(next) => { setRequested(next); setCalls((count) => count + 1) }} />
    <output>Requested: {requested ?? 'none'}; callbacks: {calls}</output>
    <div className="select-pilot-actions"><Button disabled={calls === 0} onClick={() => setValue(requested)}>Accept requested value</Button></div>
  </div>
}

function DynamicPilot() {
  const [loaded, setLoaded] = useState(false)
  return <div className="select-pilot-layout">
    <Select label="Dynamic stage" items={loaded ? stages : []} />
    <div className="select-pilot-actions"><Button onClick={() => setLoaded((value) => !value)}>{loaded ? 'Clear options' : 'Load options'}</Button></div>
  </div>
}

export default function SelectPage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Select size={size} label={`Base UI stage ${size}`} items={stages} defaultValue="talks" />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="Base UI backend">
            <Select label="Stage" items={stages} defaultValue="talks" />
          </Specimen>
          <Specimen label="placeholder">
            <Select label="Stage" items={stages} placeholder="Choose a stage" />
          </Specimen>
          <Specimen label="defaultValue">
            <Select label="Stage" items={stages} defaultValue="offer" />
          </Specimen>
          <Specimen label="disabled">
            <Select label="Stage" items={stages} defaultValue="won" disabled />
          </Specimen>
        </>
      }
      composition={<>
        <Specimen label="Base UI · dark island + RTL" wide>
          <ConfigProvider mode="dark" dir="rtl"><Select label="Scoped stage" items={stages} defaultValue="talks" /></ConfigProvider>
        </Specimen>
        <Specimen label="Base UI · nested popover" wide>
          <Popover title="Select inside popover" trigger={(props) => <Button {...props}>Open select popover</Button>}>
            <Select label="Popover stage" items={stages} defaultValue="talks" />
          </Popover>
        </Specimen>
        <Specimen label="Base UI · modal dialog" wide>
          <Dialog title="Select inside dialog" trigger={(props) => <Button {...props}>Open select dialog</Button>}>
            <div className="select-pilot-layout">
              <Select label="Dialog stage" items={stages} defaultValue="talks" />
              <TimePicker label="Dialog time" locale="en-GB" defaultValue="14:30" />
            </div>
          </Dialog>
        </Specimen>
        <Specimen label="Base UI · modal sheet" wide>
          <Sheet title="Select inside sheet" trigger={(props) => <Button {...props}>Open select sheet</Button>}>
            <Select label="Sheet stage" items={stages} defaultValue="talks" />
          </Sheet>
        </Specimen>
        <Specimen label="Base UI · validation, submission, reset" wide><FormPilot /></Specimen>
        <Specimen label="Base UI · controlled owner can refuse" wide><ControlledPilot /></Specimen>
        <Specimen label="Base UI · dynamic empty list" wide><DynamicPilot /></Specimen>
      </>}
    />
  )
}
