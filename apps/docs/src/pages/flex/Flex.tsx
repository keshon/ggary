import { Badge, Button, Card, Flex, FlexItem, Search } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { tags, uneven } from '../../data/layout'

const JUSTIFIES = ['center', 'end', 'between'] as const
const ALIGNS = ['start', 'center', 'end', 'baseline'] as const
const GAPS = ['none', 'tight', 'loose'] as const

function Cards() {
  return (
    <>
      {uneven.map((card) => (
        <Card key={card.title} title={card.title} subtitle={card.subtitle}>
          {card.value}
        </Card>
      ))}
    </>
  )
}

export default function FlexPage() {
  return (
    <DemoPage
      variants={
        <>
          {(['row', 'column'] as const).map((direction) => (
            <Specimen key={direction} label={`direction="${direction}"`} wide>
              <Flex direction={direction}>
                <Cards />
              </Flex>
            </Specimen>
          ))}
          <Specimen label="wrap" wide>
            <Flex wrap gap="tight">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </Flex>
          </Specimen>
          {JUSTIFIES.map((justify) => (
            <Specimen key={justify} label={`justify="${justify}"`} wide>
              <Flex justify={justify}>
                <Cards />
              </Flex>
            </Specimen>
          ))}
          {ALIGNS.map((align) => (
            <Specimen key={align} label={`align="${align}"`} wide>
              <Flex align={align}>
                <Cards />
              </Flex>
            </Specimen>
          ))}
          {GAPS.map((gap) => (
            <Specimen key={gap} label={`gap="${gap}"`} wide>
              <Flex gap={gap}>
                <Cards />
              </Flex>
            </Specimen>
          ))}
        </>
      }
      composition={
        <>
          <Specimen label="FlexItem grow" wide>
            <Flex gap="tight" align="center">
              <FlexItem grow>
                <Search aria-label="Search leads" placeholder="Search leads" />
              </FlexItem>
              <Button>Filter</Button>
              <Button emphasis="high">New lead</Button>
            </Flex>
          </Specimen>
          <Specimen label="FlexItem grow={2} · grow={1}" wide>
            <Flex>
              <FlexItem grow={2}>
                <Card title="Pipeline">RUB 12.8M in 214 deals</Card>
              </FlexItem>
              <FlexItem grow={1}>
                <Card title="Won">96</Card>
              </FlexItem>
            </Flex>
          </Specimen>
          <Specimen label={`FlexItem align="end"`} wide>
            <Flex>
              <Card title="New leads" subtitle="This week">
                1,284
              </Card>
              <Card title="Won">96</Card>
              <FlexItem align="end">
                <Button emphasis="low">All weeks</Button>
              </FlexItem>
            </Flex>
          </Specimen>
        </>
      }
    />
  )
}
