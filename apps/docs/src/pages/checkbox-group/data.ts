import type { CheckboxItem } from '@ggary/core/checkbox-group'
import { notifyItems } from '../../data/inputs-basic'

/** The options, with one that cannot be turned off. */
export const withLocked: CheckboxItem[] = [...notifyItems, { value: 'security', label: 'Security alerts', disabled: true }]
