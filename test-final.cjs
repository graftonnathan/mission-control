const { chromium } = require('playwright');

async function testQuickActionsFix() {
    console.log('Testing Quick Actions Reorganization Fix...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    
    try {
        console.log('1. Opening Mission Control...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // 2. Click on a project card - look for the actual card element
        console.log('2. Selecting project...');
        
        // Find project cards in the Projects panel
        const projectCard = await page.locator('button[class*="border-2"]').first();
        const cardCount = await page.locator('button[class*="border-2"]').count();
        console.log(`   Found ${cardCount} project cards`);
        
        if (cardCount > 0) {
            const cardText = await projectCard.textContent();
            console.log(`   Clicking on card: "${cardText.substring(0, 50)}"`);
            await projectCard.click();
            await page.waitForTimeout(2000);
        } else {
            console.log('   No project cards found!');
        }
        
        // 3. Check the page content after clicking
        console.log('\n3. Checking Quick Actions content...');
        const pageText = await page.locator('body').textContent();
        
        const hasPause = pageText.includes('Pause') || pageText.includes('Resume');
        const hasRestart = pageText.includes('Restart') || pageText.includes('Start');
        const hasOpen = pageText.includes('Open');
        const hasPush = pageText.includes('Push');
        const hasAdd = pageText.includes('Add');
        
        console.log(`   Pause/Resume: ${hasPause ? '✅' : '❌'}`);
        console.log(`   Restart/Start: ${hasRestart ? '✅' : '❌'}`);
        console.log(`   Open: ${hasOpen ? '✅' : '❌'}`);
        console.log(`   Push: ${hasPush ? '✅' : '❌'}`);
        console.log(`   Add: ${hasAdd ? '✅' : '❌'}`);
        
        // 4. Check the HTML structure for grids
        console.log('\n4. Checking layout structure...');
        const html = await page.content();
        
        // Look for the Quick Actions panel content
        const quickActionsMatch = html.match(/Select a project to see quick actions/);
        if (quickActionsMatch) {
            console.log('   ⚠️  No project selected - showing placeholder');
        } else {
            console.log('   ✅ Project is selected');
        }
        
        // Check grid classes
        const hasGrid3 = html.includes('grid-cols-3');
        const hasGrid2 = html.includes('grid-cols-2');
        console.log(`   3-column grid: ${hasGrid3 ? '✅' : '❌'}`);
        console.log(`   2-column grid: ${hasGrid2 ? '✅' : '❌'}`);
        
        // 5. Get detailed content of Quick Actions panel
        console.log('\n5. Quick Actions panel content:');
        const quickActionsContent = await page.evaluate(() => {
            // Find the Quick Actions panel
            const headers = document.querySelectorAll('h3, h4');
            for (const h of headers) {
                if (h.textContent.includes('Quick Actions')) {
                    const panel = h.closest('[class*="panel"], [class*="Panel"]') || h.parentElement.parentElement;
                    return panel ? panel.textContent.substring(0, 800) : 'Panel not found';
                }
            }
            return 'Quick Actions header not found';
        });
        console.log(quickActionsContent);
        
        // 6. Take screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/quick-actions-final.png',
            fullPage: true
        });
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        const allButtonsPresent = hasPause && hasRestart && hasOpen && hasPush && hasAdd;
        const layoutCorrect = hasGrid3 && hasGrid2;
        
        if (allButtonsPresent) {
            console.log('✅ All buttons present');
        } else {
            console.log('❌ Missing buttons');
        }
        
        if (layoutCorrect) {
            console.log('✅ Correct grid layout (3-col + 2-col)');
        } else {
            console.log('❌ Layout incorrect');
        }
        
        if (errors.length === 0) {
            console.log('✅ No JavaScript errors');
        } else {
            console.log(`⚠️  ${errors.length} warnings/errors`);
        }
        
        const overall = allButtonsPresent && layoutCorrect;
        console.log(`\n${overall ? '✅ PASS' : '❌ FAIL'}: Quick Actions reorganization`);
        
        return { passed: overall };
        
    } catch (error) {
        console.error('Test error:', error.message);
        return { passed: false, error: error.message };
    } finally {
        await browser.close();
    }
}

testQuickActionsFix().then(results => {
    process.exit(results.passed ? 0 : 1);
});