<script lang="ts">
  import { Field, Input, InputGroup } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { inputTypes } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const

  /** The password shown as it loads: its reveal button pressed once. */
  const revealed = (host: HTMLElement) => {
    requestAnimationFrame(() => host.querySelector<HTMLButtonElement>('[data-part="reveal"]')?.click())
  }
</script>

<DemoPage>
  {#snippet variants()}
    {#each inputTypes as { type, name, placeholder, defaultValue } (type)}
      <Specimen label={`type="${type}"`}><Input {type} aria-label={name} {placeholder} {defaultValue} /></Specimen>
    {/each}
    <Specimen label={`type="password" reveal={false}`}>
      <Input type="password" reveal={false} aria-label="PIN" defaultValue="2041" />
    </Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Input {size} aria-label={`Full name, ${size}`} placeholder="Anna Petrova" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled"><Input disabled aria-label="Company" defaultValue="Atlas Ltd" /></Specimen>
    <Specimen label="readOnly"><Input readOnly aria-label="Invoice" defaultValue="INV-2041" /></Specimen>
    <Specimen label="invalid"><Input invalid type="email" aria-label="Email" defaultValue="anna@" /></Specimen>
    <Specimen label="required, in a Field">
      <Field label="Email" required><Input type="email" placeholder="you@example.com" /></Field>
    </Specimen>
    <Specimen label={`type="password": revealed`}>
      <div use:revealed><Input type="password" aria-label="Password" defaultValue="atlas-2041" /></div>
    </Specimen>
    <Specimen label={`type="password" disabled`}>
      <Input type="password" disabled aria-label="Password" defaultValue="atlas-2041" />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="in a Field">
      <Field label="Full name" hint="As it appears on your ID"><Input autoComplete="name" /></Field>
    </Specimen>
    <Specimen label="in an InputGroup">
      <InputGroup suffix=".example.com"><Input aria-label="Subdomain" defaultValue="worldbox" /></InputGroup>
    </Specimen>
  {/snippet}
</DemoPage>
