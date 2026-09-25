import { Link, Prose } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { article } from './data'

const SIZES = ['sm', 'md'] as const

export default function ProsePage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <Prose size={size} dangerouslySetInnerHTML={{ __html: article }} />
        </Specimen>
      ))}
      composition={
        <Specimen label="children" wide>
          <Prose>
            <h3>Release notes</h3>
            <p>
              The grid keeps its filters in the address now, so a filtered view can be shared — see <Link href="#/prose">the changelog</Link>.
            </p>
            <ul>
              <li>Saved views load in a third of the time.</li>
              <li>A failed export says which row it stopped at.</li>
            </ul>
          </Prose>
        </Specimen>
      }
    />
  )
}
