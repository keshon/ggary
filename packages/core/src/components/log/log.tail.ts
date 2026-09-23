/**
 * A log that follows its tail, and lets go the moment the reader scrolls away.
 *
 * DOM only, like the Gantt's drag: the machine holds no scroll position, and
 * this is the one piece of a log that has to know where the reader is.
 *
 * The rule is the whole of it: **never fight the reader's scroll.** While the
 * view is at the bottom the log holds the bottom as lines arrive; the moment
 * the reader scrolls up — to read the error that went past — it stops, and
 * stays stopped until they come back to the end themselves, or a control calls
 * `follow()`. A log that scrolls itself under a reader's eyes is unreadable at
 * exactly the moment it is wanted.
 *
 * Whether it is following is written on the root as `data-following`, so a
 * theme can show a "jump to the end" affordance without asking anyone.
 */

export interface LogTailOptions {
  /**
   * How near the bottom still counts as the bottom, in pixels. A line's height
   * or so: a browser's fractional scroll heights mean an exact comparison is
   * false on a view that looks pinned. Default 24.
   */
  threshold?: number
  /** Start let go rather than following, for a log opened at an older line. */
  following?: boolean
}

export interface LogTail {
  /** Go to the end and follow it again. */
  follow(): void
  /** Whether new lines are being followed. */
  following(): boolean
  dispose(): void
}

export function attachLogTail(root: HTMLElement, options: LogTailOptions = {}): LogTail {
  const { threshold = 24 } = options
  let following = options.following ?? true

  const atBottom = () => root.scrollHeight - root.clientHeight - root.scrollTop <= threshold
  const mark = () => root.setAttribute('data-following', following ? 'true' : 'false')
  const toBottom = () => {
    root.scrollTop = root.scrollHeight
  }

  const onScroll = () => {
    const next = atBottom()
    if (next === following) return
    following = next
    mark()
  }

  // Lines arrive as nodes rather than as an event, so the arrival is watched
  // rather than announced. `characterData` as well: a line still being written
  // grows in place.
  const observer = new MutationObserver(() => {
    if (following) toBottom()
  })

  root.addEventListener('scroll', onScroll, { passive: true })
  observer.observe(root, { childList: true, subtree: true, characterData: true })
  mark()
  if (following) toBottom()

  return {
    follow() {
      following = true
      mark()
      toBottom()
    },
    following: () => following,
    dispose() {
      observer.disconnect()
      root.removeEventListener('scroll', onScroll)
    },
  }
}
