import { Card, Skeleton } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

export default function SkeletonPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no props" wide>
            <Skeleton />
          </Specimen>
          <Specimen label="lines={3}" wide>
            <Skeleton lines={3} />
          </Specimen>
          <Specimen label="title" wide>
            <Skeleton title />
          </Specimen>
          <Specimen label="title lines={3}" wide>
            <Skeleton title lines={3} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="inside a Card, aria-busy" wide>
          <Card title="Run 1842" aria-busy="true">
            <Skeleton lines={3} />
          </Card>
        </Specimen>
      }
    />
  )
}
