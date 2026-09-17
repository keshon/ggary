import type { IconName } from '@ggary/icons'

/**
 * The kit's one vocabulary of state, from Instrument: five values and no sixth.
 * There is no `info`: an informational message is `neutral`, because blue
 * belongs to the accent and to `running`.
 */
export type StatusTone = 'neutral' | 'running' | 'ok' | 'warn' | 'error'

/** The glyph a tone carries, so colour is never the only carrier. */
export const TONE_ICONS: Record<StatusTone, IconName> = {
  neutral: 'status-info',
  running: 'status-info',
  ok: 'status-ok',
  warn: 'status-warn',
  error: 'status-error',
}
