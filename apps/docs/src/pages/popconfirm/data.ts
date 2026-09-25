/** An answer that never comes: the question stays busy. */
export const never = () => new Promise<void>(() => {})

/** An answer that fails, with the reason shown in the question. */
export const refused = () => Promise.reject(new Error('The lead is locked by another editor.'))

/**
 * Presses the confirm answer of the open question inside `host`, once, as the
 * page loads — so the busy and failed questions are on show without a click.
 */
export function pressConfirm(host: HTMLElement): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const buttons = host.querySelectorAll<HTMLButtonElement>('[data-scope="popconfirm"][data-part="actions"] button')
      buttons[buttons.length - 1]?.click()
    })
  )
}
