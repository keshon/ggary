import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
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
import { attachDialog, reactNormalizer, type Dict } from '@ggary/core'

export interface CommandPaletteProps {
  commands: PaletteCommand[]
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
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
  const { commands, open, defaultOpen, onOpenChange, onRun, load, loadOptions, hotkey = 'k', trigger, words } = props
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

  const contentRef = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const element = contentRef.current
    if (!state.open || !element) return
    const instance = attachDialog(element, {
      modal: true,
      closeOnEscape: true,
      closeOnOutside: true,
      // Escape goes up a level first, and closes only at the top.
      onDismiss: (reason) => machine.send({ type: reason === 'escape' ? 'ESCAPE' : 'CLOSE' }),
      onNativeClose: () => machine.send({ type: 'CLOSE' }),
    })
    document.getElementById(api.ids.input)?.focus()
    return () => instance.destroy()
  }, [machine, state.open, api.ids.input])

  const listRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => revealPaletteItem(listRef.current, state.highlighted ? api.ids.item(state.highlighted) : null))

  return (
    <>
      {trigger?.(api.triggerProps)}
      <dialog ref={contentRef} {...api.contentProps}>
        {state.open && (
          <>
            <div {...api.controlProps}>
              <span {...api.searchIconProps} />
              {api.pages.map((page) => (
                <span key={page.id} {...api.pageProps}>
                  {page.label}
                </span>
              ))}
              <input {...api.inputProps} />
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
      </dialog>
    </>
  )
}
