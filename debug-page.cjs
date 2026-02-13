const { chromium } = require('playwright');

async function debugPage() {
    console.log('Debugging Mission Control page...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Get page structure
        const html = await page.content();
        console.log('Page HTML (first 2000 chars):');
        console.log(html.substring(0, 2000));
        
        // Find all buttons
        const buttons = await page.locator('button').all();
        console.log(`\n\nFound ${buttons.length} buttons:`);
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
            const text = await buttons[i].textContent();
            console.log(`  ${i + 1}. "${text}"`);
        }
        
        // Find all text on page
        const bodyText = await page.locator('body').textContent();
        console.log('\n\nBody text (first 500 chars):');
        console.log(bodyText.substring(0, 500));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

debugPage();