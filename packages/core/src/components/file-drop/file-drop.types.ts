export interface FileDropProps {
  name?: string
  /** A hint to the system dialog, not validation: check on the server too. */
  accept?: string
  multiple?: boolean
  /** The call to action, and the zone's accessible name. */
  label?: string
  /** The limits of size and format — said BEFORE the choice, not after it. */
  hint?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  /** The names of what was chosen, shown under the call to action. */
  files?: string[]
}
