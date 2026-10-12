<script lang="ts">
  import { Dialog as Primitive } from 'bits-ui'
  import type { DialogChangeReason, DialogChangeDetails, DialogPlacement, DialogRole, DialogSize } from '@ggary/core/dialog'
  import type { Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import { getConfig } from '../config-provider/context'

  type Props = {
    /** Two-way with bind:open; a one-way open also follows owner updates. */
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean, details: DialogChangeDetails) => void
    title?: string
    description?: string
    /** Body children mount only while open. */
    children?: Snippet
    footer?: Snippet
    trigger?: Snippet<[Dict]>
    size?: DialogSize
    placement?: DialogPlacement
    modal?: boolean
    role?: DialogRole
    closeOnEscape?: boolean
    closeOnOutside?: boolean
    closeButton?: boolean
    closeLabel?: string
  }
  let { open = $bindable(), defaultOpen = false, onOpenChange, title, description,
    children, footer, trigger, size = 'md', placement = 'center', modal = true,
    role = 'dialog', closeOnEscape = true, closeOnOutside = true,
    closeButton = true, closeLabel = 'Close' }: Props = $props()
  const componentId = $props.id()
  const id = `gg-bits-dialog-${componentId}`
  const config = getConfig()
  let localOpen = $state(untrack(() => open ?? defaultOpen))
  const shown = $derived(open ?? localOpen)
  let reason: DialogChangeReason = 'api'
  function changed(next: boolean) {
    localOpen = next
    open = next
    onOpenChange?.(next, { reason })
    reason = 'api'
  }
  function submitted(event: SubmitEvent) {
    const form = event.target as HTMLFormElement
    if (form.tagName !== 'FORM' || event.defaultPrevented) return
    if (form.closest('[data-scope="dialog"][data-part="content"]') !== event.currentTarget) return
    const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null
    if ((submitter?.getAttribute('formmethod') ?? form.getAttribute('method'))?.toLowerCase() !== 'dialog') return
    event.preventDefault()
    localOpen = false; open = false
    onOpenChange?.(false, { reason: 'native', returnValue: submitter?.value ?? '' })
  }
  const part = (name: string) => ({ 'data-scope': 'dialog', 'data-part': name, 'data-backend': 'bits-ui' })
  let anchor = $state<HTMLDivElement | null>(null)
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  $effect(() => {
    if (!shown || !anchor) return
    const computed = getComputedStyle(anchor)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) {
      const key = computed[i]
      if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`)
    }
    inheritedDir = config().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
</script>

<Primitive.Root open={shown} onOpenChange={changed}>
  <div {...part('anchor')} bind:this={anchor} style="display:contents">
    {#if trigger}
      <Primitive.Trigger type="button" id={`${id}-trigger`} onclick={() => reason = 'trigger'} onkeydown={() => reason = 'trigger'}>
        {#snippet child({ props: primitiveProps })}
          {@render trigger({ ...primitiveProps, 'aria-expanded': shown ? 'true' : 'false' })}
        {/snippet}
      </Primitive.Trigger>
    {/if}
  </div>
  <Primitive.Portal>
    <div {...part('layer')} data-mode={config().mode} dir={inheritedDir} lang={config().locale} style={inheritedStyle} hidden={!shown}>
      {#if modal}<Primitive.Overlay {...part('backdrop')} />{/if}
      <Primitive.Content {...part('content')} id={`${id}-content`} forceMount hidden={!shown}
        {role} data-size={size} data-placement={placement} data-modal={modal ? '' : undefined}
        trapFocus={modal} preventScroll={modal} onsubmit={submitted}
        onEscapeKeydown={(event) => { reason = 'escape'; if (!closeOnEscape) { event.preventDefault(); reason = 'api' } }}
        onInteractOutside={(event) => { reason = 'outside'; if (!closeOnOutside) { event.preventDefault(); reason = 'api' } }}>
        {#snippet child({ props: primitiveProps })}
        <div {...primitiveProps} {role} aria-modal={modal ? 'true' : undefined}>
          {#if shown}
            {#if title != null || description != null || closeButton}
              <header {...part('header')}>
                {#if title != null}<Primitive.Title {...part('title')} level={2}>{title}</Primitive.Title>{/if}
                {#if description != null}<Primitive.Description {...part('description')}>{description}</Primitive.Description>{/if}
                {#if closeButton}
                  <Primitive.Close type="button" {...part('close')} aria-label={closeLabel} onclick={() => reason = 'close-button'} onkeydown={() => reason = 'close-button'}>
                    <span {...part('close-icon')} data-icon="close" aria-hidden="true"></span>
                  </Primitive.Close>
                {/if}
              </header>
            {/if}
            <div {...part('body')}>{@render children?.()}</div>
            {#if footer}<footer {...part('footer')}>{@render footer()}</footer>{/if}
          {/if}
        </div>
        {/snippet}
      </Primitive.Content>
    </div>
  </Primitive.Portal>
</Primitive.Root>
