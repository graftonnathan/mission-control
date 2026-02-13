const { chromium } = require('playwright');

async function inspectQuickActions() {
    console.log('Inspecting Quick Actions Panel...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Find the chickens project card and click it
        const chickensCard = await page.locator('button:has-text("chickens")').first();
        if (await chickensCard.isVisible().catch(() => false)) {
            await chickensCard.click();
            console.log('Clicked chickens project card');
        } else {
            console.log('Could not find chickens card');
        }
        
        await page.waitForTimeout(2000);
        
        // Get the Quick Actions panel HTML
        const quickActionsHtml = await page.evaluate(() => {
            // Find the Quick Actions panel by looking for the title
            const panels = document.querySelectorAll('*');
            for (const el of panels) {
                if (el.textContent && el.textContent.includes('Quick Actions') && el.children.length > 5) {
                    return {
                        found: true,
                        html: el.outerHTML.substring(0, 3000),
                        text: el.textContent.substring(0, 500)
                    };
                }
            }
            return { found: false };
        });
        
        if (quickActionsHtml.found) {
            console.log('Quick Actions panel found!');
            console.log('\nText content:');
            console.log(quickActionsHtml.text);
            console.log('\nHTML (first 2000 chars):');
            console.log(quickActionsHtml.html);
        } else {
            console.log('Quick Actions panel not found');
        }
        
        // Also check for the panel with chickens as title
        const projectPanelHtml = await page.evaluate(() => {
            const panels = document.querySelectorAll('*');
            for (const el of panels) {
                if (el.textContent && el.textContent.includes('chickens') && 
                    el.textContent.includes('Running') || el.textContent.includes('Stopped')) {
                    return {
                        found: true,
                        text: el.textContent.substring(0, 800)
                    };
                }
            }
            return { found: false };
        });
        
        if (projectPanelHtml.found) {
            console.log('\n\nProject panel found:');
            console.log(projectPanelHtml.text);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

inspectQuickActions();