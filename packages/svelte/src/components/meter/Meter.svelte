<script lang="ts">
  import { connect, type MeterProps } from '@ggary/core/meter'
  import { svelteNormalizer, uid } from '@ggary/core'

  /** One quantity against its own ceiling. A reading, not a job: no value means nothing here. */
  let props: MeterProps = $props()

  const id = uid('gg-meter')
  const api = $derived(connect({ ...props, id }, svelteNormalizer))
</script>

<div {...api.rootProps}>
  {#if api.showLabel}<span {...api.labelProps}>{props.label}</span>{/if}
  {#if api.showValue}<span {...api.valueProps}>{api.valueText}</span>{/if}
  <div {...api.trackProps}>
    <div {...api.fillProps}></div>
  </div>
</div>
