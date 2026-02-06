const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const screenshotsDir = '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots';
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'design-review-01-full.png'), fullPage: false });
    console.log('Captured: design-review-01-full.png');

    await page.screenshot({ path: path.join(screenshotsDir, 'design-review-09-header.png'), fullPage: false });
    console.log('Captured: design-review-09-header.png');

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'design-review-08-responsive-tablet.png'), fullPage: false });
    console.log('Captured: design-review-08-responsive-tablet.png');

    console.log('\nScreenshots captured!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
})();
