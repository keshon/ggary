import { Icon, Tree } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { openBranches, projectTree, withLocked } from './data'

export default function TreePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`selectionMode="single"`}>
            <Tree items={projectTree} label="Boards" defaultExpanded={openBranches} defaultValue={['sales/leads/new']} />
          </Specimen>
          <Specimen label={`selectionMode="multiple"`}>
            <Tree items={projectTree} label="Boards" selectionMode="multiple" defaultExpanded={openBranches} defaultValue={['sales/leads/new', 'sales/leads/qualified']} />
          </Specimen>
          <Specimen label={`selectionMode="none"`}>
            <Tree items={projectTree} label="Boards" selectionMode="none" defaultExpanded={openBranches} />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="items[].disabled">
            <Tree items={withLocked} label="Boards" defaultExpanded={['sales']} defaultValue={['sales/deals']} />
          </Specimen>
          <Specimen label="disabled">
            <Tree items={projectTree} label="Boards" disabled defaultExpanded={openBranches} defaultValue={['sales/leads/new']} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="icon + label">
          <Tree items={projectTree} label="Boards" defaultExpanded={['sales', 'product']} defaultValue={['product/roadmap']}>
            {(node) => (
              <>
                <Icon name={node.children ? 'folder' : 'list'} /> {node.label}
              </>
            )}
          </Tree>
        </Specimen>
      }
    />
  )
}
