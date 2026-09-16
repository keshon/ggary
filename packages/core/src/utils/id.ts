let count = 0
/** Stable-per-instance ids. Adapters create one id and derive part ids from it. */
export const uid = (prefix = 'gg') => `${prefix}-${++count}`
