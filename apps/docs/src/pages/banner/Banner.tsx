import { Banner, Button } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { toned } from './data'

export default function BannerPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no tone" wide>
            <Banner title="Maintenance on Sunday">The board is read-only from 02:00 to 03:00 UTC.</Banner>
          </Specimen>
          {toned.map(({ tone, title, text }) => (
            <Specimen key={tone} label={`tone="${tone}"`} wide>
              <Banner tone={tone} title={title}>
                {text}
              </Banner>
            </Specimen>
          ))}
        </>
      }
      states={
        <Specimen label="dismissible" wide>
          <Banner tone="warn" title="Disk almost full" dismissible>
            Old snapshots will be pruned tonight.
          </Banner>
        </Specimen>
      }
      composition={
        <>
          <Specimen label="title only" wide>
            <Banner tone="ok" title="Deploy finished" />
          </Specimen>
          <Specimen label="children only" wide>
            <Banner>Maintenance on Sunday, 02:00 UTC.</Banner>
          </Specimen>
          <Specimen label="actions" wide>
            <Banner
              tone="warn"
              title="Disk almost full"
              actions={
                <Button emphasis="low" size="sm">
                  Review
                </Button>
              }
            >
              Old snapshots will be pruned tonight.
            </Banner>
          </Specimen>
        </>
      }
    />
  )
}
