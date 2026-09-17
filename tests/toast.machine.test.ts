import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connect, createToaster, DEFAULT_DURATION, LEAVE_MS } from '../packages/core/src/components/toast'

const identity = <T,>(props: T) => props

describe('toaster — the queue and its clock', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const states = (toaster: ReturnType<typeof createToaster>) =>
    toaster.getState().toasts.map((toast) => `${toast.title}:${toast.state}`)

  it('a toast leaves after its duration, plays its exit, then is gone', () => {
    const toaster = createToaster()
    toaster.toast({ title: 'Saved' })
    vi.advanceTimersByTime(DEFAULT_DURATION - 1)
    expect(states(toaster)).toEqual(['Saved:open'])
    vi.advanceTimersByTime(1)
    expect(states(toaster)).toEqual(['Saved:leaving'])
    vi.advanceTimersByTime(LEAVE_MS)
    expect(states(toaster)).toEqual([])
  })

  it('an error stays until dismissed; so does duration 0', () => {
    const toaster = createToaster()
    const error = toaster.toast({ title: 'Could not send', tone: 'error' })
    toaster.toast({ title: 'Pinned', duration: 0 })
    vi.advanceTimersByTime(60_000)
    expect(states(toaster)).toEqual(['Could not send:open', 'Pinned:open'])
    toaster.dismiss(error)
    vi.advanceTimersByTime(LEAVE_MS)
    expect(states(toaster)).toEqual(['Pinned:open'])
  })

  it('pausing stops every clock and resuming continues with the time that was left', () => {
    const toaster = createToaster()
    toaster.toast({ title: 'Queued', duration: 1000 })
    vi.advanceTimersByTime(600)
    toaster.pause()
    vi.advanceTimersByTime(10_000)
    expect(states(toaster)).toEqual(['Queued:open'])
    toaster.resume()
    vi.advanceTimersByTime(399)
    expect(states(toaster)).toEqual(['Queued:open'])
    vi.advanceTimersByTime(1)
    expect(states(toaster)).toEqual(['Queued:leaving'])
  })

  it('a toast shown while paused waits for the pause to end', () => {
    const toaster = createToaster()
    toaster.pause()
    toaster.toast({ title: 'Later', duration: 500 })
    vi.advanceTimersByTime(5000)
    expect(states(toaster)).toEqual(['Later:open'])
    toaster.resume()
    vi.advanceTimersByTime(500)
    expect(states(toaster)).toEqual(['Later:leaving'])
  })

  it('no more than four at once: the oldest leaves for the newest', () => {
    const toaster = createToaster()
    for (const title of ['1', '2', '3', '4', '5']) toaster.toast({ title, duration: 0 })
    expect(states(toaster)).toEqual(['1:leaving', '2:open', '3:open', '4:open', '5:open'])
  })

  it('the same id updates a toast in place, and a new tone starts its clock again', () => {
    const toaster = createToaster()
    const id = toaster.toast({ title: 'Saving…', tone: 'running', duration: 0 })
    vi.advanceTimersByTime(10_000)
    toaster.toast({ id, title: 'Saved', tone: 'ok' })
    expect(toaster.getState().toasts).toHaveLength(1)
    expect(toaster.getState().toasts[0]).toMatchObject({ title: 'Saved', tone: 'ok', duration: DEFAULT_DURATION })
    vi.advanceTimersByTime(DEFAULT_DURATION)
    expect(states(toaster)).toEqual(['Saved:leaving'])
  })

  it('announces each message, errors urgently, and a repeat again', () => {
    const toaster = createToaster()
    toaster.toast({ title: 'Saved', text: 'All changes' })
    expect(toaster.getState().announcement).toEqual({ text: 'Saved. All changes', urgent: false, nonce: 1 })
    toaster.toast({ title: 'Saved', text: 'All changes' })
    expect(toaster.getState().announcement.nonce).toBe(2)
    toaster.toast({ title: 'Failed', tone: 'error' })
    expect(toaster.getState().announcement).toMatchObject({ text: 'Failed', urgent: true })
  })

  it('dismiss() without an id clears them all', () => {
    const toaster = createToaster()
    toaster.toast({ title: 'a' })
    toaster.toast({ title: 'b', tone: 'error' })
    toaster.dismiss()
    expect(states(toaster)).toEqual(['a:leaving', 'b:leaving'])
  })
})

describe('toaster connect', () => {
  it('is a labelled, always-open manual popover region, with two live announcers', () => {
    const toaster = createToaster()
    toaster.toast({ title: 'Oops', tone: 'error' })
    const api = connect(toaster.getState(), toaster, identity, { placement: 'top-end' })
    expect(api.regionProps).toMatchObject({ role: 'region', 'aria-label': 'Notifications', popover: 'manual', 'data-placement': 'top-end' })
    expect(api.politeProps['aria-live']).toBe('polite')
    expect(api.assertiveProps['aria-live']).toBe('assertive')
    expect(api.assertiveText).toBe('Oops')
    expect(api.politeText).toBe('')
  })

  it('names the icon by tone, and none without a tone', () => {
    const toaster = createToaster()
    toaster.toast({ title: 'ok', tone: 'ok' })
    toaster.toast({ title: 'plain' })
    const api = connect(toaster.getState(), toaster, identity)
    const [ok, plain] = toaster.getState().toasts
    expect(api.getIconProps(ok)['data-icon']).toBe('status-ok')
    expect(api.getIconProps(plain)['data-icon']).toBeUndefined()
    expect(api.getToastProps(ok)).toMatchObject({ 'data-tone': 'ok', 'data-state': 'open' })
  })

  it('an action runs and dismisses its toast; the close button dismisses', () => {
    const toaster = createToaster()
    const onClick = vi.fn()
    toaster.toast({ title: 'Deleted', action: { label: 'Undo', onClick } })
    const api = connect(toaster.getState(), toaster, identity)
    const [toast] = toaster.getState().toasts
    api.getActionProps(toast).onClick()
    expect(onClick).toHaveBeenCalled()
    expect(toaster.getState().toasts[0].state).toBe('leaving')
    expect(api.getCloseProps(toast)['aria-label']).toBe('Dismiss')
  })
})
