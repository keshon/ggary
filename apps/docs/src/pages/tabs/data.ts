import type { TabItem } from '@ggary/core/tabs'

/** Views of one object's properties. */
export const properties: TabItem[] = [
  { value: 'geometry', label: 'Geometry' },
  { value: 'material', label: 'Material' },
  { value: 'scripts', label: 'Scripts' },
]

export const propertiesWithPhysics: TabItem[] = [...properties.slice(0, 2), { value: 'physics', label: 'Physics', disabled: true }, properties[2]]

export const panels: Record<string, string> = {
  geometry: '12 480 vertices, 6 240 polygons.',
  material: 'Standard PBR, two textures.',
  physics: 'A convex hull, a mass of 4.2 kg.',
  scripts: 'Two behaviours attached.',
}

/** An editor's open files. */
export const openFiles: TabItem[] = [
  { value: 'tokens.css', label: 'tokens.css', closable: true },
  { value: 'layout.css', label: 'layout.css', closable: true },
  { value: 'components.css', label: 'components.css', closable: true },
  { value: 'README.md', label: 'README.md', closable: true },
]

export const openFilesModified: TabItem[] = openFiles.map((file) => (file.value === 'layout.css' ? { ...file, modified: true } : file))
