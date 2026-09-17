export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  /** What is being waited for. Default "Loading". */
  label?: string
  size?: SpinnerSize
}
