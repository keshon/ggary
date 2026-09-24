/** Where a context menu was asked for: at a pointer, or — from the keyboard — at the element. */
export interface ContextMenuRequest {
  element: HTMLElement
  point: { x: number; y: number } | null
}

export interface ContextMenuTargetOptions {
  /** A request to open: the adapter stands the menu where it says and opens it. */
  onRequest: (request: ContextMenuRequest) => void
}
