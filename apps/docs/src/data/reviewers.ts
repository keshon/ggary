/** The people reviewing a change: List's rows, with every state a row can be in. */
export interface Reviewer {
  name: string
  line: string
  tone: import('@ggary/core').StatusTone
  word: string
  when: string
  current?: boolean
  disabled?: boolean
}
export const reviewers: Reviewer[] = [
  { name: 'Anna Petrova', line: 'Approved the budget change for the Q4 rollout', tone: 'ok', word: 'Approved', when: '2h' },
  { name: 'Mark Chen', line: 'Asked for changes on the migration plan — 2 comments', tone: 'warn', word: 'Changes', when: '5h' },
  { name: 'Leila Haddad', line: 'Reading the diff now', tone: 'running', word: 'Reviewing', when: 'now', current: true },
  { name: 'Tom Øberg', line: 'Left the team — can no longer review', tone: 'neutral', word: 'Away', when: '—', disabled: true },
]
export const moreReviewers: Reviewer[] = [
  { name: 'Priya Nair', line: 'Not started', tone: 'neutral', word: 'Waiting', when: '—' },
  { name: 'Jonas Weber', line: 'Approved with one nit', tone: 'ok', word: 'Approved', when: '1d' },
]
/** "Show more" as a server would answer it: a moment later. */
export const reviewersLater = () => new Promise<Reviewer[]>((resolve) => setTimeout(() => resolve(moreReviewers), 900))
