const { chromium } = require('playwright');

async function debugClick() {
    console.log('Debugging Project Click...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Get initial panel titles
        const beforeTitles = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());
        });
        console.log('Panel titles BEFORE click:', beforeTitles);
        
        // Click on mission-control project
        const cards = await page.locator('.cursor-pointer').all();
        console.log(`\nFound ${cards.length} clickable elements`);
        
        for (const card of cards) {
            const text = await card.textContent();
            if (text.includes('mission-control')) {
                console.log(`Clicking element with text: "${text.substring(0, 60)}"`);
                await card.click();
                await page.waitForTimeout(3000);
                break;
            }
        }
        
        // Get panel titles after click
        const afterTitles = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());
        });
        console.log('\nPanel titles AFTER click:', afterTitles);
        
        // Get full page text to search for buttons
        const pageText = await page.locator('body').textContent();
        console.log('\nSearching for button text in page:');
        console.log(`  Contains "Pause": ${pageText.includes('Pause')}`);
        console.log(`  Contains "Restart": ${pageText.includes('Restart')}`);
        console.log(`  Contains "Open": ${pageText.includes('Open')}`);
        console.log(`  Contains "Push": ${pageText.includes('Push')}`);
        console.log(`  Contains "Add": ${pageText.includes('Add')}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

debugClick();