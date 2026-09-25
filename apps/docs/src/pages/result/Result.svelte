<script lang="ts">
  import { Button, Result } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { outcomes } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    {#each outcomes as { tone, title, description } (title)}
      <Specimen label={tone ? `tone="${tone}"` : 'no tone'}><Result {tone} {title} {description} /></Specimen>
    {/each}
    <Specimen label={`code="404"`}><Result code="404" title="Page not found" description="The link may be old, or the page moved." /></Specimen>
    <Specimen label={`tone="error" code="500"`}><Result tone="error" code="500" title="Something broke" description="It is on our side. Try again in a minute." /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="actions · children" wide>
      <Result tone="ok" title="Payment sent" description="€420 to Acme GmbH. A receipt is on its way to finance@acme.example.">
        {#snippet actions()}<Button emphasis="high">Back to invoices</Button>{/snippet}
        Reference 2026-0915-A
      </Result>
    </Specimen>
    <Specimen label={`code="404" · actions`} wide>
      <Result code="404" title="Page not found" description="The link may be old, or the page moved.">
        {#snippet actions()}<Button>Go home</Button>{/snippet}
      </Result>
    </Specimen>
  {/snippet}
</DemoPage>
