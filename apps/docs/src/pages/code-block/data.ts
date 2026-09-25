export const command = 'npm run deploy -- --preview feature/billing'

/** An excerpt from the middle of a file: its lines numbered from where it starts. */
export const generator = `export function terrain(size = 256, seed = Date.now()) {
  const noise = createNoise(seed)
  return generate(size, (x, y) => noise.fractal(x / size, y / size, { octaves: 6, persistence: 0.5, lacunarity: 2 }))
}`
