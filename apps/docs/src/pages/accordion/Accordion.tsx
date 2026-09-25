import { Accordion, KeyValueList } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { contactFacts, leadSections, leadSectionText, withArchive } from './data'

const text = (item: { value: string }) => leadSectionText[item.value]

export default function AccordionPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`defaultValue={["contact"]}`} wide>
            <Accordion items={leadSections} defaultValue={['contact']}>
              {text}
            </Accordion>
          </Specimen>
          <Specimen label="multiple" wide>
            <Accordion items={leadSections} multiple defaultValue={['contact', 'deal']}>
              {text}
            </Accordion>
          </Specimen>
          <Specimen label="collapsible={false}" wide>
            <Accordion items={leadSections} collapsible={false} defaultValue={['deal']}>
              {text}
            </Accordion>
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="items[].disabled" wide>
            <Accordion items={withArchive} defaultValue={['contact']}>
              {text}
            </Accordion>
          </Specimen>
          <Specimen label="disabled" wide>
            <Accordion items={leadSections} disabled defaultValue={['contact']}>
              {text}
            </Accordion>
          </Specimen>
        </>
      }
      composition={
        <Specimen label="KeyValueList in a section" wide>
          <Accordion items={leadSections} defaultValue={['contact']}>
            {(item) => (item.value === 'contact' ? <KeyValueList items={contactFacts} /> : text(item))}
          </Accordion>
        </Specimen>
      }
    />
  )
}
