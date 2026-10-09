import { useState } from 'react'
import { Button, Combobox, ConfigProvider, Dialog, Popover } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { companies, searchCompanies } from '../../data/inputs-pickers'
import { tags } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

export default function ComboboxPage() {
  const [chosen, setChosen] = useState<string | null>('acme')
  const [requested, setRequested] = useState<string | null>(null)
  const [created, setCreated] = useState(tags)
  const [submitted, setSubmitted] = useState('No submission yet')
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="items">
            <Combobox label="Company" items={companies} defaultValue="acme" />
          </Specimen>
          <Specimen label="load, selectedItems">
            <Combobox label="Company" load={searchCompanies} defaultValue="cobalt" selectedItems={[companies[2]]} placeholder="Type to search" />
          </Specimen>
          <Specimen label="multiple" wide>
            <Combobox label="Tags" items={tags} multiple defaultValue={['enterprise', 'renewal', 'partner']} placeholder="Add a tag" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Combobox size={size} label="Company" items={companies} defaultValue="borealis" />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="placeholder">
            <Combobox label="Company" items={companies} placeholder="Anyone" />
          </Specimen>
          <Specimen label="disabled">
            <Combobox label="Company" items={companies} defaultValue="delta" disabled />
          </Specimen>
          <Specimen label="multiple disabled" wide>
            <Combobox label="Tags" items={tags} multiple defaultValue={['trial', 'startup']} disabled />
          </Specimen>
        </>
      }
      composition={<>
        <Specimen label="Base UI · controlled owner can refuse" wide>
          <div className="select-pilot-layout">
            <Combobox label="Controlled company" items={companies} value={chosen} onValueChange={next => setRequested(next[0] ?? null)} />
            <div className="select-pilot-actions"><Button onClick={() => setChosen(requested)}>Accept requested value</Button><output>Requested: {requested ?? 'none'}</output></div>
          </div>
        </Specimen>
        <Specimen label="Base UI · async creation + multiple" wide>
          <Combobox label="Create tags" items={created} multiple placeholder="Type a new tag"
            onCreate={async text => {
              if (text.toLowerCase() === 'error') throw new Error('Demo creation failure; try another name')
              const item = { value: `created:${text}`, label: text }
              setCreated(current => [...current, item])
              return item
            }} />
        </Specimen>
        <Specimen label="Base UI · native submission/reset" wide>
          <form className="select-pilot-layout" onSubmit={event => { event.preventDefault(); setSubmitted(new FormData(event.currentTarget).getAll('tags').join(', ') || 'Empty selection') }}>
            <Combobox label="Form tags" name="tags" items={tags} multiple defaultValue={['enterprise']} />
            <div className="select-pilot-actions"><Button type="submit">Submit tags</Button><Button type="reset">Reset tags</Button><output>{submitted}</output></div>
          </form>
        </Specimen>
        <Specimen label="Base UI · Dialog + local dark/RTL" wide>
          <ConfigProvider mode="dark" dir="rtl">
            <Dialog title="Combobox host" trigger={props => <Button {...props}>Open Combobox host</Button>}>
              <Combobox label="Hosted company" items={companies} placeholder="Type to filter" />
            </Dialog>
          </ConfigProvider>
        </Specimen>
        <Specimen label="Base UI · Popover + remote search" wide>
          <Popover title="Remote companies" trigger={props => <Button {...props}>Open remote search</Button>}>
            <Combobox label="Remote company" load={searchCompanies} placeholder="Type to search" />
          </Popover>
        </Specimen>
      </>}
    />
  )
}
