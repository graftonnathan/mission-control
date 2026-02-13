const { chromium } = require('playwright');

async function testQuickActions() {
    console.log('Testing Quick Actions Reorganization...\n');
    
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
        // 1. Open Mission Control
        console.log('1. Opening Mission Control...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // 2. Select a project (first one)
        console.log('2. Selecting first project...');
        const projectCards = await page.locator('[data-testid="project-card"], .project-card, [class*="project"]').count();
        console.log(`   Found ${projectCards} project elements`);
        
        // Try to find and click a project
        const projectSelector = await page.locator('text=/chickens|kinect|snek/i').first();
        if (await projectSelector.isVisible().catch(() => false)) {
            await projectSelector.click();
            await page.waitForTimeout(1000);
        }
        
        // 3. Check status bar (should NOT have Open link)
        console.log('\n3. Checking status bar...');
        const statusBar = await page.locator('[class*="status"], [data-testid*="status"]').first();
        const statusText = await statusBar.textContent().catch(() => 'not found');
        console.log(`   Status bar text: ${statusText.substring(0, 100)}`);
        
        const hasOpenInStatus = statusText.toLowerCase().includes('open') && 
                                !statusText.toLowerCase().includes('stopped');
        if (hasOpenInStatus) {
            console.log('   ⚠️  Status bar may still contain Open link');
        } else {
            console.log('   ✅ Status bar does not show Open link');
        }
        
        // 4. Check primary row (Pause/Resume, Restart, Open)
        console.log('\n4. Checking primary row buttons...');
        const pauseBtn = await page.locator('button:has-text("Pause"), button:has-text("Resume")').first();
        const restartBtn = await page.locator('button:has-text("Restart")').first();
        const openBtn = await page.locator('button:has-text("Open")').first();
        
        const pauseVisible = await pauseBtn.isVisible().catch(() => false);
        const restartVisible = await restartBtn.isVisible().catch(() => false);
        const openVisible = await openBtn.isVisible().catch(() => false);
        
        console.log(`   Pause/Resume button: ${pauseVisible ? '✅' : '❌'}`);
        console.log(`   Restart button: ${restartVisible ? '✅' : '❌'}`);
        console.log(`   Open button: ${openVisible ? '✅' : '❌'}`);
        
        // 5. Check secondary row (Git Push, Add Task)
        console.log('\n5. Checking secondary row buttons...');
        const gitPushBtn = await page.locator('button:has-text("Git Push"), button:has-text("Push")').first();
        const addTaskBtn = await page.locator('button:has-text("Add Task"), button:has-text("Add")').first();
        
        const gitPushVisible = await gitPushBtn.isVisible().catch(() => false);
        const addTaskVisible = await addTaskBtn.isVisible().catch(() => false);
        
        console.log(`   Git Push button: ${gitPushVisible ? '✅' : '❌'}`);
        console.log(`   Add Task button: ${addTaskVisible ? '✅' : '❌'}`);
        
        // 6. Test button functionality
        console.log('\n6. Testing button functionality...');
        
        if (pauseVisible) {
            console.log('   Testing Pause/Resume...');
            await pauseBtn.click();
            await page.waitForTimeout(500);
            console.log('   ✅ Pause/Resume clicked');
        }
        
        if (openVisible) {
            console.log('   Testing Open button...');
            // Don't actually click - just verify it exists
            console.log('   ✅ Open button present (would open project URL)');
        }
        
        // 7. Check visual hierarchy
        console.log('\n7. Checking visual hierarchy...');
        const allButtons = await page.locator('button').all();
        console.log(`   Total buttons found: ${allButtons.length}`);
        
        // Take screenshot
        await page.screenshot({ path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/quick-actions-test.png' });
        console.log('   Screenshot saved');
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        const primaryRowOk = pauseVisible && restartVisible && openVisible;
        const secondaryRowOk = gitPushVisible && addTaskVisible;
        
        if (primaryRowOk) {
            console.log('✅ Primary row (Pause/Restart/Open): CORRECT');
        } else {
            console.log('❌ Primary row incomplete');
        }
        
        if (secondaryRowOk) {
            console.log('✅ Secondary row (Git Push/Add Task): CORRECT');
        } else {
            console.log('❌ Secondary row incomplete');
        }
        
        if (errors.length === 0) {
            console.log('✅ No JavaScript errors');
        } else {
            console.log(`❌ ${errors.length} JavaScript errors`);
        }
        
        const overall = primaryRowOk && secondaryRowOk && errors.length === 0;
        console.log(`\n${overall ? '✅ PASS' : '❌ FAIL'}: Quick Actions reorganization`);
        
    } catch (error) {
        console.error('Test error:', error.message);
    }
    
    await browser.close();
}

testQuickActions();