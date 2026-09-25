import { Link, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

export default function LinkPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="href">
            <Link href="#/link">Export</Link>
          </Specimen>
          <Specimen label="external">
            <Link href="https://github.com/keshon" external>
              GitHub
            </Link>
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="in a line" wide>
            <span>
              12 400 leads match — <Link href="#/link">export them</Link> or read{' '}
              <Link href="https://github.com/keshon" external>
                the import guide
              </Link>
              .
            </span>
          </Specimen>
          <Specimen label={`beside Text emphasis="low"`}>
            <span>
              <Text emphasis="low">12 400 leads</Text> · <Link href="#/link">Export</Link>
            </span>
          </Specimen>
        </>
      }
    />
  )
}
