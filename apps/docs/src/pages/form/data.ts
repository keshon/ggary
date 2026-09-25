import type { FormErrors, FormSubmitResult } from '@ggary/core/form'

/** What the browser cannot check about a new deal. */
export function dealRules(data: FormData): FormErrors {
  const stage = String(data.get('stage') ?? '')
  return {
    company: data.get('company') ? null : 'Choose the company',
    stage: stage ? null : 'Choose a stage',
    amount: (stage === 'offer' || stage === 'won') && !data.get('amount') ? 'An offer needs an amount' : null,
    due: data.get('due') ? null : 'Choose the day it should close by',
  }
}

/** The pretend server: a title that exists already is refused, with a message for the whole form. */
export async function saveDeal(data: FormData): Promise<FormSubmitResult | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const title = String(data.get('title') ?? '').trim()
  if (['annual licence', 'onboarding pilot'].includes(title.toLowerCase())) {
    return { errors: { title: 'A deal with this title exists' }, message: 'The deal was not saved.' }
  }
  return undefined
}

/**
 * The Form inside `host`, submitted as the page loads, so its errors are on
 * show. Only once the kit has taken the form over (it turns the browser's own
 * checks off): a submit before that would be the browser's, and would leave the page.
 */
const submitted = new WeakSet<HTMLElement>()
export function submitOnLoad(host: HTMLElement | null) {
  if (!host || submitted.has(host)) return
  submitted.add(host)
  const attempt = (tries: number) => {
    const form = host.querySelector('form')
    if (form?.noValidate) form.requestSubmit()
    else if (tries > 0) requestAnimationFrame(() => attempt(tries - 1))
  }
  requestAnimationFrame(() => attempt(10))
}
