/** Uploads with no server: the demo's own upload functions, and the files a page drops on itself as it loads. */

/**
 * An upload with no server: a file goes at about 2 MB a second in steps, and
 * stops when it is cancelled. One whose name has "fail" in it is refused half
 * way, the way a server's 503 would be; one with "slow" never says how far.
 */
export function demoUpload(file: File, { signal, onProgress }: import('@ggary/core/upload').UploadContext): Promise<string> {
  return new Promise((resolve, reject) => {
    const total = Math.max(file.size, 1)
    const slow = /slow/i.test(file.name)
    let loaded = 0
    const timer = setInterval(() => {
      loaded = Math.min(total, loaded + Math.max(total / 12, 200_000))
      if (!slow) onProgress(loaded, total)
      if (/fail/i.test(file.name) && loaded >= total / 2) {
        clearInterval(timer)
        reject(new Error('The server said no (503)'))
      } else if (loaded >= total) {
        clearInterval(timer)
        resolve(`upload-${file.name}`)
      }
    }, slow ? 700 : 160)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(signal.reason)
    })
  })
}

/**
 * Upload's every state on the page at once, with nobody choosing a file: the
 * page drops these files on the zone as it loads, and this upload holds each
 * one where it should be seen — part way, done, failed, or never saying how far.
 * The too-large and wrong-type ones never reach it: the kit refuses them first.
 */
const stagedPlan: Record<string, 'done' | 'fail' | 'unknown' | number> = {
  'q3-report-final.pdf': 0.64,
  'brief-v2.docx': 'done',
  'contract-signed.pdf': 'fail',
  'board-deck.pdf': 'unknown',
  'harbour.png': 0.64,
  'sunset.png': 'done',
  'field.png': 'fail',
}
export function stagedUpload(file: File, { onProgress }: import('@ggary/core/upload').UploadContext): Promise<string> {
  const plan = stagedPlan[file.name] ?? 'done'
  if (plan === 'done') return Promise.resolve(`upload-${file.name}`)
  if (plan === 'fail') return Promise.reject(new Error('The server said no (503)'))
  if (typeof plan === 'number') onProgress(Math.round(plan * file.size), file.size)
  return new Promise(() => {})
}

const sized = (name: string, bytes: number, type = '') => new File([new ArrayBuffer(bytes)], name, { type })

/** In the order that leaves one going, one there, one failed, one never saying, and the last waiting for a place (two at a time). */
export const stagedRowFiles = () => [
  sized('q3-report-final.pdf', 3_800_000, 'application/pdf'),
  sized('brief-v2.docx', 1_200_000),
  sized('contract-signed.pdf', 900_000, 'application/pdf'),
  sized('scans-full.pdf', 24_000_000, 'application/pdf'),
  sized('board-deck.pdf', 6_400_000, 'application/pdf'),
  sized('notes.txt', 2_000, 'text/plain'),
  sized('appendix.pdf', 640_000, 'application/pdf'),
]

async function picture(name: string, from: string, to: string): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 160
  const paint = canvas.getContext('2d')!
  const fill = paint.createLinearGradient(0, 0, 160, 160)
  fill.addColorStop(0, from)
  fill.addColorStop(1, to)
  paint.fillStyle = fill
  paint.fillRect(0, 0, 160, 160)
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((made) => resolve(made!), 'image/png'))
  return new File([blob], name, { type: 'image/png' })
}

export const stagedTileFiles = async () => [
  await picture('harbour.png', '#9cc3e8', '#2f5d8a'),
  await picture('sunset.png', '#f3b37a', '#6c4a5c'),
  await picture('field.png', '#b7d9b0', '#3d6b45'),
  sized('notes.txt', 2_000, 'text/plain'),
]

/** A drop on the Upload inside `host`, as a person would make one. */
export function stageDrop(host: HTMLElement, files: File[]) {
  const zone = host.querySelector<HTMLElement>('[data-scope="file-drop"][data-part="root"]')
  if (!zone) return
  const transfer = new DataTransfer()
  for (const file of files) transfer.items.add(file)
  zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }))
  zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }))
}

/** A face already there, for the avatar's one tile. */
export const avatarPicture = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c7b8f5"/><stop offset="1" stop-color="#5b4bb7"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#efeafd"/><path d="M18 100c4-22 18-32 32-32s28 10 32 32z" fill="#efeafd"/></svg>')}`
