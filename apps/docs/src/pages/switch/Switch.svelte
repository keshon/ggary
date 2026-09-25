<script lang="ts">
  import { Field, Switch } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="unchecked"><Switch>Bluetooth</Switch></Specimen>
    <Specimen label="defaultChecked"><Switch defaultChecked>Wi-Fi</Switch></Specimen>
    <Specimen label="disabled"><Switch disabled>Bluetooth</Switch></Specimen>
    <Specimen label="disabled defaultChecked"><Switch disabled defaultChecked>Wi-Fi</Switch></Specimen>
    <Specimen label="readOnly"><Switch readOnly>Bluetooth</Switch></Specimen>
    <Specimen label="readOnly defaultChecked"><Switch readOnly defaultChecked>Wi-Fi</Switch></Specimen>
    <Specimen label="invalid"><Switch invalid>Share usage data</Switch></Specimen>
    <Specimen label="required, in a Field">
      <Field label="Data processing" required><Switch>I agree</Switch></Field>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="no label, aria-label"><Switch aria-label="Keep logs" defaultChecked /></Specimen>
    <Specimen label="in a Field">
      <Field label="Notifications" hint="Takes effect immediately"><Switch defaultChecked>Email me</Switch></Field>
    </Specimen>
  {/snippet}
</DemoPage>
