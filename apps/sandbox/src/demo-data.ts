import type { ChipItem } from '@ggary/core/chip-group'
import type { SelectItem } from '@ggary/core/select'

export const frameworks: SelectItem[] = [
  { value: 'vanilla', label: 'Vanilla JS' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular (disabled)', disabled: true },
  { value: 'qwik', label: 'Qwik' },
  { value: 'astro', label: 'Astro' },
  { value: 'lit', label: 'Lit' },
  { value: 'preact', label: 'Preact' },
  { value: 'alpine', label: 'Alpine' },
  { value: 'htmx', label: 'htmx' },
]

export const tags: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Docs' },
  { value: 'devops', label: 'DevOps' },
  { value: 'legacy', label: 'Legacy (disabled)', disabled: true },
  { value: 'research', label: 'Research' },
  { value: 'infra', label: 'Infra' },
]

export const targets = [
  { href: '/index.html', label: 'vanilla', id: 'vanilla' },
  { href: '/react.html', label: 'react', id: 'react' },
  { href: '/svelte.html', label: 'svelte', id: 'svelte' },
]

/** Cycles light -> dark -> system. Proves the token layer is the only thing themes touch. */
export function installThemeToggle(button: HTMLElement): void {
  const modes = ['light', 'dark', 'system'] as const
  let index = 0
  const apply = () => {
    const mode = modes[index]
    if (mode === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', mode)
    button.textContent = `theme: ${mode}`
  }
  button.addEventListener('click', () => {
    index = (index + 1) % modes.length
    apply()
  })
  apply()
}
