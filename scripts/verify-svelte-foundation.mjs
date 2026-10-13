import { spawnSync } from 'node:child_process'
if (!process.env.npm_execpath) throw new Error('Run through npm run verify:svelte')
for (const args of [
 ['run','typecheck'], ['run','test:fast','--','--maxWorkers','1'],
 ['run','check:themes'], ['run','build','-w','@ggary/docs'],
 ['run','test:svelte-pilot:browser'], ['run','smoke:svelte-packages'],
]) {
 const result=spawnSync(process.execPath,[process.env.npm_execpath,...args],{stdio:'inherit'})
 if(result.error)throw result.error
 if(result.status!==0)process.exit(result.status ?? 1)
}
