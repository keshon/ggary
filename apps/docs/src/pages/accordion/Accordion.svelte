<script lang="ts">
  import { Accordion, KeyValueList } from '@ggary/svelte'
  import type { AccordionItem } from '@ggary/core/accordion'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { contactFacts, leadSections, leadSectionText, withArchive } from './data'
</script>

{#snippet text(item: AccordionItem)}{leadSectionText[item.value]}{/snippet}
{#snippet facts(item: AccordionItem)}
  {#if item.value === 'contact'}<KeyValueList items={contactFacts} />{:else}{leadSectionText[item.value]}{/if}
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label={`defaultValue={["contact"]}`} wide><Accordion items={leadSections} defaultValue={['contact']} panel={text} /></Specimen>
    <Specimen label="multiple" wide><Accordion items={leadSections} multiple defaultValue={['contact', 'deal']} panel={text} /></Specimen>
    <Specimen label={"collapsible={false}"} wide><Accordion items={leadSections} collapsible={false} defaultValue={['deal']} panel={text} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="items[].disabled" wide><Accordion items={withArchive} defaultValue={['contact']} panel={text} /></Specimen>
    <Specimen label="disabled" wide><Accordion items={leadSections} disabled defaultValue={['contact']} panel={text} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="KeyValueList in a section" wide><Accordion items={leadSections} defaultValue={['contact']} panel={facts} /></Specimen>
  {/snippet}
</DemoPage>
