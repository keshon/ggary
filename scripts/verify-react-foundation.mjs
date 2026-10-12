import { spawnSync } from 'node:child_process'
const checks = [
  ['run', 'typecheck'],
  ['run', 'test:fast', '--', '--maxWorkers', '1'],
  ['run', 'check:themes'],
  ['run', 'build', '-w', '@ggary/docs'],
  ['run', 'audit:react-foundation'],
  ['run', 'smoke:react-packages'],
]
if (!process.env.npm_execpath) throw new Error('Run through npm run verify:react')
for (const args of checks) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
