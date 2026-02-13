const { chromium } = require('playwright');

async function testQuickActionsDetailed() {
    console.log('Detailed Quick Actions Test...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Get the full page text before clicking
        const beforeText = await page.locator('body').textContent();
        console.log('BEFORE clicking project:');
        console.log(`- Has "Quick Actions": ${beforeText.includes('Quick Actions')}`);
        console.log(`- Has "chickens": ${beforeText.includes('chickens')}`);
        
        // Find and click the first project card (chickens)
        console.log('\nClicking on chickens project card...');
        const projectCards = await page.locator('button').filter({ hasText: /chickens/i }).all();
        console.log(`Found ${projectCards.length} buttons with "chickens"`);
        
        if (projectCards.length > 0) {
            await projectCards[0].click();
            console.log('Clicked on project card');
        }
        
        await page.waitForTimeout(2000);
        
        // Get page text after clicking
        const afterText = await page.locator('body').textContent();
        console.log('\nAFTER clicking project:');
        console.log(`- Has "Quick Actions": ${afterText.includes('Quick Actions')}`);
        console.log(`- Has "chickens": ${afterText.includes('chickens')}`);
        console.log(`- Has "Running": ${afterText.includes('Running')}`);
        console.log(`- Has "Stopped": ${afterText.includes('Stopped')}`);
        console.log(`- Has "Pause": ${afterText.includes('Pause')}`);
        console.log(`- Has "Resume": ${afterText.includes('Resume')}`);
        console.log(`- Has "Restart": ${afterText.includes('Restart')}`);
        console.log(`- Has "Open": ${afterText.includes('Open')}`);
        console.log(`- Has "Push": ${afterText.includes('Push')}`);
        console.log(`- Has "Add": ${afterText.includes('Add')}`);
        
        // Look for panel with project name as title
        console.log('\nSearching for Quick Actions panel content...');
        const panelTitles = await page.locator('[class*="Panel"], h3, h4').allTextContents();
        console.log('Panel/title elements found:');
        panelTitles.slice(0, 10).forEach(t => console.log(`  - "${t.substring(0, 50)}"`));
        
        // Get HTML around the Quick Actions area
        console.log('\nLooking for QuickActions component...');
        const html = await page.content();
        
        // Look for grid classes
        const hasGrid3 = html.includes('grid-cols-3');
        const hasGrid2 = html.includes('grid-cols-2');
        console.log(`grid-cols-3 found: ${hasGrid3}`);
        console.log(`grid-cols-2 found: ${hasGrid2}`);
        
        // Check if the component is actually rendered
        const quickActionsMatch = html.match(/Quick Actions|Pause|Resume/);
        if (quickActionsMatch) {
            console.log(`\nFound Quick Actions related content: "${quickActionsMatch[0]}"`);
        } else {
            console.log('\nNo Quick Actions content found in HTML');
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/quick-actions-detailed.png',
            fullPage: true
        });
        console.log('\nScreenshot saved');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

testQuickActionsDetailed();