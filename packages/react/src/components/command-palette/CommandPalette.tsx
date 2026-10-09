import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactElement, type ReactNode } from 'react'
import {
  attachPaletteHotkey,
  attachPaletteSource,
  connect,
  createPaletteMachine,
  revealPaletteItem,
  type PaletteCommand,
  type PaletteLoad,
  type PaletteWords,
} from '@ggary/core/command-palette'
import { reactNormalizer, type Dict } from '@ggary/core'
import { Dialog as Primitive } from '@base-ui/react/dialog'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'
import { useConfigured } from '../config-provider'

export interface CommandPaletteProps {
  commands: PaletteCommand[]
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Over the page, the rest of it inert (default). False shows it in the page
   * instead — beside what is around it, as a palette set into a panel — and a
   * press elsewhere leaves it open.
   */
  modal?: boolean
  /** A command was chosen. It runs after the palette has closed and given the focus back. */
  onRun?: (command: PaletteCommand) => void
  /** Records from a server, under their own heading on the top level: leads, deals, people. */
  load?: PaletteLoad
  /** How long the typing pauses before the server is asked (default 150 ms), and how much must be typed (default 2). */
  loadOptions?: { debounce?: number; minLength?: number }
  /** Ctrl+K, ⌘K on a Mac. A letter for another; false for none. Default 'k'. */
  hotkey?: string | false
  /** An opener of your own: spread the props onto a button. */
  trigger?: (props: Dict) => ReactNode
  words?: Partial<PaletteWords>
}

/** Ctrl+K from anywhere: a field that finds what to do, and Enter does it. */
export function CommandPalette(props: CommandPaletteProps) {
  props = useConfigured(props, { words: 'commandPalette' })
  const { commands, open, defaultOpen, onOpenChange, modal = true, onRun, load, loadOptions, hotkey = 'k', trigger, words } = props
  const id = `gg-palette-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onOpenChange, onRun, load })
  callbacks.current = { onOpenChange, onRun, load }
  const [machine] = useState(() =>
    createPaletteMachine({
      id,
      commands,
      open,
      defaultOpen,
      onOpenChange: (next) => callbacks.current.onOpenChange?.(next),
      onRun: (command) => callbacks.current.onRun?.(command),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { words })

  useEffect(() => machine.send({ type: 'SYNC_COMMANDS', commands }), [machine, commands])
  useEffect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  }, [machine, open])
  useEffect(() => (hotkey === false ? undefined : attachPaletteHotkey(document, () => machine.send({ type: 'TOGGLE' }), hotkey)), [machine, hotkey])
  const hasLoad = load !== undefined
  const debounce = loadOptions?.debounce
  const minLength = loadOptions?.minLength
  useEffect(() => (hasLoad ? attachPaletteSource(machine, (query, signal) => callbacks.current.load!(query, signal), { debounce, minLength }) : undefined), [machine, hasLoad, debounce, minLength])

  const anchorRef = useRef<HTMLDivElement>(null)
  const [inlineHost, setInlineHost] = useState<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const environment = useOverlayEnvironment(anchorRef, state.open)

  const listRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => revealPaletteItem(listRef.current, state.highlighted ? api.ids.item(state.highlighted) : null))

  const popup = (
      <Primitive.Popup {...api.contentProps} data-backend="base-ui" data-modal={modal ? '' : undefined}
        initialFocus={inputRef} finalFocus={true}>
        {state.open && (
          <>
            <div {...api.controlProps}>
              <span {...api.searchIconProps} />
              {api.pages.map((page) => (
                <span key={page.id} {...api.pageProps}>
                  {page.label}
                </span>
              ))}
              <input ref={inputRef} {...api.inputProps} />
            </div>
            <div ref={listRef} {...api.listProps}>
              {api.groups.map((group, index) => (
                <div key={group.name || `group-${index}`} {...api.getGroupProps(group, index)}>
                  {group.name && <div {...api.getGroupLabelProps(group, index)}>{group.name}</div>}
                  {group.commands.map((command) => (
                    <div key={command.id} {...api.getItemProps(command)}>
                      <span {...api.itemTextProps}>
                        {command.label}
                        {command.description && <span {...api.itemDescriptionProps}>{command.description}</span>}
                      </span>
                      {command.shortcut && <kbd {...api.itemShortcutProps}>{command.shortcut}</kbd>}
                      {command.children && <span {...api.itemBranchProps} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {api.isEmpty && <p {...api.emptyProps}>{api.status}</p>}
            <div {...api.statusProps}>{api.status}</div>
            <div {...api.footerProps}>
              <span {...api.hintProps}>
                <kbd {...api.keyProps}>↑</kbd>
                <kbd {...api.keyProps}>↓</kbd>
                {api.words.hintMove}
              </span>
              <span {...api.hintProps}>
                <kbd {...api.keyProps}>↵</kbd>
                {api.words.hintRun}
              </span>
              <span {...api.hintProps}>
                <kbd {...api.keyProps}>Esc</kbd>
                {api.pages.length > 0 ? api.words.hintBack : api.words.hintClose}
              </span>
            </div>
          </>
        )}
      </Primitive.Popup>
  )
  return <Primitive.Root open={state.open} modal={modal} disablePointerDismissal={!modal}
    onOpenChange={(next, details) => {
      if (details.reason === 'escape-key') {
        details.cancel()
        machine.send({ type: 'ESCAPE' })
      } else machine.send({ type: next ? 'OPEN' : 'CLOSE' })
    }}>
    <div ref={anchorRef} data-scope="command-palette" data-part="anchor" style={{ display: 'contents' }}>
      {trigger && <Primitive.Trigger render={p => trigger({ ...p,
        'aria-expanded': state.open ? 'true' : 'false', 'aria-keyshortcuts': hotkey === false ? undefined : `Control+${hotkey.toUpperCase()} Meta+${hotkey.toUpperCase()}` }) as ReactElement} />}
    </div>
    {modal ? <Primitive.Portal keepMounted container={environment.container}>
      <div data-scope="dialog" data-part="layer" data-backend="base-ui"
        data-mode={environment.mode} dir={environment.dir} lang={environment.locale} style={environment.style}>
        <Primitive.Backdrop data-scope="command-palette" data-part="backdrop" data-backend="base-ui" />
        {popup}
      </div>
    </Primitive.Portal> : <><div ref={setInlineHost} data-scope="command-palette" data-part="inline-host" />{inlineHost && <Primitive.Portal keepMounted container={inlineHost}>{popup}</Primitive.Portal>}</>}
  </Primitive.Root>
}
