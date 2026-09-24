export { fieldsetAnatomy } from './fieldset.anatomy'
export type { FieldsetPart } from './fieldset.anatomy'
export { connect, fieldsetIds } from './fieldset.connect'
export type { FieldsetConnectOptions } from './fieldset.types'
// The machine is Field's: the same validation timing, for a group of controls.
export { createFieldMachine as createFieldsetMachine } from '../field/field.machine'
export type { FieldConfig as FieldsetConfig } from '../field/field.machine'
export type { FieldEvent as FieldsetEvent, FieldState as FieldsetState } from '../field/field.types'
export type { GroupContext } from '../../utils/group'
