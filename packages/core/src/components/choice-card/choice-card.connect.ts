import type { Dict, Normalizer } from '../../types'
import { choice } from '../../utils/choice'
import { choiceGroupFrame } from '../../utils/choice-group'
import type { GroupContext } from '../../utils/group'
import { checkboxAnatomy } from '../checkbox/checkbox.anatomy'
import { radioAnatomy } from '../radio-group/radio-group.anatomy'
import { choiceCardAnatomy, choiceCardGroupAnatomy } from './choice-card.anatomy'
import type { ChoiceCardGroupProps, ChoiceCardItem } from './choice-card.types'

export interface ChoiceCardGroupConnectOptions {
  /** A string for radios, an array for checkboxes — the group's own shape. */
  onValueChange?: (value: any) => void
  nativeChecked?: boolean
  /** React restores a controlled input itself; see utils/choice. */
  restoresChecked?: boolean
  group?: GroupContext
}

/**
 * The option with a heading and its consequences, for a choice that costs
 * something: "in parallel — up to 12 agents, more tokens, no guaranteed order".
 *
 * Inside every card is a real checkbox or radio, so the keyboard, the
 * announcement of state and the part in a form are the platform's, as in
 * RadioGroup — a card is a bigger tap target for the same control, not a
 * widget of its own. The heading and the description are inside the <label>,
 * so both are the option's accessible name; an aria-label here would replace
 * them and hide exactly what the user needs in order to choose.
 */
export function connect<T = Dict>(props: ChoiceCardGroupProps, normalize: Normalizer<T>, options: ChoiceCardGroupConnectOptions = {}) {
  const { id, items, type = 'radio', label, orientation, disabled, required, invalid } = props
  const name = props.name || id
  const multiple = type === 'checkbox'
  const selection: string[] = multiple
    ? Array.isArray(props.value)
      ? props.value
      : []
    : typeof props.value === 'string'
      ? [props.value]
      : []

  const frame = choiceGroupFrame(choiceCardGroupAnatomy, {
    id,
    // Checkboxes are not one value, so their group is a plain group.
    role: multiple ? 'group' : 'radiogroup',
    label, orientation, disabled, required, invalid,
    group: options.group,
  })

  const toggle = (item: ChoiceCardItem, checked: boolean) =>
    items.filter((each) => (each.value === item.value ? checked : selection.includes(each.value))).map((each) => each.value)

  // The box is the plain control's, drawn by the theme's checkbox.css and
  // radio-group.css; the card adds the frame and the words around it.
  const boxAnatomy = multiple ? checkboxAnatomy : radioAnatomy

  const getItemProps = (item: ChoiceCardItem, index: number) => {
    const parts = choice(boxAnatomy, {
      type,
      id: frame.ids.item(index),
      name,
      value: item.value,
      checked: selection.includes(item.value),
      disabled: frame.disabled || item.disabled,
      // A radio group needs `required` on its inputs; one required checkbox
      // would mean "this one", not "at least one", so it is left off.
      required: multiple ? undefined : frame.required,
      invalid: frame.invalid,
      nativeChecked: options.nativeChecked,
      restoresChecked: options.restoresChecked,
      onCheckedChange: options.onValueChange
        ? (checked) => options.onValueChange!(multiple ? toggle(item, checked) : item.value)
        : undefined,
    })
    return {
      // The root is the card's own; everything inside it belongs to the control.
      rootProps: normalize({ ...choiceCardAnatomy.attrs('root'), ...parts.stateAttrs }),
      controlProps: normalize(parts.controlProps),
      inputProps: normalize(parts.inputProps),
      indicatorProps: normalize({
        ...boxAnatomy.attrs('indicator'),
        ...parts.stateAttrs,
        'aria-hidden': 'true',
        'data-icon': multiple ? 'check' : undefined,
      }),
      bodyProps: normalize({ ...choiceCardAnatomy.attrs('body'), ...parts.stateAttrs }),
      titleProps: normalize({ ...choiceCardAnatomy.attrs('title'), ...parts.stateAttrs }),
      descriptionProps: normalize({ ...choiceCardAnatomy.attrs('description'), ...parts.stateAttrs }),
      showDescription: Boolean(item.description),
    }
  }

  return {
    ids: frame.ids,
    name,
    type,
    items,
    value: multiple ? selection : (selection[0] ?? null),
    getItemProps,
    rootProps: normalize(frame.rootProps),
    labelProps: normalize(frame.labelProps),
    listProps: normalize(frame.listProps),
  }
}
