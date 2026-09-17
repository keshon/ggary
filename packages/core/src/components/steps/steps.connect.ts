import type { Dict, Normalizer } from '../../types'
import { stepsAnatomy as anatomy } from './steps.anatomy'
import type { Step, StepsProps, StepState } from './steps.types'

/**
 * The state in a word, because the colour of a bar has no right to be the only
 * carrier of it: "done", "now", "next" read on a printout and to anyone who
 * cannot tell the shades apart.
 */
export const STEP_NOTES: Record<StepState, string> = {
  done: 'done',
  current: 'now',
  todo: 'next',
}

/**
 * The stages of a process and where it has got to. An ordered list, so a screen
 * reader reports "3 of 5" without a label saying so, and every step declares its
 * state — a missing attribute cannot be told from a misspelt one.
 */
export function connect<T = Dict>(props: StepsProps, normalize: Normalizer<T>) {
  const { items, label } = props

  const getItemProps = (item: Step) => ({
    note: item.note ?? STEP_NOTES[item.state],
    itemProps: normalize({
      ...anatomy.attrs('item'),
      'data-state': item.state,
      // The step the process is on is the one a screen reader should land on.
      'aria-current': item.state === 'current' ? 'step' : undefined,
    }),
    nameProps: normalize({ ...anatomy.attrs('name'), 'data-state': item.state }),
    noteProps: normalize({ ...anatomy.attrs('note'), 'data-state': item.state }),
  })

  return {
    items,
    getItemProps,
    rootProps: normalize({ ...anatomy.attrs('root'), 'aria-label': label }),
  }
}
