import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connect as connectPopover } from '../packages/core/src/components/popover/popover.connect'
import { createPopoverMachine, initialState as popoverState, reducer as popoverReducer } from '../packages/core/src/components/popover/popover.machine'
import { connect as connectTooltip } from '../packages/core/src/components/tooltip/tooltip.connect'
import {
  createTooltipMachine,
  initialState as tooltipState,
  reducer as tooltipReducer,
} from '../packages/core/src/components/tooltip/tooltip.machine'
import type { TooltipEvent, TooltipState } from '../packages/core/src/components/tooltip/tooltip.types'

const identity = <T,>(props: T) => props

describe('popover machine', () => {
  it('the trigger toggles it; a second press closes', () => {
    const opened = popoverReducer(popoverState({ id: 'p' }), { type: 'TOGGLE' })
    expect(opened.open).toBe(true)
    const closed = popoverReducer(opened, { type: 'TOGGLE' })
    expect(closed.open).toBe(false)
    expect(closed.intent.reason).toBe('trigger')
  })

  it('shares the controlled rule with Dialog: requests are reported, the owner moves it', () => {
    const onOpenChange = vi.fn()
    const machine = createPopoverMachine({ id: 'p', open: false, onOpenChange })
    machine.send({ type: 'TOGGLE' })
    expect(machine.getState().open).toBe(false)
    expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'trigger' })
  })

  it('is a labelled, non-modal dialog in the top layer, with a trigger that controls it', () => {
    const api = connectPopover(popoverState({ id: 'p', defaultOpen: true }), () => {}, identity, { title: true })
    expect(api.contentProps).toMatchObject({ role: 'dialog', popover: 'manual', 'aria-labelledby': 'p-title', 'data-state': 'open' })
    expect(api.triggerProps).toMatchObject({ 'aria-haspopup': 'dialog', 'aria-expanded': 'true', 'aria-controls': 'p-content' })
    expect(api.triggerProps['data-scope']).toBeUndefined()
  })
})

describe('tooltip machine — the reducer', () => {
  const run = (state: TooltipState, ...events: TooltipEvent[]) => events.reduce(tooltipReducer, state)
  const base = tooltipState({ id: 't' })

  it('a pointer entering waits; the timer shows it', () => {
    const waiting = run(base, { type: 'POINTER_ENTER', warm: false })
    expect(waiting).toMatchObject({ open: false, pending: 'open' })
    expect(run(waiting, { type: 'TIMER' })).toMatchObject({ open: true, pending: null, intent: { reason: 'pointer' } })
  })

  it('leaving before the timer cancels it', () => {
    expect(run(base, { type: 'POINTER_ENTER', warm: false }, { type: 'POINTER_LEAVE' }, { type: 'TIMER' })).toMatchObject({
      open: false,
      pending: null,
    })
  })

  it('a pointer moving onto the tooltip keeps it (hoverable), and leaving that hides it', () => {
    const open = run(base, { type: 'FOCUS' })
    const kept = run(open, { type: 'POINTER_LEAVE' }, { type: 'CONTENT_ENTER' }, { type: 'TIMER' })
    expect(kept).toMatchObject({ open: true, pending: null })
    expect(run(kept, { type: 'CONTENT_LEAVE' }, { type: 'TIMER' }).open).toBe(false)
  })

  it('keyboard focus shows it at once; blur, a press and Escape hide it at once', () => {
    const open = run(base, { type: 'FOCUS' })
    expect(open).toMatchObject({ open: true, intent: { reason: 'focus' } })
    expect(run(open, { type: 'BLUR' }).open).toBe(false)
    expect(run(open, { type: 'PRESS' }).intent.reason).toBe('press')
    expect(run(open, { type: 'ESCAPE' }).intent.reason).toBe('escape')
  })

  it('warm: shows without waiting', () => {
    expect(run(base, { type: 'POINTER_ENTER', warm: true }).open).toBe(true)
  })

  it('disabled: nothing shows it, and disabling a showing tooltip hides it', () => {
    const disabled = tooltipState({ id: 't', disabled: true })
    expect(run(disabled, { type: 'FOCUS' }, { type: 'POINTER_ENTER', warm: true })).toBe(disabled)
    const open = run(base, { type: 'FOCUS' })
    expect(run(open, { type: 'SYNC_OPTIONS', disabled: true }).open).toBe(false)
  })

  it('an event that changes nothing returns the same state', () => {
    expect(run(base, { type: 'BLUR' })).toBe(base)
    expect(run(base, { type: 'CONTENT_ENTER' })).toBe(base)
  })
})

describe('tooltip machine — timers and the warm window', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('opens after openDelay and closes after closeDelay, reporting each once', () => {
    const onOpenChange = vi.fn()
    const machine = createTooltipMachine({ id: 'a', openDelay: 300, closeDelay: 100, onOpenChange })
    machine.send({ type: 'POINTER_ENTER' })
    vi.advanceTimersByTime(299)
    expect(machine.getState().open).toBe(false)
    vi.advanceTimersByTime(1)
    expect(machine.getState().open).toBe(true)
    machine.send({ type: 'POINTER_LEAVE' })
    vi.advanceTimersByTime(100)
    expect(machine.getState().open).toBe(false)
    expect(onOpenChange.mock.calls).toEqual([
      [true, { reason: 'pointer' }],
      [false, { reason: 'pointer' }],
    ])
  })

  it('moving from one tooltip to the next skips the second delay; waiting past the window restores it', () => {
    const first = createTooltipMachine({ id: 'first', openDelay: 300, closeDelay: 100 })
    const second = createTooltipMachine({ id: 'second', openDelay: 300, closeDelay: 100 })
    first.send({ type: 'POINTER_ENTER' })
    vi.advanceTimersByTime(300)
    first.send({ type: 'POINTER_LEAVE' })
    second.send({ type: 'POINTER_ENTER' })
    expect(second.getState().open).toBe(true)

    second.send({ type: 'POINTER_LEAVE' })
    vi.advanceTimersByTime(5000)
    const third = createTooltipMachine({ id: 'third', openDelay: 300 })
    third.send({ type: 'POINTER_ENTER' })
    expect(third.getState().open).toBe(false)
  })
})

describe('tooltip connect', () => {
  it('describes its trigger always, and is a tooltip in the top layer', () => {
    const api = connectTooltip(tooltipState({ id: 't' }), () => {}, identity)
    expect(api.triggerProps['aria-describedby']).toBe('t-content')
    expect(api.contentProps).toMatchObject({ role: 'tooltip', popover: 'manual', id: 't-content', 'data-state': 'closed' })
  })

  it('a touch pointer does not ask for a tooltip; a mouse does', () => {
    const send = vi.fn()
    const api = connectTooltip(tooltipState({ id: 't' }), send, identity)
    api.triggerProps.onPointerEnter({ pointerType: 'touch' })
    expect(send).not.toHaveBeenCalled()
    api.triggerProps.onPointerEnter({ pointerType: 'mouse' })
    expect(send).toHaveBeenCalledWith({ type: 'POINTER_ENTER' })
  })
})
