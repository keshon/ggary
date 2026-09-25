<script lang="ts">
  import { Button, Dialog, Field, Input, Select } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { roles, terms } from '../../data/overlays'

  /** Shown with the page, beside it rather than over it, so it can be seen without being opened. */
  const shown = { defaultOpen: true, modal: false, closeOnOutside: false } as const
</script>

{#snippet actions(save: string, destructive = false)}
  <Button emphasis="minimal">Cancel</Button>
  <Button emphasis="high" {destructive}>{save}</Button>
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label="title, description, footer" wide>
      <div class="frame">
        <Dialog {...shown} title="Edit profile" description="Changes show on your public profile.">
          <Field label="Display name"><Input defaultValue="Garry" /></Field>
          <Select label="Role" items={roles} defaultValue="editor" />
          {#snippet footer()}{@render actions('Save')}{/snippet}
        </Dialog>
      </div>
    </Specimen>
    <Specimen label={`role="alertdialog" closeButton={false}`} wide>
      <div class="frame">
        <Dialog {...shown} role="alertdialog" size="sm" closeButton={false} title="Delete project?" description="This cannot be undone.">
          <p>Everything in “Atlas” goes, including its run history and settings.</p>
          {#snippet footer()}{@render actions('Delete', true)}{/snippet}
        </Dialog>
      </div>
    </Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each ['sm', 'md', 'lg'] as const as size (size)}
      <Specimen label={`size="${size}"`} wide>
        <div class="frame">
          <Dialog {...shown} {size} title="Terms of service">
            {#each terms as clause (clause)}<p>{clause}</p>{/each}
            {#snippet footer()}<Button emphasis="high">Accept</Button>{/snippet}
          </Dialog>
        </div>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="trigger">
      <Dialog title="Edit profile" description="Changes show on your public profile.">
        {#snippet trigger(props)}<Button {...props}>Edit profile</Button>{/snippet}
        <Field label="Display name"><Input defaultValue="Garry" /></Field>
        {#snippet footer()}{@render actions('Save')}{/snippet}
      </Dialog>
    </Specimen>
  {/snippet}
</DemoPage>
