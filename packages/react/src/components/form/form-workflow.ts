import type { Machine } from '@ggary/core'
import { collectSummary, type AttachFormOptions, type FormErrors, type FormEvent, type FormState } from '@ggary/core/form'

/** Collapse registered groups to their semantic field and use its visible error. */
function summaryOf(form: HTMLFormElement, state: FormState) {
  const seen = new Set<string>()
  return collectSummary(form, state).flatMap(item => {
    const canonicalId = form.ownerDocument.getElementById(item.id)?.getAttribute('data-gg-control-id')
    const name = canonicalId
      ? Object.keys(state.fields).find(name => state.fields[name].id === canonicalId) ?? item.name
      : item.name
    const field = state.fields[name]
    if (!field) return [item]
    if (seen.has(name)) return []
    seen.add(name)
    const element = form.ownerDocument.getElementById(field.id)
    const error = (element?.getAttribute('aria-describedby') ?? '').split(/\s+/)
      .map(id => form.ownerDocument.getElementById(id))
      .find(node => node && !node.hidden && ['error', 'field-error'].includes(node.getAttribute('data-part') ?? ''))
    const labelledBy = (element?.getAttribute('aria-labelledby') ?? '').split(/\s+/)
      .map(id => form.ownerDocument.getElementById(id)?.textContent?.trim()).find(Boolean) ?? ''
    return [{ ...item, name, id: field.id, label: field.label || labelledBy || item.label, message: error?.textContent?.trim() || item.message }]
  })
}

const sameValues = (before: FormDataEntryValue[], after: FormDataEntryValue[]) =>
  before.length === after.length && before.every((value, index) => {
    const next = after[index]
    if (typeof value === 'string' || typeof next === 'string') return value === next
    // Browsers synthesize a fresh empty File for an untouched file input.
    // Real selected Files retain identity; a new selection must be revalidated.
    return value === next || (!value.name && !next.name && value.size === 0 && next.size === 0)
  })
const sameData = (before: FormData, after: FormData) =>
  [...new Set([...before.keys(), ...after.keys()])].every(name => sameValues(before.getAll(name), after.getAll(name)))

const isPromise = <T>(value: unknown): value is Promise<T> => !!value && typeof (value as Promise<T>).then === 'function'

/** GGary submission policy. React owns event delivery; no DOM event bridge. */
export function createFormWorkflow(form: HTMLFormElement, machine: Machine<FormState, FormEvent>, options: () => AttachFormOptions) {
  const doc = form.ownerDocument
  let acceptedData: FormData | null = null
  let passing = false
  let pending = false
  let generation = 0
  let editTimer: ReturnType<typeof setTimeout> | undefined
  const editedNames = new Set<string>()
  let refresh: ReturnType<typeof setTimeout> | undefined

  /** After the fields have drawn their errors: read the summary off the page, and move the focus. */
  const settle = (moveFocus: boolean) => {
    clearTimeout(refresh)
    refresh = setTimeout(() => {
      const state = machine.getState()
      machine.send({ type: 'SUMMARY', items: summaryOf(form, state) })
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
    if (pending || machine.getState().status === 'submitting') {
      event.preventDefault()
      return
    }
    const submitter = event.submitter as HTMLElement | null
    cancelEdits()
    const data = new FormData(form, submitter)
    acceptedData = new FormData(form)
    // The browser's constraints: each invalid control hears `invalid`, and its field shows why.
    const nativeValid = form.checkValidity()
    let rules: ReturnType<typeof runRules>
    try { rules = runRules(data) } catch (error) {
      event.preventDefault()
      machine.send({ type: 'SUBMITTED', message: error instanceof Error ? error.message : String(error) })
      settle(true)
      return
    }
    const { onSubmit: send } = options()

    const decide = (errors: FormErrors) => {
      for (const name of Object.keys(errors)) ruleNames.add(name)
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
    pending = true
    const attempt = ++generation
    Promise.resolve(rules).then((errors) => {
      if (attempt !== generation) return
      pending = false
      if (!decide(errors)) return
      if (!send) {
        const button = submitter && 'form' in submitter ? submitter as HTMLButtonElement : undefined
        // Native submission reads the CURRENT DOM, unlike the callback's snapshot.
        // Restart validation if values changed while async rules were pending.
        if (!sameData(data, new FormData(form, button))) {
          form.requestSubmit(button)
          return
        }
        if (!form.checkValidity()) {
          machine.send({ type: 'INVALID', errors: {} })
          settle(true)
          return
        }
        machine.send({ type: 'SUBMITTED' })
        passing = true
        form.requestSubmit(button)
        return
      }
      machine.send({ type: 'SUBMITTING' })
      Promise.resolve()
        .then(() => attempt === generation ? send(data, event) : undefined)
        .then(
          (result) => {
            if (attempt !== generation) return
            machine.send({ type: 'SUBMITTED', errors: (result?.errors ?? {}) as Record<string, string>, message: result?.message ?? null })
            if (machine.getState().status === 'failed') settle(true)
          },
          (error) => {
            if (attempt !== generation) return
            machine.send({ type: 'SUBMITTED', message: error instanceof Error ? error.message : String(error) })
            settle(true)
          }
        )
    }).catch((error) => {
      if (attempt !== generation) return
      pending = false
      machine.send({ type: 'SUBMITTED', message: error instanceof Error ? error.message : String(error) })
      settle(true)
    })
  }

  /** An edit: that field's rule or server error goes; the rules run again once a submit has been tried. */
  const onEdit = (event: Event) => {
    const target = event.target as HTMLInputElement | null
    const name = target?.name
    if (name) scheduleEdit(name)
  }

  const edited = (names: string[]) => {
    const data = new FormData(form)
    const changed = names.filter(name => {
      if (!acceptedData) return true
      return !sameValues(acceptedData.getAll(name), data.getAll(name))
    })
    acceptedData = data
    if (changed.length === 0) return
    for (const name of changed) machine.send({ type: 'EDITED', name })
    const state = machine.getState()
    if (state.submitCount === 0) return
    let rules: ReturnType<typeof runRules>
    try { rules = runRules(data) } catch (error) {
      machine.send({ type: 'SUBMITTED', message: error instanceof Error ? error.message : String(error) })
      settle(false)
      return
    }
    if (isPromise(rules)) void rules.catch(() => {})
    if (!isPromise(rules)) machine.send({ type: 'RULES', errors: rules as Record<string, string>, names: [...ruleNames] })
    if (state.status === 'invalid' || state.status === 'failed') settle(false)
  }

  // Base primitives can fire input/change before React restores a refused edit.
  // One task later reads accepted DOM state and coalesces duplicate delivery.
  const scheduleEdit = (name: string) => {
    editedNames.add(name)
    if (editTimer !== undefined) return
    const current = generation
    editTimer = setTimeout(() => {
      editTimer = undefined
      const names = [...editedNames]
      editedNames.clear()
      if (current === generation) edited(names)
    }, 0)
  }

  const cancelEdits = () => { clearTimeout(editTimer); editTimer = undefined; editedNames.clear() }
  const onReset = () => {
    generation++
    acceptedData = null
    pending = false
    clearTimeout(refresh)
    cancelEdits()
    machine.send({ type: 'RESET' })
  }

  return {
    submit: onSubmit,
    edit: onEdit,
    reset: onReset,
    edited: scheduleEdit,
    dispose: () => { generation++; pending = false; clearTimeout(refresh); cancelEdits() },
  }
}
