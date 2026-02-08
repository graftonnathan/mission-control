import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const screenshotsDir = '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots';
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  try {
    // Full dashboard
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'design-review-01-full.png'), fullPage: false });
    console.log('Captured: design-review-01-full.png');

    // Projects panel (left column top)
    const projectsPanel = await page.locator('.panel:has-text("Projects")');
    if (await projectsPanel.isVisible().catch(() => false)) {
      await projectsPanel.screenshot({ path: path.join(screenshotsDir, 'design-review-02-projects.png') });
      console.log('Captured: design-review-02-projects.png');
    }

    // Agent Status (middle column top)
    const agentPanel = await page.locator('.panel:has-text("Agent Status")');
    if (await agentPanel.isVisible().catch(() => false)) {
      await agentPanel.screenshot({ path: path.join(screenshotsDir, 'design-review-03-agents.png') });
      console.log('Captured: design-review-03-agents.png');
    }

    // Token Monitor (right column top)
    const tokenPanel = await page.locator('.panel:has-text("Token Monitor")');
    if (await tokenPanel.isVisible().catch(() => false)) {
      await tokenPanel.screenshot({ path: path.join(screenshotsDir, 'design-review-04-tokens.png') });
      console.log('Captured: design-review-04-tokens.png');
    }

    // Queue/Punch List (left column bottom - scroll to it)
    const queuePanel = await page.locator('.panel:has-text("Punch List")');
    if (await queuePanel.isVisible().catch(() => false)) {
      await queuePanel.screenshot({ path: path.join(screenshotsDir, 'design-review-05-queue.png') });
      console.log('Captured: design-review-05-queue.png');
    }

    // Agent Reports (middle column bottom)
    const reportsPanel = await page.locator('.panel:has-text("Agent Reports")');
    if (await reportsPanel.isVisible().catch(() => false)) {
      await reportsPanel.screenshot({ path: path.join(screenshotsDir, 'design-review-06-reports.png') });
      console.log('Captured: design-review-06-reports.png');
    }

    // Live Log (right column bottom)
    const logPanel = await page.locator('.panel:has-text("Live Log")');
    if (await logPanel.isVisible().catch(() => false)) {
      await logPanel.screenshot({ path: path.join(screenshotsDir, 'design-review-07-livelog.png') });
      console.log('Captured: design-review-07-livelog.png');
    }

    // Try to open Add Task modal for punch list screenshot
    const addButton = await page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
      const modal = await page.locator('.fixed, .modal, [role="dialog"]').first();
      if (await modal.isVisible().catch(() => false)) {
        await modal.screenshot({ path: path.join(screenshotsDir, 'design-review-10-add-task.png') });
        console.log('Captured: design-review-10-add-task.png');
      }
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Header detail
    const header = await page.locator('header, .header').first();
    if (await header.isVisible().catch(() => false)) {
      await header.screenshot({ path: path.join(screenshotsDir, 'design-review-09-header.png') });
      console.log('Captured: design-review-09-header.png');
    }

    // Responsive check
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'design-review-08-responsive-tablet.png'), fullPage: false });
    console.log('Captured: design-review-08-responsive-tablet.png');

    console.log('\n✅ All screenshots captured!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
})();
