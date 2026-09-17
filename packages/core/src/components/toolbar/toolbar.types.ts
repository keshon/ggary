export interface ToolbarProps {
  /**
   * Naming the strip makes it a `toolbar`: one tab stop, and the arrow keys
   * move between the tools. Without a name it stays a row of ordinary buttons,
   * each with its own tab stop — the role promises the keyboard behaviour, so
   * it is only taken when the behaviour is there.
   */
  label?: string
  orientation?: 'horizontal' | 'vertical'
}
