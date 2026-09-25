import { useState } from 'react'
import { ChipGroup } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { priorities, tags, tagsWithLegacy } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

function Removable() {
  const [items, setItems] = useState(tags)
  return <ChipGroup items={items} label="Tags" removable defaultValue={['design']} onRemove={(value) => setItems(items.filter((item) => item.value !== value))} />
}

export default function ChipGroupPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`mode="multi"`}>
            <ChipGroup items={tags} label="Tags" mode="multi" defaultValue={['design', 'code']} />
          </Specimen>
          <Specimen label={`mode="single"`}>
            <ChipGroup items={priorities} label="Priority" mode="single" defaultValue={['normal']} />
          </Specimen>
          <Specimen label={`orientation="vertical"`}>
            <ChipGroup items={priorities} label="Priority" mode="single" orientation="vertical" defaultValue={['normal']} />
          </Specimen>
          <Specimen label={`emphasis="medium"`}>
            <ChipGroup items={tags} label="Tags" emphasis="medium" defaultValue={['design']} />
          </Specimen>
          <Specimen label={`emphasis="high"`}>
            <ChipGroup items={tags} label="Tags" emphasis="high" defaultValue={['design']} />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <ChipGroup items={tags} label="Tags" size={size} defaultValue={['design']} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="disabled">
            <ChipGroup items={tags} label="Tags" disabled defaultValue={['design']} />
          </Specimen>
          <Specimen label="item disabled">
            <ChipGroup items={tagsWithLegacy} label="Tags" defaultValue={['design']} />
          </Specimen>
          <Specimen label="removable">
            <Removable />
          </Specimen>
          <Specimen label="items={[]}">
            <ChipGroup items={[]} label="Tags" words={{ empty: 'No tags yet' }} />
          </Specimen>
        </>
      }
    />
  )
}
