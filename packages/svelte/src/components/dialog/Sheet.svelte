<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Dialog from './Dialog.svelte'

  type Props = Omit<ComponentProps<typeof Dialog>, 'placement'> & {
    /** The edge it stands at. Logical: `end` is the right in a left-to-right page. Default `end`. */
    side?: 'start' | 'end'
  }

  /*
   * A full-height panel at the edge of the screen: the same dialog, with the
   * same parts, focus, Escape and scroll lock, in a different layout.
   */
  let { side = 'end', open = $bindable(), ...rest }: Props = $props()
</script>

<Dialog {...rest} placement={side} bind:open />
