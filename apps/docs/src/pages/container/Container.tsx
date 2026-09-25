import { Card, Container } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { description } from '../../data/layout'

const SIZES = ['default', 'narrow', 'prose', 'full'] as const

export default function ContainerPage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <Container size={size}>
            <Card title="Leads" subtitle="12,400 in all">
              {description}
            </Card>
          </Container>
        </Specimen>
      ))}
    />
  )
}
