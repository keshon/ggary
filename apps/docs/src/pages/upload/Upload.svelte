<script lang="ts">
  import { Upload } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import Staged from '../../svelte/Staged.svelte'
  import { avatarPicture, demoUpload, stagedRowFiles, stagedTileFiles, stagedUpload } from '../../data/upload'

  const rows = { accept: '.pdf,.docx,image/*', maxSize: 20_000_000, label: 'Drop files here or browse', hint: 'PDF, DOCX or images · up to 20 MB each', locale: 'en-GB' }
  const tiles = { view: 'tiles' as const, accept: 'image/*', maxSize: 5_000_000, label: 'Add photo', hint: 'JPG, PNG or WebP · up to 5 MB', locale: 'en-GB' }
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`view="rows"`} wide><Upload upload={demoUpload} {...rows} /></Specimen>
    <Specimen label={`view="tiles"`} wide><Upload upload={demoUpload} {...tiles} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="uploading · done · failed · too large · unknown progress · wrong type · waiting" wide>
      <Staged files={stagedRowFiles}><Upload upload={stagedUpload} concurrency={2} {...rows} /></Staged>
    </Specimen>
    <Specimen label={`view="tiles": uploading · done · failed · wrong type`} wide>
      <Staged files={stagedTileFiles}><Upload upload={stagedUpload} {...tiles} /></Staged>
    </Specimen>
    <Specimen label="disabled" wide><Upload disabled {...rows} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={"maxFiles={1}, defaultFiles"} wide>
      <Upload upload={demoUpload} {...tiles} maxFiles={1} label="Avatar" hint="One picture; a new one replaces it" defaultFiles={[{ name: 'avatar.png', url: avatarPicture }]} />
    </Specimen>
    <Specimen label="defaultFiles, name" wide>
      <Upload upload={demoUpload} {...rows} name="documents" defaultFiles={[{ name: 'brief-v1.pdf', size: 1_240_000, value: 'k-brief' }]} />
    </Specimen>
  {/snippet}
</DemoPage>
