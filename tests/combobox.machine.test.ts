import { afterEach, describe, expect, it, vi } from 'vitest'
import { attachComboboxSource, connect, createComboboxMachine, filterItems, type ComboboxItem } from '../packages/core/src/components/combobox'

/**
 * The combobox with no DOM: which options a query finds and in what order,
 * the highlight, choosing one and several, the field going back to the choice,
 * and a server asked at the right moments and no more.
 */

const managers: ComboboxItem[] = [
  { value: 'alexey', label: 'Alexey Kuznetsov', description: 'Moscow' },
  { value: 'daria', label: 'Daria Morozova', description: 'Kazan' },
  { value: 'nikita', label: 'Nikita Smirnov', description: 'Moscow' },
  { value: 'polina', label: 'Polina Volkova', description: 'Samara', disabled: true },
  { value: 'roman', label: 'Roman Titov', description: 'Kazan' },
  { value: 'fyodor', label: 'Фёдор Ёлкин', description: 'Пермь' },
]

const same = (props: Record<string, unknown>) => props

describe('matching', () => {
  it('ranks a label that starts with the query first, then a word, then anywhere — description included', () => {
    expect(filterItems(managers, 'mo', 10).items.map((item) => item.value)).toEqual(['daria', 'alexey', 'nikita'])
    expect(filterItems(managers, 'kazan', 10).items.map((item) => item.value)).toEqual(['daria', 'roman'])
  })

  it('ignores case and accents, and ё is е', () => {
    expect(filterItems(managers, 'федор елкин', 10).items.map((item) => item.value)).toEqual(['fyodor'])
  })

  it('draws only as many as the limit, and says how many there were', () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ value: `c${i}`, label: `Company ${i}` }))
    expect(filterItems(many, 'company', 50)).toMatchObject({ total: 300 })
    expect(filterItems(many, 'company', 50).items).toHaveLength(50)
  })
})

describe('one value', () => {
  const combobox = (config: Partial<Parameters<typeof createComboboxMachine>[0]> = {}) => {
    const changes: string[][] = []
    const machine = createComboboxMachine({ id: 'c', items: managers, onValueChange: (value) => changes.push(value), ...config })
    const api = () => connect(machine.getState(), machine.send, same, { locale: 'en-US' })
    return { machine, api, changes }
  }

  it('typing opens the list on the best match; Enter chooses it and the field shows its label', () => {
    const { machine, api, changes } = combobox()
    machine.send({ type: 'INPUT', text: 'rom' })
    expect(api().open).toBe(true)
    expect(api().items.map((item) => item.value)).toEqual(['roman'])
    expect(api().inputProps['aria-activedescendant']).toBe('c-item-0')
    machine.send({ type: 'SELECT' })
    expect(changes).toEqual([['roman']])
    expect(api().open).toBe(false)
    expect(api().inputValue).toBe('Roman Titov')
  })

  it('leaving without choosing puts the field back to the choice', () => {
    const { machine, api } = combobox({ defaultValue: 'daria' })
    expect(api().inputValue).toBe('Daria Morozova')
    machine.send({ type: 'INPUT', text: 'nik' })
    expect(api().inputValue).toBe('nik')
    ;(api().inputProps.onBlur as () => void)()
    expect(api().inputValue).toBe('Daria Morozova')
    expect(machine.getState().value).toEqual(['daria'])
  })

  it('arrows skip what is disabled and stop at the ends; the list opens on the chosen one', () => {
    const { machine } = combobox({ defaultValue: 'nikita' })
    machine.send({ type: 'OPEN' })
    expect(machine.getState().highlightedIndex).toBe(2)
    machine.send({ type: 'HIGHLIGHT_MOVE', step: 1 })
    expect(machine.getState().highlightedIndex).toBe(4)
    machine.send({ type: 'HIGHLIGHT_MOVE', step: 5 })
    expect(machine.getState().highlightedIndex).toBe(5)
  })

  it('Escape closes an open list, and on a closed one empties the field', () => {
    const { machine, api, changes } = combobox({ defaultValue: 'daria' })
    const escape = () => {
      const event = { key: 'Escape', preventDefault() {}, stopPropagation() {} }
      ;(api().inputProps.onKeyDown as (e: unknown) => void)(event)
    }
    machine.send({ type: 'INPUT', text: 'x' })
    escape()
    expect(api().open).toBe(false)
    expect(api().inputValue).toBe('Daria Morozova')
    escape()
    expect(changes).toEqual([[]])
    expect(api().inputValue).toBe('')
  })

  it('controlled: a choice is asked for, not made, until the owner answers', () => {
    const { machine, api, changes } = combobox({ value: 'daria' })
    machine.send({ type: 'INPUT', text: 'rom' })
    machine.send({ type: 'SELECT' })
    expect(changes).toEqual([['roman']])
    expect(machine.getState().value).toEqual(['daria'])
    machine.send({ type: 'SYNC_VALUE', value: 'roman' })
    expect(api().inputValue).toBe('Roman Titov')
  })

  it('says what it found, for a screen reader', () => {
    const { machine, api } = combobox()
    machine.send({ type: 'INPUT', text: 'mo' })
    expect(api().statusText).toBe('3 results')
    machine.send({ type: 'INPUT', text: 'zzz' })
    expect(api().statusText).toBe('No matches')
    expect(api().inputProps['aria-activedescendant']).toBeUndefined()
  })
})

describe('several values', () => {
  it('keeps the list open between picks, takes a chosen one back, and Backspace removes the last', () => {
    const changes: string[][] = []
    const machine = createComboboxMachine({ id: 'c', items: managers, multiple: true, onValueChange: (value) => changes.push(value) })
    machine.send({ type: 'INPUT', text: 'dar' })
    machine.send({ type: 'SELECT' })
    expect(machine.getState()).toMatchObject({ open: true, query: '', value: ['daria'] })
    machine.send({ type: 'INPUT', text: 'rom' })
    machine.send({ type: 'SELECT' })
    expect(machine.getState().value).toEqual(['daria', 'roman'])
    // Choosing a chosen one again takes it back.
    machine.send({ type: 'SELECT', index: 1 })
    expect(machine.getState().value).toEqual(['roman'])
    machine.send({ type: 'REMOVE_LAST' })
    expect(machine.getState().value).toEqual([])
    const api = connect(machine.getState(), machine.send, same)
    expect(api.contentProps['aria-multiselectable']).toBe('true')
    expect(changes).toEqual([['daria'], ['daria', 'roman'], ['roman'], []])
  })

  it('a chip is removed by its button, which is named and not a tab stop', () => {
    const machine = createComboboxMachine({ id: 'c', items: managers, multiple: true, defaultValue: ['daria', 'nikita'] })
    const api = connect(machine.getState(), machine.send, same)
    const chip = api.getChipProps(api.selectedItems[0])
    expect(chip.removeProps).toMatchObject({ 'aria-label': 'Remove Daria Morozova', tabIndex: -1 })
    ;(chip.removeProps.onClick as () => void)()
    expect(machine.getState().value).toEqual(['nikita'])
  })
})

describe('a server list', () => {
  afterEach(() => vi.useRealTimers())

  it('asks when the typing settles, drops the answer to an older question, and keeps the last answer shown meanwhile', async () => {
    vi.useFakeTimers()
    const asked: string[] = []
    const answers = new Map<string, (items: ComboboxItem[]) => void>()
    const load = (query: string) => {
      asked.push(query)
      return new Promise<ComboboxItem[]>((resolve) => answers.set(query, resolve))
    }
    const machine = createComboboxMachine({ id: 'c' })
    const stop = attachComboboxSource(machine, load, { debounce: 200 })

    machine.send({ type: 'OPEN' })
    await vi.advanceTimersByTimeAsync(0)
    expect(asked).toEqual([''])
    answers.get('')!(managers.slice(0, 2))
    await vi.advanceTimersByTimeAsync(0)
    expect(machine.getState().items).toHaveLength(2)

    machine.send({ type: 'INPUT', text: 'r' })
    machine.send({ type: 'INPUT', text: 'ro' })
    machine.send({ type: 'INPUT', text: 'rom' })
    await vi.advanceTimersByTimeAsync(199)
    expect(asked).toEqual([''])
    await vi.advanceTimersByTimeAsync(1)
    expect(asked).toEqual(['', 'rom'])
    // Waiting: the last answer stays, marked.
    expect(connect(machine.getState(), machine.send, same).contentProps['data-stale']).toBe('')

    machine.send({ type: 'INPUT', text: 'roma' })
    await vi.advanceTimersByTimeAsync(200)
    answers.get('rom')!([{ value: 'late', label: 'Late answer' }])
    answers.get('roma')!([managers[4]])
    await vi.advanceTimersByTimeAsync(0)
    expect(machine.getState().items.map((item) => item.value)).toEqual(['roman'])
    expect(machine.getState().highlightedIndex).toBe(0)
    stop()
  })

  it('a failure says why, and is asked again on reopening, not on its own', async () => {
    vi.useFakeTimers()
    let calls = 0
    const machine = createComboboxMachine({ id: 'c' })
    attachComboboxSource(machine, () => {
      calls += 1
      return Promise.reject(new Error('offline'))
    })
    machine.send({ type: 'OPEN' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(calls).toBe(1)
    expect(connect(machine.getState(), machine.send, same).statusText).toBe('Could not search: offline')
    machine.send({ type: 'CLOSE' })
    machine.send({ type: 'OPEN' })
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toBe(2)
  })

  it('a chosen value keeps its label though the next answer no longer holds it', async () => {
    vi.useFakeTimers()
    const machine = createComboboxMachine({ id: 'c', multiple: true })
    attachComboboxSource(machine, async (query) => managers.filter((item) => item.label.toLowerCase().includes(query)), { debounce: 0 })
    machine.send({ type: 'INPUT', text: 'dar' })
    await vi.advanceTimersByTimeAsync(10)
    machine.send({ type: 'SELECT' })
    machine.send({ type: 'INPUT', text: 'rom' })
    await vi.advanceTimersByTimeAsync(10)
    expect(connect(machine.getState(), machine.send, same).selectedItems.map((item) => item.label)).toEqual(['Daria Morozova'])
  })
})

describe('creating an option', () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
  const combobox = (config: Partial<Parameters<typeof createComboboxMachine>[0]> = {}) => {
    const changes: string[][] = []
    const created: string[] = []
    const machine = createComboboxMachine({
      id: 'c',
      items: managers,
      onValueChange: (value) => changes.push(value),
      onCreate: (text) => {
        created.push(text)
        return { value: `new:${text}`, label: text }
      },
      ...config,
    })
    const labels = () => connect(machine.getState(), machine.send, same).items.map((item) => connect(machine.getState(), machine.send, same).labelOf(item))
    return { machine, send: machine.send, changes, created, labels, state: () => machine.getState() }
  }

  it('offers "Create …" at the end when what is typed matches no label exactly, highlighted when alone', () => {
    const { send, labels, state } = combobox()
    send({ type: 'INPUT', text: 'dar' })
    expect(labels()).toEqual(['Daria Morozova', 'Create “dar”'])
    expect(state().highlightedIndex).toBe(0)
    send({ type: 'INPUT', text: 'daria morozova' })
    expect(labels()).toEqual(['Daria Morozova'])
    send({ type: 'INPUT', text: 'Zinaida P.' })
    expect(labels()).toEqual(['Create “Zinaida P.”'])
    expect(state().highlightedIndex).toBe(0)
    send({ type: 'INPUT', text: '   ' })
    expect(labels().some((label) => label.startsWith('Create'))).toBe(false)
  })

  it('Enter on it asks the owner, and the option it answers with is chosen', async () => {
    const { send, changes, created, state } = combobox()
    send({ type: 'INPUT', text: 'Zinaida P.' })
    send({ type: 'SELECT' })
    expect(state().creating).toBe('Zinaida P.')
    await tick()
    await tick()
    expect(created).toEqual(['Zinaida P.'])
    expect(changes).toEqual([['new:Zinaida P.']])
    expect(state()).toMatchObject({ open: false, creating: null, selected: [{ value: 'new:Zinaida P.', label: 'Zinaida P.' }] })
  })

  it('several values: the new one joins the chips and the field empties for the next', async () => {
    const { send, changes, state } = combobox({ multiple: true, defaultValue: ['roman'] })
    send({ type: 'INPUT', text: 'Zinaida P.' })
    send({ type: 'SELECT' })
    await tick()
    await tick()
    expect(changes).toEqual([['roman', 'new:Zinaida P.']])
    expect(state()).toMatchObject({ query: '', open: true })
  })

  it('a refusal chooses nothing and says why; nothing returned makes the text its own value', async () => {
    const refused = combobox({ onCreate: () => Promise.reject(new Error('names are unique')) })
    refused.send({ type: 'INPUT', text: 'Zinaida P.' })
    refused.send({ type: 'SELECT' })
    await tick()
    await tick()
    expect(refused.changes).toEqual([])
    expect(connect(refused.state(), refused.send, same).statusText).toBe('Could not create: names are unique')
    const plain = combobox({ onCreate: () => undefined })
    plain.send({ type: 'INPUT', text: 'Zinaida P.' })
    plain.send({ type: 'SELECT' })
    await tick()
    await tick()
    expect(plain.changes).toEqual([['Zinaida P.']])
  })

  it('without onCreate there is no such option', () => {
    const machine = createComboboxMachine({ id: 'c', items: managers })
    machine.send({ type: 'INPUT', text: 'Zinaida' })
    expect(machine.getState().items).toEqual([])
  })
})
