/** A lead's tags: the multiple combobox's options. */
export const tags = ['Enterprise', 'Renewal', 'Partner', 'Trial', 'Education', 'Government', 'Nonprofit', 'Startup', 'Churn risk', 'Upsell'].map((tag) => ({
  value: tag.toLowerCase().replace(/\s+/g, '-'),
  label: tag,
}))
