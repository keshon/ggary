import { Breadcrumbs } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { crumbs, deepCrumbs } from './data'

export default function BreadcrumbsPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="items" wide>
            <Breadcrumbs label="Location" items={crumbs} />
          </Specimen>
          <Specimen label="items, six deep" wide>
            <Breadcrumbs label="Location" items={deepCrumbs} />
          </Specimen>
        </>
      }
    />
  )
}
