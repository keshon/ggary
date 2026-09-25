import { Card, Column, Columns, Metric } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { tiles, uneven } from '../../data/layout'

const GAPS = ['none', 'tight', 'loose'] as const
const ALIGNS = ['start', 'center', 'end'] as const

function Thirds() {
  return (
    <>
      {tiles.slice(0, 3).map((tile) => (
        <Column key={tile.title} span={4}>
          <Card title={tile.title}>{tile.value}</Card>
        </Column>
      ))}
    </>
  )
}

export default function ColumnsPage() {
  return (
    <DemoPage
      variants={
        <>
          {GAPS.map((gap) => (
            <Specimen key={gap} label={`gap="${gap}"`} wide>
              <Columns gap={gap}>
                <Thirds />
              </Columns>
            </Specimen>
          ))}
          {ALIGNS.map((align) => (
            <Specimen key={align} label={`align="${align}"`} wide>
              <Columns align={align}>
                {uneven.map((card) => (
                  <Column key={card.title} span={4}>
                    <Card title={card.title} subtitle={card.subtitle}>
                      {card.value}
                    </Card>
                  </Column>
                ))}
              </Columns>
            </Specimen>
          ))}
        </>
      }
      composition={
        <>
          <Specimen label="Column span={4}" wide>
            <Columns>
              <Thirds />
            </Columns>
          </Specimen>
          <Specimen label="Column span={{ base: 12, medium: 8 }} · span={{ base: 12, medium: 4 }}" wide>
            <Columns>
              <Column span={{ base: 12, medium: 8 }}>
                <Card title="Pipeline" subtitle="214 open deals">
                  RUB 12.8M
                </Card>
              </Column>
              <Column span={{ base: 12, medium: 4 }}>
                <Card title="Won">96</Card>
              </Column>
            </Columns>
          </Specimen>
          <Specimen label="Column start={4}" wide>
            <Columns>
              <Column span={6} start={4}>
                <Card title="Unassigned">104,802</Card>
              </Column>
            </Columns>
          </Specimen>
          <Specimen label="Columns in a Column" wide>
            <Columns gap="loose">
              <Column span={{ base: 12, medium: 8 }}>
                <Card title="Pipeline" subtitle="214 open deals">
                  RUB 12.8M
                </Card>
              </Column>
              <Column span={{ base: 12, medium: 4 }}>
                <Columns gap="tight">
                  <Column span={{ base: 12, narrow: 6 }}>
                    <Metric label="Won" value={42} />
                  </Column>
                  <Column span={{ base: 12, narrow: 6 }}>
                    <Metric label="Lost" value={7} />
                  </Column>
                </Columns>
              </Column>
            </Columns>
          </Specimen>
        </>
      }
    />
  )
}
