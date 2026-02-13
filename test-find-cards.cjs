const { chromium } = require('playwright');

async function findProjectCards() {
    console.log('Finding Project Cards...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Get all buttons
        const allButtons = await page.locator('button').all();
        console.log(`Total buttons: ${allButtons.length}`);
        
        console.log('\nButton details:');
        for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
            const btn = allButtons[i];
            const text = await btn.textContent();
            const className = await btn.getAttribute('class');
            if (text.trim()) {
                console.log(`  ${i + 1}. "${text.substring(0, 40)}"`);
                console.log(`      class: ${className ? className.substring(0, 60) : 'none'}`);
            }
        }
        
        // Try clicking the first button that looks like a project card
        // (has border-2 class and contains project-like content)
        for (const btn of allButtons) {
            const className = await btn.getAttribute('class');
            const text = await btn.textContent();
            
            if (className && className.includes('border-2') && text.length < 100) {
                console.log(`\nClicking button: "${text.substring(0, 50)}"`);
                await btn.click();
                await page.waitForTimeout(2000);
                
                // Check if Quick Actions updated
                const quickActionsText = await page.locator('text=Quick Actions').first().locator('..').textContent();
                console.log('Quick Actions after click:');
                console.log(quickActionsText.substring(0, 300));
                break;
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

findProjectCards();