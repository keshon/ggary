/** Where a nightly run's time went, by module: six kinds of thing, so six series. */
export const runModules = [
  { label: 'Build', series: 1 as const, value: 7.4, text: '7.4 s' },
  { label: 'Unit tests', series: 2 as const, value: 18.2, text: '18.2 s' },
  { label: 'Browser tests', series: 3 as const, value: 11.5, text: '11.5 s' },
  { label: 'Lint', series: 4 as const, value: 2.1, text: '2.1 s' },
  { label: 'Type check', series: 5 as const, value: 4.6, text: '4.6 s' },
  { label: 'Upload', series: 6 as const, value: 1.2, text: '1.2 s' },
]
