import { Badge, Button, Cluster, ClusterSpacer } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { gaps, tags } from '../../data/layout'

const JUSTIFIES = ['start', 'end', 'between'] as const

function Tags({ count }: { count: number }) {
  return (
    <>
      {tags.slice(0, count).map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </>
  )
}

export default function ClusterPage() {
  return (
    <DemoPage
      variants={
        <>
          {gaps.map((gap) => (
            <Specimen key={gap} label={`gap="${gap}"`}>
              <Cluster gap={gap}>
                <Tags count={6} />
              </Cluster>
            </Specimen>
          ))}
          {JUSTIFIES.map((justify) => (
            <Specimen key={justify} label={`justify="${justify}"`} wide>
              <Cluster justify={justify}>
                <Tags count={4} />
              </Cluster>
            </Specimen>
          ))}
        </>
      }
      composition={
        <Specimen label="ClusterSpacer" wide>
          <Cluster>
            <Tags count={3} />
            <ClusterSpacer />
            <Button size="sm" emphasis="low">
              Edit tags
            </Button>
          </Cluster>
        </Specimen>
      }
    />
  )
}
