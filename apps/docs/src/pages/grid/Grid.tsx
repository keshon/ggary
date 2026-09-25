import { Card, Grid } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { tiles } from '../../data/layout'

const COLUMNS = ['tight', 'default', 'wide'] as const
const GAPS = ['none', 'tight', 'loose'] as const

function Cards({ count }: { count: number }) {
  return (
    <>
      {tiles.slice(0, count).map((tile) => (
        <Card key={tile.title} title={tile.title}>
          {tile.value}
        </Card>
      ))}
    </>
  )
}

export default function GridPage() {
  return (
    <DemoPage
      variants={
        <>
          {COLUMNS.map((columns) => (
            <Specimen key={columns} label={`columns="${columns}"`} wide>
              <Grid columns={columns}>
                <Cards count={6} />
              </Grid>
            </Specimen>
          ))}
          {GAPS.map((gap) => (
            <Specimen key={gap} label={`gap="${gap}"`} wide>
              <Grid columns="tight" gap={gap}>
                <Cards count={4} />
              </Grid>
            </Specimen>
          ))}
        </>
      }
    />
  )
}
