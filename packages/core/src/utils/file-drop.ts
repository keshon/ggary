/**
 * Dropping files on a zone. The input inside it is clipped to a pixel, so a
 * drop never reaches it by itself: the zone takes the drop and writes the files
 * into the input through a DataTransfer, which is the only way to set `files`
 * that a form and a framework both see.
 */

import { acceptsFile } from './bytes'

export interface FileDropCallbacks {
  /** Called when the zone is entered and left, for the drawn state. */
  onDraggingChange?: (dragging: boolean) => void
  /** Pass on a dropped file the `accept` list refuses, rather than leave it out: Upload lists it with the reason. Read on every drop. */
  keepRefused?: () => boolean
}

const hasFiles = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes('Files')

/** Everything the input will accept, by the `accept` list; an empty list means everything. */
export function acceptedFiles(input: HTMLInputElement, files: File[], keepRefused = false): File[] {
  const allowed = keepRefused ? files : files.filter((file) => acceptsFile(file, input.accept))
  return input.multiple ? allowed : allowed.slice(0, 1)
}

/**
 * Attach the drop to the zone. `input` is read on every event, so an adapter can
 * attach before its input exists. A disabled input takes nothing.
 */
export function attachFileDrop(zone: HTMLElement, input: () => HTMLInputElement | null, callbacks: FileDropCallbacks = {}): () => void {
  // dragenter and dragleave fire for every child the pointer crosses; a depth
  // count is what tells "left the zone" from "moved onto the hint inside it".
  let depth = 0
  const setDragging = (dragging: boolean) => callbacks.onDraggingChange?.(dragging)

  const onDragEnter = (event: DragEvent) => {
    const field = input()
    if (!field || field.disabled || !hasFiles(event)) return
    depth += 1
    if (depth === 1) setDragging(true)
  }
  const onDragOver = (event: DragEvent) => {
    const field = input()
    if (!field || field.disabled || !hasFiles(event)) return
    // Without preventDefault the browser opens the file instead of dropping it.
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }
  const onDragLeave = () => {
    if (depth === 0) return
    depth -= 1
    if (depth === 0) setDragging(false)
  }
  const onDrop = (event: DragEvent) => {
    const field = input()
    depth = 0
    setDragging(false)
    if (!field || field.disabled || !hasFiles(event)) return
    event.preventDefault()
    const files = acceptedFiles(field, [...(event.dataTransfer?.files ?? [])], callbacks.keepRefused?.() ?? false)
    if (files.length === 0) return
    const transfer = new DataTransfer()
    for (const file of files) transfer.items.add(file)
    field.files = transfer.files
    // The same events a choice through the dialog sends, so nothing downstream
    // needs to know a drop made this one.
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
  }

  zone.addEventListener('dragenter', onDragEnter)
  zone.addEventListener('dragover', onDragOver)
  zone.addEventListener('dragleave', onDragLeave)
  zone.addEventListener('drop', onDrop)
  return () => {
    zone.removeEventListener('dragenter', onDragEnter)
    zone.removeEventListener('dragover', onDragOver)
    zone.removeEventListener('dragleave', onDragLeave)
    zone.removeEventListener('drop', onDrop)
  }
}
