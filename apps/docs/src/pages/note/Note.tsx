import { Link, Note } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { toned } from './data'

export default function NotePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no tone" wide>
            <Note>The bar only groups; the words carry the meaning.</Note>
          </Specimen>
          {toned.map(({ tone, text }) => (
            <Specimen key={tone} label={`tone="${tone}"`} wide>
              <Note tone={tone}>{text}</Note>
            </Specimen>
          ))}
        </>
      }
      composition={
        <Specimen label="children with a Link" wide>
          <Note tone="warn">
            runner-02 has not reported for 5 minutes. <Link href="#/note">Open the runner</Link>
          </Note>
        </Specimen>
      }
    />
  )
}
