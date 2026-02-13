const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, '../screenshots');
  
  // Navigate to the dashboard
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Wait for content to load
  await page.waitForTimeout(3000);
  
  // Full page screenshot
  await page.screenshot({ 
    path: path.join(screenshotDir, 'design-review-01-full.png'),
    fullPage: true 
  });
  
  // Projects panel close-up
  const projectsPanel = await page.locator('.bg-mission-panel').first();
  if (await projectsPanel.isVisible().catch(() => false)) {
    await projectsPanel.screenshot({ 
      path: path.join(screenshotDir, 'design-review-02-projects.png') 
    });
  }
  
  // Agent status panel
  const agentPanels = await page.locator('.bg-mission-panel').all();
  if (agentPanels[1]) {
    await agentPanels[1].screenshot({ 
      path: path.join(screenshotDir, 'design-review-03-agents.png') 
    });
  }
  
  // Token monitor panel
  if (agentPanels[2]) {
    await agentPanels[2].screenshot({ 
      path: path.join(screenshotDir, 'design-review-04-tokens.png') 
    });
  }
  
  // Queue status
  if (agentPanels[3]) {
    await agentPanels[3].screenshot({ 
      path: path.join(screenshotDir, 'design-review-05-queue.png') 
    });
  }
  
  // Agent reports
  if (agentPanels[4]) {
    await agentPanels[4].screenshot({ 
      path: path.join(screenshotDir, 'design-review-06-reports.png') 
    });
  }
  
  // Live log
  if (agentPanels[5]) {
    await agentPanels[5].screenshot({ 
      path: path.join(screenshotDir, 'design-review-07-livelog.png') 
    });
  }
  
  // Responsive breakpoint - tablet
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: path.join(screenshotDir, 'design-review-08-responsive-tablet.png'),
    fullPage: true 
  });
  
  // Header detail
  const header = await page.locator('header').first();
  if (await header.isVisible().catch(() => false)) {
    await header.screenshot({ 
      path: path.join(screenshotDir, 'design-review-09-header.png') 
    });
  }
  
  console.log('Screenshots captured successfully');
  await browser.close();
})();
