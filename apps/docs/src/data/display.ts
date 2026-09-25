import type { StatusTone } from '@ggary/core'

/** The kit's five tones, in the order every Display page shows them. */
export const TONES: readonly StatusTone[] = ['neutral', 'running', 'ok', 'warn', 'error']

/** The sizes Avatar, Spinner, Progress, Meter and Ring share. */
export const SIZES = ['sm', 'md', 'lg'] as const

/** A portrait, drawn inline so the page needs no network. */
export const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c7b8f5"/><stop offset="1" stop-color="#5b4bb7"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#efeafd"/><path d="M18 100c4-22 18-32 32-32s28 10 32 32z" fill="#efeafd"/></svg>')}`

/** A picture that cannot load: the initials stay. */
export const brokenPicture = 'data:image/png;base64,AAAA'

/** The people in an avatar group, the same on every page. */
export const people = [{ name: 'Ada Lovelace' }, { name: 'Alan Turing' }, { name: 'Grace Hopper' }, { name: 'Edsger Dijkstra' }, { name: 'Barbara Liskov' }]

/** The same group with a picture for two of them. */
export const peopleWithPictures = people.map((person, index) => (index === 0 || index === 2 ? { ...person, src: portrait } : person))
