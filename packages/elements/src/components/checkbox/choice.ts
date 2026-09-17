import { domNormalizer, type Dict } from '@ggary/core'
import { h, spread } from '../../spread'

export interface ChoiceDom {
  input: HTMLInputElement
  root: HTMLLabelElement
  control: HTMLSpanElement
  /** The indicator (checkbox, radio) or the thumb (switch). */
  drawn: HTMLSpanElement
  /** Null when the markup had no text: then the input needs an aria-label. */
  label: HTMLSpanElement | null
}

/**
 * Give a native checkbox or radio the choice anatomy, keeping the author's
 * markup where it can:
 *
 *   <label><input type="checkbox" name="terms"> I agree</label>
 *
 * The <label> that already wraps the input becomes the root; without one, a
 * label is created inside `container` around everything in it. The input moves
 * into a control span beside the drawn part, and the text is wrapped in a label
 * span. Runs once per input: the moved nodes are the element's from then on.
 */
export function buildChoice(container: Element, input: HTMLInputElement): ChoiceDom {
  let root = input.closest('label')
  if (!root || !container.contains(root)) {
    root = h('label')
    root.append(...Array.from(container.childNodes))
    container.append(root)
  }

  const control = h('span')
  const drawn = h('span')
  input.before(control)
  control.append(input, drawn)

  const text = Array.from(root.childNodes).filter((node) => node !== control)
  let label: HTMLSpanElement | null = null
  if (text.some((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent?.trim())) {
    label = h('span')
    label.append(...text)
    // Leading whitespace in the markup ("<input> I agree") is not part of the name.
    if (label.firstChild?.nodeType === Node.TEXT_NODE) label.firstChild.textContent = label.firstChild.textContent!.trimStart()
    root.append(label)
  } else {
    text.forEach((node) => node.remove())
  }
  root.prepend(control)

  return { input, root, control, drawn, label }
}

/** The normalized parts of a choice control, from any of the three connects. */
export interface ChoiceParts {
  rootProps: ReturnType<typeof domNormalizer>
  controlProps: ReturnType<typeof domNormalizer>
  inputProps: ReturnType<typeof domNormalizer>
  labelProps: ReturnType<typeof domNormalizer>
}

export function renderChoice(dom: ChoiceDom, parts: ChoiceParts, drawnProps: ReturnType<typeof domNormalizer>) {
  spread(dom.root, parts.rootProps)
  spread(dom.control, parts.controlProps)
  spread(dom.input, parts.inputProps)
  spread(dom.drawn, drawnProps)
  if (dom.label) spread(dom.label, parts.labelProps)
}

/** The props a <gg-field> pushes into a choice element inside it. */
export interface FieldConsumer {
  applyField(props: Dict | null): void
}
