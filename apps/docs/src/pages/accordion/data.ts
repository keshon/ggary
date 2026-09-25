/** A lead's card, as a sales rep reads it: Accordion's sections. */
export const leadSections = [
  { value: 'contact', label: 'Contact', description: 'Who to call, and when' },
  { value: 'deal', label: 'Deal', description: 'Stage, amount, next step' },
  { value: 'history', label: 'History' },
]

/** The same card with its archive, which nobody may open any more. */
export const withArchive = [...leadSections, { value: 'archive', label: 'Archived notes', description: 'Closed by the admin', disabled: true }]

export const leadSectionText: Record<string, string> = {
  contact: 'Aigul Safina, head of procurement. Mornings, Kazan time; she prefers a call to an email.',
  deal: 'Negotiation, 1.2M ₽. The next step is the revised offer, due Friday.',
  history: 'First contact at the Innoprom fair in July; two demos since, the second with their IT lead.',
  archive: '',
}

/** The contact section, as pairs. */
export const contactFacts = [
  { label: 'Name', value: 'Aigul Safina' },
  { label: 'Role', value: 'Head of procurement' },
  { label: 'Phone', value: '+7 917 555-01-24' },
  { label: 'Best time', value: 'Mornings, Kazan time' },
]
