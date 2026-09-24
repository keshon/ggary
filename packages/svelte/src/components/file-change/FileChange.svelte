<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type FileChangeProps, type FileChangeWords } from '@ggary/core/file-change'
  import { svelteNormalizer } from '@ggary/core'

  /* words: what each change is called aloud, for another language. */
  let { change, words: ownWords }: FileChangeProps & { words?: FileChangeWords } = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'fileChange', ownWords))
  const api = $derived(connect({ change }, svelteNormalizer, { words }))
</script>

<span {...api.rootProps}><span {...api.signProps}>{api.sign}</span><span {...api.labelProps}>{api.word}</span></span>
