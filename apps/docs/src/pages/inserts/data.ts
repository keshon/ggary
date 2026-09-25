/** A monitor's notification template: the values a message can carry. */
export const variables = [
  { value: '{{name}}', hint: 'The name of the monitor' },
  { value: '{{target}}', hint: 'The address checked' },
  { value: '{{status}}', hint: 'The state' },
  { value: '{{error}}', hint: 'The text of the error' },
  { value: '{{time}}', hint: 'The time of the event' },
]

/** The same values under names a person reads. */
export const named = [
  { value: '{{name}}', label: 'Monitor' },
  { value: '{{target}}', label: 'Address' },
  { value: '{{status}}', label: 'State' },
  { value: '{{time}}', label: 'Time' },
]

export const template = '{{name}} has failed at {{time}}\n'
export const subject = '[{{status}}] {{name}}'
