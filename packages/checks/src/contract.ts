import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LARGE, type Pair, STEP, TEXT } from './define.ts'

const THRESHOLDS = { text: TEXT, large: LARGE, step: STEP } as const

export interface Contract {
  layers: string[]
  tokens: Record<string, string>
  runtime: Record<string, string>
  /**
   * What every theme promises through the public names. Kept in contract.json
   * beside the names it measures, so the contract is one piece of data: a pair
   * can never reference a name the contract does not define.
   */
  pairs: Pair[]
}

interface ContractFile extends Omit<Contract, 'pairs'> {
  pairs?: (Omit<Pair, 'min'> & { min: keyof typeof THRESHOLDS })[]
}

export function loadContract(workspaceRoot: string): Contract {
  const raw: ContractFile = JSON.parse(
    readFileSync(join(workspaceRoot, 'packages', 'structure', 'contract.json'), 'utf8')
  )
  const pairs = (raw.pairs ?? []).map((pair) => {
    if (!(pair.min in THRESHOLDS)) throw new Error(`contract pair "${pair.label}" has unknown min "${pair.min}"`)
    for (const name of [pair.fg, ...pair.bg]) {
      if (name.startsWith('--') && !(name in raw.tokens)) {
        throw new Error(`contract pair "${pair.label}" measures ${name}, which the contract does not define`)
      }
    }
    return { ...pair, min: THRESHOLDS[pair.min] }
  })
  return { layers: raw.layers, tokens: raw.tokens, runtime: raw.runtime, pairs }
}
