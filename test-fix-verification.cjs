const { chromium } = require('playwright');

async function testQuickActionsFix() {
    console.log('Testing Quick Actions Reorganization Fix...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
            console.log(`❌ Console Error: ${msg.text().substring(0, 100)}`);
        }
    });
    
    try {
        console.log('1. Opening Mission Control...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // 2. Select a project
        console.log('2. Selecting project...');
        const projectLink = await page.locator('text=chickens').first();
        if (await projectLink.isVisible().catch(() => false)) {
            await projectLink.click();
            console.log('   Clicked on chickens project');
        }
        await page.waitForTimeout(1500);
        
        // 3. Check status bar
        console.log('\n3. Checking status bar...');
        const pageText = await page.locator('body').textContent();
        
        // Look for status bar content - should NOT have Open → in it
        const statusSection = await page.locator('[class*="status"]').first();
        const statusText = await statusSection.textContent().catch(() => '');
        console.log(`   Status bar text: "${statusText.substring(0, 80)}"`);
        
        const hasOpenInStatus = statusText.includes('Open →') || 
                                (statusText.toLowerCase().includes('open') && statusText.length < 100);
        if (hasOpenInStatus) {
            console.log('   ❌ Open link still in status bar');
        } else {
            console.log('   ✅ Open link removed from status bar');
        }
        
        // 4. Find all buttons
        console.log('\n4. Finding all buttons...');
        const buttons = await page.locator('button').all();
        const buttonTexts = [];
        for (const btn of buttons) {
            const text = await btn.textContent();
            if (text.trim() && text.length < 50) {
                buttonTexts.push(text.trim());
            }
        }
        console.log(`   Found ${buttonTexts.length} buttons: ${JSON.stringify(buttonTexts)}`);
        
        // 5. Check for required buttons
        console.log('\n5. Verifying button organization...');
        
        const hasPause = buttonTexts.some(t => t.includes('Pause') || t.includes('Resume'));
        const hasRestart = buttonTexts.some(t => t.includes('Restart') || t.includes('Start'));
        const hasOpen = buttonTexts.some(t => t.includes('Open'));
        const hasPush = buttonTexts.some(t => t.includes('Push'));
        const hasAdd = buttonTexts.some(t => t.includes('Add'));
        
        console.log(`   Pause/Resume: ${hasPause ? '✅' : '❌'}`);
        console.log(`   Restart: ${hasRestart ? '✅' : '❌'}`);
        console.log(`   Open: ${hasOpen ? '✅' : '❌'}`);
        console.log(`   Git Push: ${hasPush ? '✅' : '❌'}`);
        console.log(`   Add Task: ${hasAdd ? '✅' : '❌'}`);
        
        // 6. Check grid layout
        console.log('\n6. Checking layout structure...');
        
        // Look for grid elements
        const grid3 = await page.locator('.grid-cols-3, [class*="grid-cols-3"]').count();
        const grid2 = await page.locator('.grid-cols-2, [class*="grid-cols-2"]').count();
        const grid4 = await page.locator('.grid-cols-4, [class*="grid-cols-4"]').count();
        
        console.log(`   3-column grids found: ${grid3}`);
        console.log(`   2-column grids found: ${grid2}`);
        console.log(`   4-column grids found: ${grid4}`);
        
        // 7. Take screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/quick-actions-fixed.png',
            fullPage: false
        });
        console.log('\n   Screenshot saved');
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        
        const statusOk = !hasOpenInStatus;
        const primaryOk = hasPause && hasRestart && hasOpen;
        const secondaryOk = hasPush && hasAdd;
        const layoutOk = grid3 > 0 && grid2 > 0 && grid4 === 0;
        
        if (statusOk) {
            console.log('✅ Status bar: Open link removed');
        } else {
            console.log('❌ Status bar: Open link still present');
        }
        
        if (primaryOk) {
            console.log('✅ Primary row: All 3 buttons present (Pause/Restart/Open)');
        } else {
            console.log('❌ Primary row: Missing buttons');
        }
        
        if (secondaryOk) {
            console.log('✅ Secondary row: All 2 buttons present (Push/Add)');
        } else {
            console.log('❌ Secondary row: Missing buttons');
        }
        
        if (layoutOk) {
            console.log('✅ Layout: Correct grid structure (3-col + 2-col)');
        } else {
            console.log('⚠️  Layout: May not match spec exactly');
        }
        
        if (errors.length === 0) {
            console.log('✅ No JavaScript errors');
        } else {
            console.log(`⚠️  ${errors.length} warnings/errors`);
        }
        
        const overall = statusOk && primaryOk && secondaryOk;
        console.log(`\n${overall ? '✅ PASS' : '❌ FAIL'}: Quick Actions reorganization`);
        
        return {
            passed: overall,
            statusOk,
            primaryOk,
            secondaryOk,
            layoutOk,
            errors: errors.length
        };
        
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