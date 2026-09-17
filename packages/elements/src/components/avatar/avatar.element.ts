import { connect, connectGroup, type AvatarImageStatus, type AvatarPerson, type AvatarSize } from '@ggary/core/avatar'
import { domNormalizer } from '@ggary/core'
import { h, reconcileChildren, spread } from '../../spread'

/**
 * <gg-avatar name="Ada Lovelace" src="/ada.png" size="sm"></gg-avatar>
 *
 * The host is the avatar. Attributes: name, src, size, decorative.
 */
export class GgAvatarElement extends HTMLElement {
  static observedAttributes = ['name', 'src', 'size', 'decorative']

  #fallback: HTMLSpanElement | null = null
  #image: HTMLImageElement | null = null
  #status: AvatarImageStatus = 'none'

  connectedCallback(): void {
    if (!this.#fallback) {
      this.#fallback = h('span')
      this.#image = h('img')
      this.#image.addEventListener('load', () => this.#setStatus('loaded'))
      this.#image.addEventListener('error', () => this.#setStatus('error'))
      this.append(this.#fallback)
      this.#status = this.getAttribute('src') ? 'loading' : 'none'
    }
    this.#render()
  }

  attributeChangedCallback(name: string): void {
    if (name === 'src') this.#status = this.getAttribute('src') ? 'loading' : 'none'
    if (this.isConnected) this.#render()
  }

  #setStatus(status: AvatarImageStatus): void {
    this.#status = status
    this.#render()
  }

  #render(): void {
    if (!this.#fallback || !this.#image) return
    const api = connect(
      {
        name: this.getAttribute('name') ?? '',
        src: this.getAttribute('src') ?? undefined,
        size: (this.getAttribute('size') as AvatarSize) ?? undefined,
        decorative: this.hasAttribute('decorative'),
        status: this.#status,
      },
      domNormalizer
    )
    spread(this, api.rootProps, 'avatar')
    spread(this.#fallback, api.fallbackProps)
    this.#fallback.textContent = api.initials
    if (api.showImage) {
      spread(this.#image, api.imageProps)
      if (!this.#image.isConnected) this.append(this.#image)
    } else {
      this.#image.remove()
    }
  }
}

/**
 * <gg-avatar-group label="7 participants" max="3"></gg-avatar-group>
 * group.people = [{ name: 'Ada Lovelace', src: '/ada.png' }, ...]
 *
 * People are data: the `people` property, or a JSON `people` attribute.
 * Attributes: label, max, size.
 */
export class GgAvatarGroupElement extends HTMLElement {
  static observedAttributes = ['label', 'max', 'size', 'people']

  #people: AvatarPerson[] | null = null
  #avatars = new Map<string, GgAvatarElement>()
  #more: HTMLSpanElement | null = null

  get people(): AvatarPerson[] {
    return this.#people ?? this.#parsePeople()
  }
  set people(next: AvatarPerson[]) {
    this.#people = next ?? []
    if (this.isConnected) this.#render()
  }

  connectedCallback(): void {
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #parsePeople(): AvatarPerson[] {
    const raw = this.getAttribute('people')
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      console.warn('<gg-avatar-group> has an invalid people attribute', this)
      return []
    }
  }

  #render(): void {
    const max = this.getAttribute('max')
    const size = (this.getAttribute('size') as AvatarSize) ?? undefined
    const api = connectGroup(
      { label: this.getAttribute('label') ?? '', people: this.people, max: max === null ? undefined : Number(max), size },
      domNormalizer
    )
    spread(this, api.groupProps, 'avatar-group')
    const avatars = new Map<string, GgAvatarElement>()
    const children: Element[] = api.shown.map((person, index) => {
      const key = `${person.name}-${index}`
      const avatar = this.#avatars.get(key) ?? (document.createElement('gg-avatar') as GgAvatarElement)
      avatars.set(key, avatar)
      avatar.setAttribute('name', person.name)
      if (person.src) avatar.setAttribute('src', person.src)
      else avatar.removeAttribute('src')
      if (size) avatar.setAttribute('size', size)
      else avatar.removeAttribute('size')
      return avatar
    })
    this.#avatars = avatars
    if (api.hidden > 0) {
      this.#more ??= h('span')
      spread(this.#more, api.moreProps)
      this.#more.textContent = api.moreText
      children.push(this.#more)
    }
    reconcileChildren(this, children)
  }
}

if (!customElements.get('gg-avatar')) customElements.define('gg-avatar', GgAvatarElement)
if (!customElements.get('gg-avatar-group')) customElements.define('gg-avatar-group', GgAvatarGroupElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-avatar': GgAvatarElement
    'gg-avatar-group': GgAvatarGroupElement
  }
}
