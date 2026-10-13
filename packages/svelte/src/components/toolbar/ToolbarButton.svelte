<script lang="ts">
 import { Toolbar as Primitive } from 'bits-ui'
 import type { ButtonProps } from '@ggary/core/button'
 import type { Snippet } from 'svelte'
 import Button from '../button/Button.svelte'
 import { useToolbar } from './context'
 let { children, disabled = false, ...rest }: ButtonProps & { children?: Snippet; [key: string]: unknown } = $props()
 const managed = useToolbar()
</script>
{#if managed()}
 <Primitive.Button {disabled}>
  {#snippet child({ props: primitiveProps })}<Button {...primitiveProps} {...rest} {disabled}>{@render children?.()}</Button>{/snippet}
 </Primitive.Button>
{:else}
 <Button {...rest} {disabled}>{@render children?.()}</Button>
{/if}
