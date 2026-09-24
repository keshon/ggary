export interface FormSummaryItem {
  /** The id of the control to go to. */
  id: string
  name: string
  label: string
  message: string
}

export type FormStatus = 'idle' | 'invalid' | 'submitting' | 'failed' | 'submitted'

export interface FormState {
  id: string
  /** From the rules and the server, by field name. The browser's own errors live on the controls. */
  errors: Record<string, string>
  /** A message for the whole form, from the server. */
  message: string | null
  status: FormStatus
  submitCount: number
  /** The fields that said who they are: their control's id and label, by name. */
  fields: Record<string, { id: string; label: string }>
  /** How many summaries are drawn: with one, a failed submit takes the focus there. */
  summaries: number
  /** What the summary lists: every error, in the order of the page. */
  summary: FormSummaryItem[]
  /** Where the focus goes after a failed submit; `nonce` moves it. */
  focus: { target: 'summary' | 'first' | null; nonce: number }
}

export type FormEvent =
  | { type: 'REGISTER'; name: string; id: string; label: string }
  | { type: 'UNREGISTER'; name: string; id: string }
  | { type: 'SUMMARY_MOUNT' }
  | { type: 'SUMMARY_UNMOUNT' }
  /** A submit was tried and found errors: these, and the summary read from the page. */
  | { type: 'INVALID'; errors: Record<string, string> }
  | { type: 'SUMMARY'; items: FormSummaryItem[] }
  | { type: 'SUBMITTING' }
  /** The owner answered: nothing, or errors by name and a message. */
  | { type: 'SUBMITTED'; errors?: Record<string, string>; message?: string | null }
  /** A field was edited: its rule or server error goes, until the rules say again. */
  | { type: 'EDITED'; name: string }
  /** The rules ran again: their errors now. */
  | { type: 'RULES'; errors: Record<string, string>; names: string[] }
  | { type: 'SET_ERRORS'; errors: Record<string, string>; message?: string | null }
  | { type: 'RESET' }

/** Errors by field name; an empty string, null or false is no error. */
export type FormErrors = Record<string, string | null | undefined | false>

export interface FormSubmitResult {
  errors?: FormErrors
  /** A message for the whole form: "The deal could not be saved." */
  message?: string | null
}

export interface AttachFormOptions {
  /**
   * The rules the browser cannot check, by field name. Synchronous rules run
   * again as the person edits, once a submit has been tried; a promise is
   * waited for on submit only.
   */
  validate?: (data: FormData) => FormErrors | Promise<FormErrors>
  /**
   * Send it yourself: the form is not submitted by the browser. Return errors
   * the server found, or a message, and they are shown as the rules' are.
   * Without it, a valid form submits natively.
   */
  onSubmit?: (data: FormData, event: SubmitEvent) => void | FormSubmitResult | Promise<void | FormSubmitResult>
}

export interface FormSummaryWords {
  /** The summary's heading. */
  title?: string
  /** One error, as a link: "Email: Enter an email address". */
  item?: (label: string, message: string) => string
}
