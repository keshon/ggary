import { describe, expect, it, vi } from 'vitest'
import { connect, createUploadMachine, initialState, reducer, type UploadContext, type UploadMachineConfig } from '../packages/core/src/components/upload'
import { acceptsFile, formatBytes } from '../packages/core/src/utils/bytes'

/**
 * Upload with no DOM: files checked before anything is sent, a queue that
 * sends so many at once, progress from the owner's function, and every try
 * that is cancelled, removed or retried leaving no stale answer behind.
 */

const file = (name: string, size = 1000, type = '') => new File([new Uint8Array(size)], name, { type })
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const same = (props: Record<string, unknown>) => props

/** An upload function whose tries the test settles by hand. */
function manual() {
  const calls: { file: File; context: UploadContext; resolve: (value?: unknown) => void; reject: (reason: unknown) => void }[] = []
  const upload = vi.fn((file: File, context: UploadContext) => new Promise((resolve, reject) => calls.push({ file, context, resolve, reject })))
  return { upload, calls }
}

describe('sizes and types', () => {
  it('says a size in the locale’s decimal units, going up a unit rather than saying a thousand', () => {
    expect(formatBytes(512, 'en-GB')).toBe('512 byte')
    expect(formatBytes(640_000, 'en-GB')).toBe('640 kB')
    expect(formatBytes(3_800_000, 'en-GB')).toBe('3.8 MB')
    expect(formatBytes(999_960, 'en-GB')).toBe('1 MB')
    expect(formatBytes(20_000_000, 'ru-RU')).toBe('20 МБ')
  })

  it('reads an accept list as the file input does: an extension, a family, or a type', () => {
    expect(acceptsFile({ name: 'Report.PDF', type: '' }, '.pdf,.docx')).toBe(true)
    expect(acceptsFile({ name: 'cat.webp', type: 'image/webp' }, 'image/*')).toBe(true)
    expect(acceptsFile({ name: 'notes.txt', type: 'text/plain' }, 'image/*, .pdf')).toBe(false)
    expect(acceptsFile({ name: 'a.json', type: 'application/json' }, 'application/json')).toBe(true)
    expect(acceptsFile({ name: 'anything', type: '' }, '')).toBe(true)
  })
})

describe('upload', () => {
  const setup = (config: Partial<UploadMachineConfig> = {}) => {
    const changes: string[][] = []
    const machine = createUploadMachine({
      id: 'u',
      onFilesChange: (items) => changes.push(items.map((item) => `${item.name}:${item.status}`)),
      ...config,
    })
    const api = () => connect(machine.getState(), machine.send, same, { locale: 'en-GB', name: 'files' })
    const status = () => machine.getState().items.map((item) => `${item.name}:${item.status}`)
    return { machine, api, status, changes }
  }

  it('refuses a file of the wrong type, too large, or one too many before sending anything, and says why', () => {
    const { upload } = manual()
    const { machine, api, status } = setup({ upload, accept: '.pdf,image/*', maxSize: 20_000_000, maxFiles: 2 })
    machine.send({ type: 'ADD', files: [file('a.pdf'), file('notes.txt', 10, 'text/plain'), file('film.png', 30_000_000, 'image/png'), file('b.png', 10, 'image/png'), file('c.pdf')] })
    expect(status()).toEqual(['a.pdf:uploading', 'notes.txt:error', 'film.png:error', 'b.png:uploading', 'c.pdf:error'])
    const meta = api().entries.map((entry) => entry.meta)
    expect(meta.slice(1, 3)).toEqual(['Not a type this takes', 'Too large — the limit is 20 MB'])
    expect(meta[4]).toBe('Too many — up to 2 files')
    expect(api().entries.map((entry) => entry.canRetry)).toEqual([false, false, false, false, false])
  })

  it('sends so many at once, in the order they came, and starts the next as one settles', async () => {
    const { upload, calls } = manual()
    const { machine, status } = setup({ upload, concurrency: 2 })
    machine.send({ type: 'ADD', files: [file('1'), file('2'), file('3')] })
    expect(status()).toEqual(['1:uploading', '2:uploading', '3:waiting'])
    await tick()
    expect(calls.map((call) => call.file.name)).toEqual(['1', '2'])
    calls[1].resolve('key-2')
    await tick()
    expect(status()).toEqual(['1:uploading', '2:done', '3:uploading'])
    await tick()
    expect(calls.map((call) => call.file.name)).toEqual(['1', '2', '3'])
  })

  it('shows how far a file has gone, and says nothing of how far when the upload does not know', async () => {
    const { upload, calls } = manual()
    const { machine, api } = setup({ upload })
    machine.send({ type: 'ADD', files: [file('big.mov', 4000)] })
    await tick()
    const bar = () => api().getProgressProps(api().entries[0])
    expect(bar()['aria-valuenow']).toBeUndefined()
    expect(bar()['data-indeterminate']).toBe('')
    calls[0].context.onProgress(1000, 4000)
    expect(api().entries[0].percent).toBe(25)
    expect(bar()).toMatchObject({ role: 'progressbar', 'aria-valuenow': 25, 'aria-label': 'Uploading big.mov' })
    expect(api().getItemProps(api().entries[0]).style).toEqual({ '--gg-progress': 0.25 })
    calls[0].context.onProgress(2000)
    expect(api().entries[0].percent).toBeNull()
  })

  it('a file there is submitted as what its upload answered, or by its name; one there is said once', async () => {
    const { upload, calls } = manual()
    const { machine, api } = setup({ upload, defaultFiles: [{ name: 'old.pdf', size: 1200, value: 'key-0' }] })
    machine.send({ type: 'ADD', files: [file('a.pdf'), file('b.pdf')] })
    await tick()
    calls[0].resolve('key-a')
    calls[1].resolve()
    await tick()
    expect(api().hiddenInputs.map((input) => input.props.value)).toEqual(['key-0', 'key-a', 'b.pdf'])
    expect(api().saidText).toBe('b.pdf uploaded')
    expect(api().entries[0].meta).toBe('1 kB')
  })

  it('a failure shows the upload’s words, or the kit’s, and may be retried; a retry is a new try', async () => {
    const { upload, calls } = manual()
    const { machine, api, status } = setup({ upload })
    machine.send({ type: 'ADD', files: [file('a.pdf'), file('b.pdf')] })
    await tick()
    calls[0].reject(new Error('The server is busy'))
    calls[1].reject({})
    await tick()
    expect(api().entries.map((entry) => entry.meta)).toEqual(['The server is busy', 'Upload failed'])
    expect(api().saidText).toBe('b.pdf failed: Upload failed')
    expect(api().entries[0].canRetry).toBe(true)
    ;(api().getRetryProps(api().entries[0]).onClick as () => void)()
    expect(status()).toEqual(['a.pdf:uploading', 'b.pdf:error'])
    await tick()
    expect(calls).toHaveLength(3)
    calls[2].resolve()
    await tick()
    expect(status()).toEqual(['a.pdf:done', 'b.pdf:error'])
  })

  it('cancelling aborts the try, and its late answer is not taken', async () => {
    const { upload, calls } = manual()
    const { machine, api, status } = setup({ upload })
    machine.send({ type: 'ADD', files: [file('a.pdf')] })
    await tick()
    const { signal } = calls[0].context
    const dismiss = api().getDismissProps(api().entries[0])
    expect(dismiss).toMatchObject({ 'data-action': 'cancel', 'aria-label': 'Cancel a.pdf' })
    ;(dismiss.onClick as () => void)()
    expect(signal.aborted).toBe(true)
    expect(status()).toEqual([])
    calls[0].resolve('late')
    await tick()
    expect(status()).toEqual([])
  })

  it('a synchronous throw fails the file too, and without an upload a file is there once chosen', async () => {
    const thrown = setup({ upload: () => { throw new Error('No network') } })
    thrown.machine.send({ type: 'ADD', files: [file('a.pdf')] })
    await tick()
    expect(thrown.api().entries[0].meta).toBe('No network')
    const bare = setup()
    bare.machine.send({ type: 'ADD', files: [file('a.pdf')] })
    await tick()
    expect(bare.status()).toEqual(['a.pdf:done'])
  })

  it('one file at most: a new one takes the old one’s place, and a refused one leaves it', async () => {
    const { machine, status } = setup({ maxFiles: 1, accept: 'image/*', defaultFiles: [{ name: 'me.png', url: '/me.png' }] })
    machine.send({ type: 'ADD', files: [file('notes.txt', 10, 'text/plain')] })
    expect(status()).toEqual(['me.png:done', 'notes.txt:error'])
    machine.send({ type: 'ADD', files: [file('new.png', 10, 'image/png'), file('other.png', 10, 'image/png')] })
    await tick()
    expect(status()).toEqual(['new.png:done', 'other.png:error'])
  })

  it('tells the owner when the list changes, not at every percent', async () => {
    const { upload, calls } = manual()
    const { machine, changes } = setup({ upload })
    machine.send({ type: 'ADD', files: [file('a.pdf')] })
    await tick()
    calls[0].context.onProgress(10, 100)
    calls[0].context.onProgress(50, 100)
    calls[0].resolve()
    await tick()
    expect(changes).toEqual([['a.pdf:uploading'], ['a.pdf:done']])
  })

  it('going away aborts what is under way; coming back starts it again as a new try', async () => {
    const { upload, calls } = manual()
    const { machine, status } = setup({ upload })
    machine.send({ type: 'ADD', files: [file('a.pdf')] })
    await tick()
    machine.dispose()
    expect(calls[0].context.signal.aborted).toBe(true)
    machine.resume()
    await tick()
    expect(calls).toHaveLength(2)
    calls[0].reject(new DOMException('Aborted', 'AbortError'))
    await tick()
    expect(status()).toEqual(['a.pdf:uploading'])
    calls[1].resolve()
    await tick()
    expect(status()).toEqual(['a.pdf:done'])
    machine.resume()
    await tick()
    expect(calls).toHaveLength(2)
  })

  it('a disabled upload takes no files, and a reset puts back the files it started with', () => {
    const state = initialState({ id: 'u', disabled: true, defaultFiles: [{ name: 'a.pdf' }] })
    expect(reducer(state, { type: 'ADD', files: [file('b.pdf')] })).toBe(state)
    const added = reducer({ ...state, disabled: false }, { type: 'ADD', files: [file('b.pdf')] })
    const reset = reducer(added, { type: 'RESET', files: [{ name: 'a.pdf' }] })
    expect(reset.items.map((item) => item.name)).toEqual(['a.pdf'])
    expect(new Set([...added.items, ...reset.items].map((item) => item.id)).size).toBe(3)
  })
})
