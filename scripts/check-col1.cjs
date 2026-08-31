const { chromium } = require('playwright-core')
async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage()
  await page.goto('http://localhost:5173/posts/%E6%95%B0%E6%8D%AE%E5%BA%93%2FPostgreSQL13%2Fstudy-material%2F%E9%9D%A2%E8%AF%95%E7%9F%A5%E8%AF%86%E7%82%B9%2F06-%E6%B7%B1%E5%BA%A6%E6%9C%BA%E5%88%B6%E5%92%8C%E5%9C%BA%E6%99%AF%E9%A2%98'.replace(/\\/g,'/'), { waitUntil: 'networkidle' })
  await page.locator('button:has-text("编辑")').first().click()
  await page.waitForSelector('.vditor', { timeout: 20000 })
  await page.waitForTimeout(4000)
  const r = await page.evaluate(() => {
    const tables = document.querySelectorAll('.vditor-wysiwyg table')
    let col1Hits = 0
    document.querySelectorAll('.vditor-wysiwyg th').forEach((th) => { if (/col\d/.test(th.textContent)) col1Hits++ })
    return { tableCount: tables.length, col1Headers: col1Hits }
  })
  console.log(JSON.stringify(r))
  await browser.close()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
