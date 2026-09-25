import type { InputType } from '@ggary/core/input'

/** Every text-like type, each with the words it would hold. */
export const inputTypes: { type: InputType; name: string; placeholder?: string; defaultValue?: string }[] = [
  { type: 'text', name: 'Full name', placeholder: 'Anna Petrova' },
  { type: 'email', name: 'Email', placeholder: 'you@example.com' },
  { type: 'password', name: 'Password', defaultValue: 'atlas-2041' },
  { type: 'search', name: 'Search runs', placeholder: 'worldgen' },
  { type: 'tel', name: 'Phone', placeholder: '+44 20 7946 0958' },
  { type: 'url', name: 'Website', placeholder: 'https://example.com' },
  { type: 'number', name: 'Agents', defaultValue: '7' },
  { type: 'date', name: 'Start date', defaultValue: '2026-09-25' },
  { type: 'time', name: 'Start time', defaultValue: '09:30' },
]
