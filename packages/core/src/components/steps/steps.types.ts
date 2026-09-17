export type StepState = 'done' | 'current' | 'todo'

export interface Step {
  name: string
  /** The state in a word. Left out, the state's own word is used. */
  note?: string
  state: StepState
}

export interface StepsProps {
  items: Step[]
  label?: string
}
