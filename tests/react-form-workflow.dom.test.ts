import { describe, expect, it, vi } from 'vitest'
import { createFormMachine, type FormErrors } from '@ggary/core/form'
import { createFormWorkflow } from '../packages/react/src/components/form/form-workflow'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const setup = (options: Parameters<typeof createFormWorkflow>[2]) => {
  const form = document.createElement('form')
  const machine = createFormMachine({ id: 'workflow-test' })
  const workflow = createFormWorkflow(form, machine, options)
  const submit = () => workflow.submit(new SubmitEvent('submit', { cancelable: true }))
  return { machine, workflow, submit }
}

describe('React form submission lifecycle', () => {
  it('blocks repeat submission while async validation is pending', async () => {
    const rules = deferred<FormErrors>()
    const validate = vi.fn(() => rules.promise)
    const onSubmit = vi.fn()
    const { submit, workflow } = setup(() => ({ validate, onSubmit }))
    submit(); submit()
    expect(validate).toHaveBeenCalledTimes(1)
    rules.resolve({})
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    workflow.dispose()
  })

  it('reset ignores an outstanding validation result and permits a new attempt', async () => {
    const rules = deferred<FormErrors>()
    const onSubmit = vi.fn()
    const { submit, workflow, machine } = setup(() => ({ validate: () => rules.promise, onSubmit }))
    submit(); workflow.reset(); rules.resolve({})
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(machine.getState().status).toBe('idle')
    workflow.dispose()
  })

  it('reset ignores late server errors', async () => {
    const response = deferred<{ errors: Record<string, string> }>()
    const onSubmit = vi.fn(() => response.promise)
    const { submit, workflow, machine } = setup(() => ({ onSubmit }))
    submit()
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    workflow.reset()
    response.resolve({ errors: { email: 'Too late' } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(machine.getState().status).toBe('idle')
    expect(machine.getState().errors).toEqual({})
    workflow.dispose()
  })

  it('a rejected validator becomes a visible failure and allows retry', async () => {
    const validate = vi.fn().mockRejectedValueOnce(new Error('Unavailable')).mockReturnValue({})
    const onSubmit = vi.fn()
    const { submit, workflow, machine } = setup(() => ({ validate, onSubmit }))
    submit()
    await vi.waitFor(() => expect(machine.getState().message).toBe('Unavailable'))
    submit()
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    workflow.dispose()
  })
  it('a synchronous validator exception becomes a form failure and permits retry', async () => {
    const validate = vi.fn().mockImplementationOnce(() => { throw new Error('Rule unavailable') }).mockReturnValue({})
    const onSubmit = vi.fn()
    const { submit, workflow, machine } = setup(() => ({ validate, onSubmit }))
    expect(() => submit()).not.toThrow()
    expect(machine.getState().message).toBe('Rule unavailable')
    submit()
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    workflow.dispose()
  })

  it('revalidates changed values before native submission after async rules', async () => {
    const first = deferred<FormErrors>(), second = deferred<FormErrors>()
    const validate = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const form = document.createElement('form')
    const nativeMachine = createFormMachine({ id: 'native-test' })
    const nativeWorkflow = createFormWorkflow(form, nativeMachine, () => ({ validate }))
    const input = document.createElement('input'); input.name = 'code'; input.value = 'old'; form.append(input)
    const events: SubmitEvent[] = []
    const send = () => {
      const event = new SubmitEvent('submit', { cancelable: true }); events.push(event); nativeWorkflow.submit(event)
    }
    const request = vi.spyOn(form, 'requestSubmit').mockImplementation(send)
    send(); input.value = 'new'; first.resolve({})
    await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(2))
    expect((validate.mock.calls[1][0] as FormData).get('code')).toBe('new')
    expect(events.every(event => event.defaultPrevented)).toBe(true)
    second.resolve({})
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    expect(events.at(-1)!.defaultPrevented).toBe(false)
    expect(nativeMachine.getState().status).toBe('submitted')
    nativeWorkflow.dispose()
  })

  it('checks changed native constraints again after async rules resolve', async () => {
    const rules = deferred<FormErrors>()
    const form = document.createElement('form')
    const input = document.createElement('input'); input.name = 'code'; form.append(input)
    const machine = createFormMachine({ id: 'native-constraint-test' })
    const workflow = createFormWorkflow(form, machine, () => ({ validate: () => rules.promise }))
    const request = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
    workflow.submit(new SubmitEvent('submit', { cancelable: true }))
    input.required = true
    rules.resolve({})
    await vi.waitFor(() => expect(machine.getState().status).toBe('invalid'))
    expect(request).not.toHaveBeenCalled()
    workflow.dispose()
  })

  it('does not restart async native validation for an untouched optional file input', async () => {
    const rules = deferred<FormErrors>()
    const form = document.createElement('form')
    const input = document.createElement('input'); input.name = 'attachment'; input.type = 'file'; form.append(input)
    const machine = createFormMachine({ id: 'native-file-test' })
    const validate = vi.fn(() => rules.promise)
    const workflow = createFormWorkflow(form, machine, () => ({ validate }))
    const request = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
    workflow.submit(new SubmitEvent('submit', { cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 20))
    rules.resolve({})
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce())
    expect(validate).toHaveBeenCalledOnce()
    expect(machine.getState().status).toBe('submitted')
    workflow.dispose()
  })

})
