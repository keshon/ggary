import { createAnatomy } from '../../types'

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

export const formSummaryAnatomy = createAnatomy('form-summary', ['root', 'title', 'message', 'list', 'item', 'link'] as const)
export type FormSummaryPart = (typeof formSummaryAnatomy.parts)[number]

export const formAnatomy = createAnatomy('form', ['root', 'field-error'] as const)
