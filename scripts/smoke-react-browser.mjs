import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright'

export async function checkConsumerBrowser(consumer, stage) {
  const require = createRequire(join(consumer, 'package.json'))
  const { preview } = await import(pathToFileURL(require.resolve('vite')).href)
  const server = await preview({ root: consumer, preview: { host: '127.0.0.1', port: 0, open: false } })
  let browser
  try {
    browser = await chromium.launch({ channel: process.env.GG_BROWSER_CHANNEL ?? 'chrome', headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
    await page.goto(server.resolvedUrls.local[0])
    const submit = page.getByRole('button', { name: 'Submit', exact: true })
    await submit.click()
    assert.equal(await page.getByLabel('Submitted name').textContent(), 'none')
    await page.getByRole('region').waitFor()
    assert.equal(await page.getByRole('region').evaluate(el => el === document.activeElement), true)
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Ada')
    await submit.click()
    await page.waitForFunction(() => document.querySelector('output')?.textContent === 'Ada')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    assert.equal(await page.getByRole('textbox', { name: 'Name', exact: true }).inputValue(), '')
    await page.getByRole('button', { name: 'Save', exact: true }).press('ArrowRight')
    assert.equal(await page.getByRole('button', { name: 'Undo', exact: true }).evaluate(el => el === document.activeElement), true)
    await page.getByRole('button', { name: 'Open settings', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Settings' })
    await dialog.waitFor()
    await dialog.getByRole('combobox', { name: 'Stage' }).press('Enter')
    await page.getByRole('option', { name: 'Done', exact: true }).click()
    assert.equal(await dialog.getByRole('combobox', { name: 'Stage' }).textContent(), 'Done')
    await dialog.getByRole('combobox', { name: 'Stage' }).press('Enter')
    await page.getByRole('option', { name: 'Done', exact: true }).press('Escape')
    assert.equal(await dialog.isVisible(), true)
    await dialog.getByRole('combobox', { name: 'Stage' }).press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(await page.getByRole('button', { name: 'Open settings', exact: true }).evaluate(el => el === document.activeElement), true)
    await page.getByRole('button', { name: 'Open settings', exact: true }).click()
    await dialog.waitFor()
    await dialog.getByRole('combobox', { name: 'Stage' }).press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement?.closest('[role=dialog]') !== null), true)
    await page.mouse.click(5, 5)
    await dialog.waitFor({ state: 'hidden' })
    await page.keyboard.press('Alt+e')
    await page.getByRole('menuitem', { name: 'Undo edit', exact: true }).waitFor()
    await page.waitForFunction(() => document.activeElement?.textContent === 'Undo edit')
    await page.keyboard.press('ArrowDown')
    await page.waitForFunction(() => document.activeElement?.textContent === 'Redo edit')
    await page.keyboard.press('Alt+e')
    await page.waitForFunction(() => document.activeElement?.textContent === 'Undo edit')
    await page.keyboard.press('Escape')
    await page.getByRole('menuitem', { name: 'Undo edit', exact: true }).waitFor({ state: 'hidden' })
    assert.equal(await page.getByRole('menubar', { name: 'Application' }).getByRole('menuitem', { name: 'Edit', exact: true }).evaluate(el => el === document.activeElement), true)
    assert.deepEqual(errors, [])
    await page.screenshot({ path: join(stage, 'consumer-browser.png'), fullPage: true })
    console.log('Browser passed: native validation, submission/reset, toolbar arrows, nested Select/Dialog Escape and focus return, Menubar Alt activation/repeat.')
  } catch (error) {
    const page = browser?.contexts()[0]?.pages()[0]
    if (page) await page.screenshot({ path: join(stage, 'consumer-browser-failure.png'), fullPage: true }).catch(() => {})
    throw error
  } finally {
    await browser?.close()
    await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
  }
}
