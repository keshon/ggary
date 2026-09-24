import { describe, expect, it, vi } from 'vitest'
import type { UploadContext } from '../../packages/core/src/components/upload'
import { type Adapter, click, freshTarget, part, parts } from './harness'

/** An upload function whose tries the test settles by hand. */
function manual() {
  const calls: { file: File; context: UploadContext; resolve: (value?: unknown) => void; reject: (reason: unknown) => void }[] = []
  const upload = vi.fn((file: File, context: UploadContext) => new Promise((resolve, reject) => calls.push({ file, context, resolve, reject })))
  return { upload, calls }
}

const file = (name: string, size = 1000, type = '') => new File([new Uint8Array(size)], name, { type })

/**
 * Files chosen through the input, as the dialog chooses them. jsdom's `files`
 * cannot be set, so the input is given its own; both events go, as a real
 * choice sends them — React listens for `change` on a file input, Svelte for `input`.
 */
function choose(root: Element, files: File[]) {
  const input = part(root, 'file-drop', 'input') as HTMLInputElement
  Object.defineProperty(input, 'files', { configurable: true, value: files })
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Upload: the zone, and a list whose items are the files. A file is sent as it
 * is chosen by the owner's function; refused before sending when it is the
 * wrong type or too large; cancelled, removed and retried by named buttons;
 * said when it is there or failed; and submitted as what its upload answered.
 */
export function uploadConformance(adapter: Adapter) {
  describe('upload', () => {
    const setup = async (props: Partial<Parameters<Adapter['upload']>[0]> = {}) => {
      const m = await adapter.upload({ label: 'Drop files here', locale: 'en-GB', ...props }, freshTarget())
      const list = () => part(m.root, 'upload', 'list')!
      const items = () => parts(m.root, 'upload', 'item')
      const row = (name: string) => items().find((item) => part(item, 'upload', 'name')!.textContent === name)!
      const meta = (name: string) => part(row(name), 'upload', 'meta')?.textContent ?? ''
      const action = (name: string, kind: string) => row(name)?.querySelector<HTMLButtonElement>(`[data-scope="upload"][data-part="action"][data-action="${kind}"]`) ?? null
      const add = async (files: File[]) => {
        await adapter.act(() => choose(m.root, files))
        await adapter.wait(0)
      }
      return { m, list, items, row, meta, action, add }
    }

    it('is the zone over a list named Files; a file chosen is an item, sent, with a named progress bar', async () => {
      const { upload, calls } = manual()
      const { m, list, items, row, add } = await setup({ upload })
      expect(part(m.root, 'file-drop', 'root')).not.toBeNull()
      expect(items()).toHaveLength(0)
      await add([file('q3-report.pdf', 3_800_000)])
      expect(list().getAttribute('role')).toBe('list')
      expect(list().getAttribute('aria-label')).toBe('Files')
      expect(list().getAttribute('aria-busy')).toBe('true')
      expect(items().map((item) => item.getAttribute('role'))).toEqual(['listitem'])
      expect(calls.map((call) => call.file.name)).toEqual(['q3-report.pdf'])
      const bar = part(row('q3-report.pdf'), 'upload', 'progress')!
      expect(bar.getAttribute('role')).toBe('progressbar')
      expect(bar.getAttribute('aria-label')).toBe('Uploading q3-report.pdf')
      expect(bar.hasAttribute('aria-valuenow')).toBe(false)
      await adapter.act(() => calls[0].context.onProgress(1_900_000, 3_800_000))
      expect(part(row('q3-report.pdf'), 'upload', 'progress')!.getAttribute('aria-valuenow')).toBe('50')
      expect(part(row('q3-report.pdf'), 'upload', 'percent')!.textContent).toBe('50%')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('a file there is ticked, said once, and submitted as what its upload answered', async () => {
      const { upload, calls } = manual()
      const { m, row, meta, action, add } = await setup({ upload, name: 'attachments' })
      await add([file('brief.docx', 1_200_000)])
      await adapter.act(() => calls[0].resolve('key-42'))
      await adapter.wait(0)
      expect(row('brief.docx').dataset.status).toBe('done')
      expect(part(row('brief.docx'), 'upload', 'mark')).not.toBeNull()
      expect(part(row('brief.docx'), 'upload', 'progress')).toBeNull()
      expect(meta('brief.docx')).toBe('1.2 MB')
      expect(part(m.root, 'upload', 'status')!.textContent).toBe('brief.docx uploaded')
      expect([...m.root.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="attachments"]')].map((input) => input.value)).toEqual(['key-42'])
      expect(action('brief.docx', 'remove')!.getAttribute('aria-label')).toBe('Remove brief.docx')
    })

    it('refuses the wrong type or too large before sending, says why, and offers no retry', async () => {
      const { upload, calls } = manual()
      const { meta, action, add, items } = await setup({ upload, accept: '.pdf', maxSize: 20_000_000 })
      await add([file('notes.txt', 10, 'text/plain'), file('film.pdf', 30_000_000)])
      expect(calls).toHaveLength(0)
      expect(meta('notes.txt')).toBe('Not a type this takes')
      expect(meta('film.pdf')).toBe('Too large — the limit is 20 MB')
      expect(action('notes.txt', 'retry')).toBeNull()
      await adapter.act(() => click(action('notes.txt', 'remove')!))
      expect(items()).toHaveLength(1)
    })

    it('a failure says the upload’s words and offers Retry, named for the file; Retry sends it again', async () => {
      const { upload, calls } = manual()
      const { m, row, meta, action, add } = await setup({ upload })
      await add([file('contract.pdf')])
      await adapter.act(() => calls[0].reject(new Error('The server said no (503)')))
      await adapter.wait(0)
      expect(row('contract.pdf').dataset.status).toBe('error')
      expect(meta('contract.pdf')).toBe('The server said no (503)')
      expect(part(m.root, 'upload', 'status')!.textContent).toBe('contract.pdf failed: The server said no (503)')
      const retry = action('contract.pdf', 'retry')!
      expect(retry.getAttribute('aria-label')).toBe('Retry contract.pdf')
      expect(retry.textContent).toBe('Retry')
      await adapter.act(() => click(retry))
      await adapter.wait(0)
      expect(calls).toHaveLength(2)
      expect(row('contract.pdf').dataset.status).toBe('uploading')
    })

    it('cancelling a file going aborts it and takes it off the list', async () => {
      const { upload, calls } = manual()
      const { items, action, add } = await setup({ upload })
      await add([file('big.mov')])
      const cancel = action('big.mov', 'cancel')!
      expect(cancel.getAttribute('aria-label')).toBe('Cancel big.mov')
      await adapter.act(() => click(cancel))
      expect(calls[0].context.signal.aborted).toBe(true)
      expect(items()).toHaveLength(0)
    })

    it('sends so many at once; the rest wait, and say so', async () => {
      const { upload, calls } = manual()
      const { meta, add } = await setup({ upload, concurrency: 1 })
      await add([file('one.pdf'), file('two.pdf')])
      expect(calls).toHaveLength(1)
      expect(meta('two.pdf')).toBe('Waiting')
    })

    it('files already there are listed as done and submitted; the owner hears of changes', async () => {
      const onFilesChange = vi.fn()
      const { m, row, action, items } = await setup({ name: 'docs', defaultFiles: [{ name: 'old.pdf', size: 640_000, value: 'k-1' }], onFilesChange })
      expect(row('old.pdf').dataset.status).toBe('done')
      expect(m.root.querySelector<HTMLInputElement>('input[type="hidden"][name="docs"]')!.value).toBe('k-1')
      await adapter.act(() => click(action('old.pdf', 'remove')!))
      expect(items()).toHaveLength(0)
      expect(onFilesChange).toHaveBeenLastCalledWith([])
    })

    it('a form reset brings back the files it started with', async () => {
      const form = freshTarget('form') as HTMLFormElement
      const m = await adapter.upload({ name: 'docs', defaultFiles: [{ name: 'old.pdf', value: 'k-1' }] }, form)
      await adapter.act(() => choose(m.root, [file('new.pdf')]))
      await adapter.wait(0)
      await adapter.act(() => click(m.root.querySelector<HTMLButtonElement>('[data-action="remove"]')!))
      expect(parts(m.root, 'upload', 'name').map((name) => name.textContent)).toEqual(['new.pdf'])
      await adapter.act(() => form.reset())
      await adapter.wait(0)
      expect(parts(m.root, 'upload', 'name').map((name) => name.textContent)).toEqual(['old.pdf'])
      expect([...form.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="docs"]')].map((input) => input.value)).toEqual(['k-1'])
    })

    it('as tiles: a picture a file there, the zone after them, and the limits under the row', async () => {
      const { m, items } = await setup({ view: 'tiles', hint: 'Up to 5 MB', defaultFiles: [{ name: 'me.png', url: '/me.png' }] })
      expect(part(m.root, 'upload', 'root')!.dataset.view).toBe('tiles')
      const preview = part(items()[0], 'upload', 'preview') as HTMLImageElement
      expect(preview.getAttribute('src')).toBe('/me.png')
      expect(preview.getAttribute('alt')).toBe('')
      const zone = part(m.root, 'file-drop', 'root')!
      expect(part(m.root, 'upload', 'list')!.compareDocumentPosition(zone) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(part(zone, 'file-drop', 'hint')).toBeNull()
      expect(part(m.root, 'upload', 'hint')!.textContent).toBe('Up to 5 MB')
    })

    it('a disabled upload takes nothing', async () => {
      const { upload, calls } = manual()
      const { m, items, add } = await setup({ upload, disabled: true })
      expect((part(m.root, 'file-drop', 'input') as HTMLInputElement).disabled).toBe(true)
      await add([file('a.pdf')])
      expect(items()).toHaveLength(0)
      expect(calls).toHaveLength(0)
    })
  })
}
