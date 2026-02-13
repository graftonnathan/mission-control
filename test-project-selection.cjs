const { chromium } = require('playwright');

async function testProjectSelection() {
    console.log('Testing Project Selection and Quick Actions...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Try to find project cards - look for project section
        console.log('Looking for project section...');
        
        // Get all text
        const bodyText = await page.locator('body').textContent();
        
        // Find where Projects section is
        const projectsIndex = bodyText.indexOf('Projects');
        if (projectsIndex >= 0) {
            console.log('Found Projects section');
            console.log('Projects section preview:', bodyText.substring(projectsIndex, projectsIndex + 200));
        }
        
        // Try clicking on "Projects" header or section
        const projectsHeader = await page.locator('text=Projects').first();
        if (await projectsHeader.isVisible().catch(() => false)) {
            console.log('Clicking Projects header...');
            await projectsHeader.click();
            await page.waitForTimeout(1000);
        }
        
        // Look for clickable project elements
        // Try finding elements with project names that are not in the tickets section
        const allElements = await page.locator('*').all();
        console.log(`\nTotal elements: ${allElements.length}`);
        
        // Look for elements containing project names
        const projectNames = ['chickens', 'snek', 'kinectv1', 'spec-interpreter'];
        for (const name of projectNames) {
            const elements = await page.locator(`text=${name}`).all();
            console.log(`\nFound ${elements.length} elements with "${name}":`);
            
            for (let i = 0; i < Math.min(elements.length, 3); i++) {
                const el = elements[i];
                const tag = await el.evaluate(e => e.tagName);
                const text = await el.textContent();
                const clickable = await el.isEnabled().catch(() => false);
                console.log(`  ${i + 1}. <${tag}> "${text.substring(0, 40)}" clickable=${clickable}`);
            }
        }
        
        // Try clicking directly on project card
        console.log('\n\nTrying to click on chickens project card...');
        
        // Look for a clickable chickens element that's not in tickets
        const chickensElements = await page.locator('text=chickens').all();
        for (const el of chickensElements) {
            const text = await el.textContent();
            // Skip if it's in the tickets section
            if (text.includes('Ticket') || text.includes('Phase')) continue;
            
            const isClickable = await el.isEnabled().catch(() => false);
            if (isClickable) {
                console.log(`Clicking: "${text.substring(0, 50)}"`);
                await el.click();
                await page.waitForTimeout(2000);
                break;
            }
        }
        
        // Check what's showing now
        const newBodyText = await page.locator('body').textContent();
        console.log('\n\nAfter click - checking for Quick Actions buttons:');
        console.log(`Has Pause: ${newBodyText.includes('Pause')}`);
        console.log(`Has Restart: ${newBodyText.includes('Restart')}`);
        console.log(`Has Open: ${newBodyText.includes('Open')}`);
        console.log(`Has Push: ${newBodyText.includes('Push')}`);
        console.log(`Has Add: ${newBodyText.includes('Add')}`);
        
        // Take screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/project-selection.png' 
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

testProjectSelection();