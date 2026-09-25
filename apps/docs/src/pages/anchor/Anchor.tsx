import { Anchor } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { guide, thisPage } from './data'

export default function AnchorPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="items, offset">
            <Anchor label="On this page" items={thisPage} offset={56} />
          </Specimen>
          <Specimen label="float">
            <div className="frame">
              <Anchor label="On this page" items={guide} current="#usage" float />
            </div>
          </Specimen>
          <Specimen label="float defaultOpen">
            <div className="frame">
              <Anchor label="On this page" items={guide} current="#usage" float defaultOpen />
            </div>
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label={`current="#usage"`}>
            <Anchor label="On this page" items={guide} current="#usage" />
          </Specimen>
          <Specimen label={`current="#events"`}>
            <Anchor label="On this page" items={guide} current="#events" />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="float={1024}">
          <Anchor label="On this page" items={guide} current="#install" float={1024} />
        </Specimen>
      }
    />
  )
}
