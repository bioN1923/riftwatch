/**
 * Screenshots of the standard pages for a version, from a locally running server in demo mode.
 * Usage: node scripts/shoot-version.cjs versions/v3.7/demo [baseUrl]
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium, devices } = require('playwright');

const out = path.resolve(process.argv[2] ?? 'versions/latest/demo');
const B = process.argv[3] ?? 'http://localhost:3001';
const PAGES = [
  ['01-home', '/'],
  ['02-tier-list', '/champions'],
  ['03-champion', '/champions/ahri'],
  ['04-matchup', '/champions/ahri/vs/zed'],
  ['05-profile', '/lol/euw1/Caps-EUW'],
  ['06-profile-stats', '/lol/euw1/Caps-EUW/stats'],
  ['07-live-game', '/lol/euw1/Caps-EUW/live'],
  ['08-compare', '/compare?a=euw1/Caps-EUW&b=euw1/Rekkles-EUW'],
  ['09-ladder', '/leaderboard'],
  ['10-arena', '/champions/ahri?queue=arena'],
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });
  const page = await ctx.newPage();
  for (const [name, url] of PAGES) {
    await page.goto(B + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 82, fullPage: true });
    console.log('saved', name);
  }
  const phone = await b.newContext({ ...devices['iPhone 13'], colorScheme: 'dark', locale: 'en-US' });
  const pp = await phone.newPage();
  for (const [name, url] of [['11-phone-profile', '/lol/euw1/Caps-EUW'], ['12-phone-champion', '/champions/ahri']]) {
    await pp.goto(B + url, { waitUntil: 'networkidle' });
    await pp.waitForTimeout(1500);
    await pp.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 82 });
    console.log('saved', name);
  }
  await b.close();
})();
