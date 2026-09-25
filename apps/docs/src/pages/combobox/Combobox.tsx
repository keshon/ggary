import { Combobox } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { companies, searchCompanies } from '../../data/inputs-pickers'
import { tags } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

export default function ComboboxPage() {
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
    />
  )
}
