import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'

/**
 * A form's validation, in three layers, each over the one before:
 *
 *   1. the browser's own constraints — `required`, `type="email"`,
 *      `minlength` — read from each control's validity, as Field already does;
 *   2. rules: `validate(data)` returns errors by field name, for what the
 *      browser cannot say — two passwords that differ, a choice required of a
 *      Select, whose hidden input the browser does not validate;
 *   3. the server's: `onSubmit` may return errors by name and a message for
 *      the whole form.
 *
 * A submit that finds errors is stopped, every field says what is wrong, an
 * optional summary lists them as links, and the focus goes to the summary —
 * or, without one, to the first field in error. Once a submit has been tried,
 * the rules run again as the person edits, so an error leaves as soon as it
 * is fixed. Without `onSubmit`, a valid form submits as it always would: to a
 * server that renders pages, the kit only adds the checking.
 */

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

const clean = (errors: Record<string, string | null | undefined | false>) =>
  Object.fromEntries(Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== ''))

export function reducer(state: FormState, event: FormEvent): FormState {
  switch (event.type) {
    case 'REGISTER': {
      const known = state.fields[event.name]
      if (known && known.id === event.id && known.label === event.label) return state
      return { ...state, fields: { ...state.fields, [event.name]: { id: event.id, label: event.label } } }
    }
    case 'UNREGISTER': {
      if (state.fields[event.name]?.id !== event.id) return state
      const { [event.name]: _gone, ...fields } = state.fields
      return { ...state, fields }
    }
    case 'SUMMARY_MOUNT':
      return { ...state, summaries: state.summaries + 1 }
    case 'SUMMARY_UNMOUNT':
      return { ...state, summaries: Math.max(0, state.summaries - 1) }
    case 'INVALID':
      return {
        ...state,
        status: 'invalid',
        errors: clean(event.errors),
        message: null,
        submitCount: state.submitCount + 1,
        focus: { target: state.summaries > 0 ? 'summary' : 'first', nonce: state.focus.nonce + 1 },
      }
    case 'SUMMARY':
      return { ...state, summary: event.items }
    case 'SUBMITTING':
      return { ...state, status: 'submitting', errors: {}, message: null, summary: [], submitCount: state.submitCount + 1 }
    case 'SUBMITTED': {
      const errors = clean(event.errors ?? {})
      const failed = Object.keys(errors).length > 0 || !!event.message
      if (!failed) return { ...state, status: 'submitted', errors: {}, message: null, summary: [] }
      return {
        ...state,
        status: 'failed',
        errors,
        message: event.message ?? null,
        focus: { target: state.summaries > 0 ? 'summary' : 'first', nonce: state.focus.nonce + 1 },
      }
    }
    case 'EDITED': {
      if (!(event.name in state.errors)) return state
      const { [event.name]: _fixed, ...errors } = state.errors
      return { ...state, errors }
    }
    case 'RULES': {
      // The rules' own names are replaced; a server's error on another name stands.
      const kept = Object.fromEntries(Object.entries(state.errors).filter(([name]) => !event.names.includes(name)))
      const errors = { ...kept, ...clean(event.errors) }
      const same = Object.keys(errors).length === Object.keys(state.errors).length && Object.entries(errors).every(([name, text]) => state.errors[name] === text)
      return same ? state : { ...state, errors }
    }
    case 'SET_ERRORS':
      return { ...state, errors: clean(event.errors), message: event.message ?? state.message, status: 'failed', focus: { target: state.summaries > 0 ? 'summary' : 'first', nonce: state.focus.nonce + 1 } }
    case 'RESET':
      return { ...state, errors: {}, message: null, status: 'idle', submitCount: 0, summary: [] }
  }
}

export function initialState(id: string): FormState {
  return { id, errors: {}, message: null, status: 'idle', submitCount: 0, fields: {}, summaries: 0, summary: [], focus: { target: null, nonce: 0 } }
}

export function createFormMachine(config: { id: string; onStatusChange?: (status: FormStatus) => void }): Machine<FormState, FormEvent> {
  return withEffects(createMachine(initialState(config.id), reducer), (previous, next) => {
    if (previous.status !== next.status) config.onStatusChange?.(next.status)
  })
}

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

const isPromise = <T>(value: unknown): value is Promise<T> => !!value && typeof (value as Promise<T>).then === 'function'

/** The name a person reads for a control: its label, the label it points at, its own. */
function labelOf(element: Element): string {
  const labelled = (element as HTMLInputElement).labels?.[0]?.textContent
  if (labelled) return labelled.trim()
  const ids = element.getAttribute('aria-labelledby')
  if (ids) {
    const doc = element.ownerDocument
    const text = ids.split(/\s+/).map((id) => doc.getElementById(id)?.textContent?.trim() ?? '').filter(Boolean)
    // The label, not what the control says it holds: a Select's value follows its label.
    if (text.length) return text[0]
  }
  return element.getAttribute('aria-label') ?? (element as HTMLInputElement).name ?? ''
}

/** What the page says is wrong with a control: the error its field shows, or the browser's message. */
function messageOf(element: Element): string {
  const doc = element.ownerDocument
  for (const id of (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)) {
    const described = doc.getElementById(id)
    const part = described?.getAttribute('data-part')
    if (described && (part === 'error' || part === 'field-error') && !described.hidden && described.textContent?.trim()) return described.textContent.trim()
  }
  return (element as HTMLInputElement).validationMessage ?? ''
}

const controlsOf = (form: HTMLFormElement) => [...form.elements].filter((element): element is HTMLInputElement => 'validity' in element && 'willValidate' in element)

/** Every error on the page, in its order: the browser's, then the rules' and the server's by name, one per field. */
export function collectSummary(form: HTMLFormElement, state: FormState): FormSummaryItem[] {
  const doc = form.ownerDocument
  const entries: { element: Element | null; item: FormSummaryItem }[] = []
  const named = new Set(Object.keys(state.errors))
  for (const control of controlsOf(form)) {
    if (!control.willValidate || control.validity.valid || (control.name && named.has(control.name))) continue
    if (!control.id) control.id = `${state.id}-control-${entries.length}`
    entries.push({ element: control, item: { id: control.id, name: control.name, label: labelOf(control), message: messageOf(control) } })
  }
  for (const [name, message] of Object.entries(state.errors)) {
    const field = state.fields[name]
    const element = (field && doc.getElementById(field.id)) || (form.elements.namedItem(name) as Element | null)
    const id = field?.id ?? (element as HTMLElement | null)?.id ?? ''
    entries.push({ element, item: { id, name, label: field?.label || (element ? labelOf(element) : name), message } })
  }
  entries.sort((a, b) => {
    if (!a.element || !b.element) return a.element ? -1 : b.element ? 1 : 0
    return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  })
  return entries.map((entry) => entry.item)
}

/**
 * Validate a form on submit, show its errors, and send it. Returns the
 * cleanup. The adapters' Form calls it; a page of plain HTML can too.
 */
export function attachForm(form: HTMLFormElement, machine: Machine<FormState, FormEvent>, options: () => AttachFormOptions): () => void {
  const doc = form.ownerDocument
  // The kit shows the errors: no browser bubbles, which would also take the focus.
  const hadNoValidate = form.noValidate
  form.noValidate = true
  let passing = false
  let refresh: ReturnType<typeof setTimeout> | undefined

  /** After the fields have drawn their errors: read the summary off the page, and move the focus. */
  const settle = (moveFocus: boolean) => {
    clearTimeout(refresh)
    refresh = setTimeout(() => {
      const state = machine.getState()
      machine.send({ type: 'SUMMARY', items: collectSummary(form, state) })
      if (!moveFocus) return
      // Once the summary it just filled is drawn: a hidden element takes no focus.
      refresh = setTimeout(focusTarget, 0)
    }, 0)
  }

  const focusTarget = () => {
    const state = machine.getState()
    const target = state.focus.target
    if (target === 'summary') {
      const summary = form.querySelector<HTMLElement>('[data-scope="form-summary"][data-part="root"]') ?? doc.querySelector<HTMLElement>(`[data-scope="form-summary"][data-form="${state.id}"]`)
      if (summary) {
        summary.focus()
        return
      }
    }
    const first = state.summary[0]
    const element = first && doc.getElementById(first.id)
    element?.focus()
  }

  /** Every name the rules have answered for: a rule that is satisfied may simply leave its name out. */
  const ruleNames = new Set<string>()
  const runRules = (data: FormData) => {
    const validate = options().validate
    const errors = validate ? validate(data) : {}
    if (!isPromise(errors)) for (const name of Object.keys(errors)) ruleNames.add(name)
    return errors
  }

  const onSubmit = (event: SubmitEvent) => {
    if (passing) {
      passing = false
      return
    }
    // A second press while the first is out is not a second submission.
    if (machine.getState().status === 'submitting') {
      event.preventDefault()
      return
    }
    const submitter = event.submitter as HTMLElement | null
    const data = new FormData(form, submitter)
    // The browser's constraints: each invalid control hears `invalid`, and its field shows why.
    const nativeValid = form.checkValidity()
    const rules = runRules(data)
    const { onSubmit: send } = options()

    const decide = (errors: FormErrors) => {
      const found = Object.values(errors).some((text) => typeof text === 'string' && text !== '')
      if (!nativeValid || found) {
        machine.send({ type: 'INVALID', errors: errors as Record<string, string> })
        settle(true)
        return false
      }
      return true
    }

    if (!isPromise(rules) && !send) {
      // Plain HTML all the way: a valid form goes on to its action.
      if (!decide(rules)) event.preventDefault()
      else machine.send({ type: 'SUBMITTED' })
      return
    }

    event.preventDefault()
    Promise.resolve(rules).then((errors) => {
      if (!decide(errors)) return
      if (!send) {
        machine.send({ type: 'SUBMITTED' })
        passing = true
        form.requestSubmit(submitter && 'form' in submitter ? (submitter as HTMLButtonElement) : undefined)
        return
      }
      machine.send({ type: 'SUBMITTING' })
      Promise.resolve()
        .then(() => send(data, event))
        .then(
          (result) => {
            machine.send({ type: 'SUBMITTED', errors: (result?.errors ?? {}) as Record<string, string>, message: result?.message ?? null })
            if (machine.getState().status === 'failed') settle(true)
          },
          (error) => {
            machine.send({ type: 'SUBMITTED', message: error instanceof Error ? error.message : String(error) })
            settle(true)
          }
        )
    })
  }

  /** An edit: that field's rule or server error goes; the rules run again once a submit has been tried. */
  const onEdit = (event: Event) => {
    const target = event.target as HTMLInputElement | null
    const name = target?.name
    if (name) edited(name)
  }

  const edited = (name: string) => {
    machine.send({ type: 'EDITED', name })
    const state = machine.getState()
    if (state.submitCount === 0) return
    const rules = runRules(new FormData(form))
    if (!isPromise(rules)) machine.send({ type: 'RULES', errors: rules as Record<string, string>, names: [...ruleNames] })
    if (state.status === 'invalid' || state.status === 'failed') settle(false)
  }

  const onReset = () => {
    machine.send({ type: 'RESET' })
  }

  form.addEventListener('submit', onSubmit)
  form.addEventListener('input', onEdit)
  form.addEventListener('change', onEdit)
  form.addEventListener('reset', onReset)
  // A composite control says it was edited itself: its hidden input fires nothing.
  // It says so as its value changes, before the framework has drawn the new
  // value into its hidden input: the rules read the form once it has.
  const onComposite = (event: Event) => {
    const name = (event as CustomEvent<{ name?: string }>).detail?.name
    if (name) setTimeout(() => edited(name), 0)
  }
  form.addEventListener(EDIT_EVENT, onComposite)
  return () => {
    clearTimeout(refresh)
    form.noValidate = hadNoValidate
    form.removeEventListener('submit', onSubmit)
    form.removeEventListener('input', onEdit)
    form.removeEventListener('change', onEdit)
    form.removeEventListener('reset', onReset)
    form.removeEventListener(EDIT_EVENT, onComposite)
  }
}

/** The event a composite control sends up when its value changes: its hidden input fires none. */
export const EDIT_EVENT = 'gg:edit'

/** Tell the form around `element` that the field `name` was edited. */
export function formEdited(element: Element | null, name: string | undefined): void {
  if (!element || !name) return
  element.dispatchEvent(new CustomEvent(EDIT_EVENT, { bubbles: true, detail: { name } }))
}

export const formSummaryAnatomy = createAnatomy('form-summary', ['root', 'title', 'message', 'list', 'item', 'link'] as const)
export type FormSummaryPart = (typeof formSummaryAnatomy.parts)[number]

export interface FormSummaryWords {
  /** The summary's heading. */
  title?: string
  /** One error, as a link: "Email: Enter an email address". */
  item?: (label: string, message: string) => string
}

/** A form's errors in one place, at its top: a heading, the server's message, and a link to each field. */
export function connectSummary<T = Dict>(state: FormState, normalize: Normalizer<T>, options: { headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 } & { words?: FormSummaryWords } = {}) {
  const { words = {} } = options
  const shown = (state.status === 'invalid' || state.status === 'failed') && (state.summary.length > 0 || !!state.message)
  const titleId = `${state.id}-summary-title`
  return {
    shown,
    title: words.title ?? 'There is a problem',
    message: state.message,
    items: state.summary,
    itemText: (item: FormSummaryItem) => (words.item ?? ((label: string, message: string) => (label ? `${label}: ${message}` : message)))(item.label, item.message),
    rootProps: normalize({
      ...formSummaryAnatomy.attrs('root'),
      'data-form': state.id,
      // Focused after a failed submit, so its heading is read first.
      tabIndex: -1,
      role: 'region',
      'aria-labelledby': titleId,
      hidden: !shown || undefined,
    }),
    titleProps: normalize({ ...formSummaryAnatomy.attrs('title'), id: titleId, role: 'heading', 'aria-level': options.headingLevel ?? 2 }),
    messageProps: normalize({ ...formSummaryAnatomy.attrs('message') }),
    listProps: normalize({ ...formSummaryAnatomy.attrs('list') }),
    itemProps: normalize({ ...formSummaryAnatomy.attrs('item') }),
    getLinkProps: (item: FormSummaryItem) =>
      normalize({
        ...formSummaryAnatomy.attrs('link'),
        href: `#${item.id}`,
        // To the control itself, not to a scrolled-to anchor: the focus is what a keyboard needs.
        onClick: (event: MouseEvent) => {
          const target = (event.currentTarget as Element).ownerDocument.getElementById(item.id)
          if (!target) return
          event.preventDefault()
          target.focus()
          if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'center' })
        },
      }),
  }
}

/** What a field named `name` shows from its form: the rule's or the server's error, if any. */
export function formErrorOf(state: FormState | null | undefined, name: string | undefined): string | undefined {
  return name && state ? state.errors[name] : undefined
}

export const formAnatomy = createAnatomy('form', ['root', 'field-error'] as const)

/**
 * For a control that has no Field around it — Select, Combobox, DatePicker —
 * the error its form holds for it: the props to add to its focusable part,
 * and the element that says it.
 */
export function connectFieldError<T = Dict>(error: string | undefined, errorId: string, normalize: Normalizer<T>) {
  return {
    error,
    controlProps: { 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? errorId : undefined, 'data-invalid': error ? '' : undefined },
    errorProps: normalize({ ...formAnatomy.attrs('field-error'), id: errorId, hidden: !error || undefined }),
  }
}

export function connectForm<T = Dict>(state: FormState, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({
      ...formAnatomy.attrs('root'),
      id: state.id,
      'aria-busy': state.status === 'submitting' ? 'true' : undefined,
      'data-status': state.status,
    }),
  }
}
