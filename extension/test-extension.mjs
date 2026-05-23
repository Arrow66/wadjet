#!/usr/bin/env node
/**
 * Test Wedjet extension via Chrome remote debugging (port 9222).
 * Run Chrome first:
 *   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug --load-extension=/home/arjun/swb/extension
 */
import puppeteer from 'puppeteer-core';

const JOB_URL =
  'https://www.linkedin.com/jobs/view/software-engineer-all-levels-at-fieldguide-4311634893/';
const BROWSER_URL = process.env.CHROME_URL || 'http://127.0.0.1:9222';

async function main() {
  const browser = await puppeteer.connect({ browserURL: BROWSER_URL });
  const page = await browser.newPage();

  console.log('Navigating to LinkedIn job page...');
  await page.goto(JOB_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));

  const result = await page.evaluate(() => {
    const icon = document.getElementById('wedjet-inline-icon');
    const title = document.querySelector('h1.top-card-layout__title, .job-details-jobs-unified-top-card__job-title');
    return {
      url: location.href,
      hasWedjetIcon: !!icon,
      iconClass: icon?.className || null,
      titleText: title?.innerText?.trim() || null
    };
  });

  console.log('\n--- Extension DOM check ---');
  console.log(JSON.stringify(result, null, 2));

  const apiCheck = await fetch(
    `http://127.0.0.1:3000/api/v1/jobs/check?url=${encodeURIComponent(JOB_URL)}&title=Software Engineer&company=Fieldguide`
  ).catch((e) => ({ ok: false, status: 0, error: String(e) }));

  if (apiCheck instanceof Response) {
    console.log('\n--- Backend check API ---');
    console.log('status:', apiCheck.status, apiCheck.status === 404 ? '(unevaluated - gray icon expected)' : '');
    if (apiCheck.ok) console.log('body:', await apiCheck.json());
  } else {
    console.log('\n--- Backend check API ---');
    console.log('FAILED:', apiCheck.error);
  }

  if (result.hasWedjetIcon) {
    console.log('\nPASS: Wedjet icon injected on job page.');
  } else {
    console.log('\nFAIL: No #wedjet-inline-icon found. Reload extension and refresh the tab.');
    process.exitCode = 1;
  }

  await page.close();
  browser.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  console.error('\nIs Chrome running with --remote-debugging-port=9222 ?');
  process.exit(1);
});
