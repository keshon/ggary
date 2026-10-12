<script lang="ts">
  import { Button, Dialog, Field, Input, Select } from '@ggary/svelte'
  import DialogSpecimen from '../../svelte/DialogSpecimen.svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { roles, terms } from '../../data/overlays'

</script>

{#snippet actions(save: string, destructive = false)}
  <Button emphasis="minimal">Cancel</Button>
  <Button emphasis="high" {destructive}>{save}</Button>
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label="title, description, footer" wide>
      <div class="frame">
        <DialogSpecimen title="Edit profile" description="Changes show on your public profile.">
          <Field label="Display name"><Input defaultValue="Garry" /></Field>
          <Select label="Role" items={roles} defaultValue="editor" />
          {#snippet footer()}{@render actions('Save')}{/snippet}
        </DialogSpecimen>
      </div>
    </Specimen>
    <Specimen label={`role="alertdialog" closeButton={false}`} wide>
      <div class="frame">
        <DialogSpecimen role="alertdialog" size="sm" closeButton={false} title="Delete project?" description="This cannot be undone.">
          <p>Everything in “Atlas” goes, including its run history and settings.</p>
          {#snippet footer()}{@render actions('Delete', true)}{/snippet}
        </DialogSpecimen>
      </div>
    </Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each ['sm', 'md', 'lg'] as const as size (size)}
      <Specimen label={`size="${size}"`} wide>
        <div class="frame">
          <DialogSpecimen {size} title="Terms of service">
            {#each terms as clause (clause)}<p>{clause}</p>{/each}
            {#snippet footer()}<Button emphasis="high">Accept</Button>{/snippet}
          </DialogSpecimen>
        </div>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="trigger">
      <Dialog title="Edit profile" description="Changes show on your public profile.">
        {#snippet trigger(props)}<Button {...props}>Edit profile</Button>{/snippet}
        <div class="select-pilot-layout">
        <Field label="Display name"><Input defaultValue="Garry" /></Field>
        <Select label="Role" items={roles} defaultValue="editor" />
        </div>
        {#snippet footer()}{@render actions('Save')}{/snippet}
      </Dialog>
    </Specimen>
  {/snippet}
</DemoPage>
