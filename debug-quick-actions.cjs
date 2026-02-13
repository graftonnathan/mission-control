const { chromium } = require('playwright');

async function debugQuickActions() {
    console.log('Debugging Quick Actions...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Click on chickens project
        await page.click('text=chickens');
        await page.waitForTimeout(2000);
        
        // Get all text content
        const bodyText = await page.locator('body').textContent();
        console.log('Page content (first 800 chars):');
        console.log(bodyText.substring(0, 800));
        
        // Look for specific sections
        console.log('\n\nSearching for Quick Actions content...');
        
        // Check for Quick Actions panel
        const hasQuickActions = bodyText.includes('Quick') || bodyText.includes('Actions');
        console.log(`Has Quick Actions header: ${hasQuickActions}`);
        
        // Check for Pause text
        console.log(`Has Pause: ${bodyText.includes('Pause')}`);
        console.log(`Has Resume: ${bodyText.includes('Resume')}`);
        console.log(`Has Restart: ${bodyText.includes('Restart')}`);
        console.log(`Has Open: ${bodyText.includes('Open')}`);
        console.log(`Has Push: ${bodyText.includes('Push')}`);
        console.log(`Has Add: ${bodyText.includes('Add')}`);
        
        // Get HTML structure around buttons
        const html = await page.content();
        console.log('\n\nLooking for button elements in HTML...');
        const buttonMatches = html.match(/<button[^>]*>[^<]*<\/button>/g);
        if (buttonMatches) {
            console.log(`Found ${buttonMatches.length} button elements`);
            buttonMatches.slice(0, 10).forEach((btn, i) => {
                console.log(`  ${i + 1}. ${btn.substring(0, 80)}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

debugQuickActions();