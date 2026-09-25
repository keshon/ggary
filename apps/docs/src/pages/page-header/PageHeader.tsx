import { Breadcrumbs, Button, Icon, PageHeader } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { crumbs, description } from '../../data/layout'

export default function PageHeaderPage() {
  return (
    <DemoPage
      composition={
        <>
          <Specimen label="title" wide>
            <PageHeader title="Leads" headingLevel={3} />
          </Specimen>
          <Specimen label="title · description" wide>
            <PageHeader title="Leads" description={description} headingLevel={3} />
          </Specimen>
          <Specimen label="title · actions" wide>
            <PageHeader
              title="Leads"
              headingLevel={3}
              actions={
                <Button emphasis="high">
                  <Icon name="plus" /> New lead
                </Button>
              }
            />
          </Specimen>
          <Specimen label="context · title · description · actions" wide>
            <PageHeader
              context={<Breadcrumbs items={crumbs} />}
              title="Leads"
              description={description}
              headingLevel={3}
              actions={
                <>
                  <Button emphasis="low">Import</Button>
                  <Button emphasis="high">
                    <Icon name="plus" /> New lead
                  </Button>
                </>
              }
            />
          </Specimen>
        </>
      }
    />
  )
}
