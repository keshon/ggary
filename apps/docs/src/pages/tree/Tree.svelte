<script lang="ts">
  import { Icon, Tree } from '@ggary/svelte'
  import type { TreeNode } from '@ggary/core/tree'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { openBranches, projectTree, withLocked } from './data'
</script>

{#snippet row(node: TreeNode)}<Icon name={node.children ? 'folder' : 'list'} /> {node.label}{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label={`selectionMode="single"`}><Tree items={projectTree} label="Boards" defaultExpanded={openBranches} defaultValue={['sales/leads/new']} /></Specimen>
    <Specimen label={`selectionMode="multiple"`}>
      <Tree items={projectTree} label="Boards" selectionMode="multiple" defaultExpanded={openBranches} defaultValue={['sales/leads/new', 'sales/leads/qualified']} />
    </Specimen>
    <Specimen label={`selectionMode="none"`}><Tree items={projectTree} label="Boards" selectionMode="none" defaultExpanded={openBranches} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="items[].disabled"><Tree items={withLocked} label="Boards" defaultExpanded={['sales']} defaultValue={['sales/deals']} /></Specimen>
    <Specimen label="disabled"><Tree items={projectTree} label="Boards" disabled defaultExpanded={openBranches} defaultValue={['sales/leads/new']} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="icon + label">
      <Tree items={projectTree} label="Boards" defaultExpanded={['sales', 'product']} defaultValue={['product/roadmap']} {row} />
    </Specimen>
  {/snippet}
</DemoPage>
