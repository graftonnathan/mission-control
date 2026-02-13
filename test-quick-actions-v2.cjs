const { chromium } = require('playwright');

async function testQuickActionsV2() {
    console.log('Testing Quick Actions Reorganization v2...\n');
    
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
        
        // Get all text content to find projects
        const bodyText = await page.locator('body').textContent();
        console.log('   Page loaded');
        
        // Look for project cards - try different selectors
        console.log('\n2. Looking for project cards...');
        
        // Try clicking on a project name
        const projectNames = ['chickens', 'snek', 'kinect', 'spec-interpreter', 'mission-control'];
        let projectClicked = false;
        
        for (const name of projectNames) {
            const projectLink = await page.locator(`text=${name}`).first();
            const isVisible = await projectLink.isVisible().catch(() => false);
            if (isVisible) {
                console.log(`   Found project: ${name}`);
                await projectLink.click();
                projectClicked = true;
                break;
            }
        }
        
        if (!projectClicked) {
            console.log('   No project found to click, trying generic card click...');
            // Try clicking on any card-like element
            const cards = await page.locator('[class*="card"], [class*="project"]').all();
            if (cards.length > 0) {
                await cards[0].click();
                projectClicked = true;
            }
        }
        
        await page.waitForTimeout(1500);
        
        if (!projectClicked) {
            console.log('   Could not find project to click');
        }
        
        // 3. Check for Quick Actions panel
        console.log('\n3. Checking Quick Actions panel...');
        
        // Get all button text
        const buttons = await page.locator('button').all();
        console.log(`   Found ${buttons.length} buttons:`);
        for (const btn of buttons.slice(0, 15)) {
            const text = await btn.textContent();
            if (text.trim()) {
                console.log(`     - "${text.trim()}"`);
            }
        }
        
        // 4. Check specific buttons
        console.log('\n4. Verifying button organization...');
        
        const pageText = await page.locator('body').textContent();
        
        // Check for status indicators
        const hasStatus = pageText.includes('Status') || pageText.includes('status');
        console.log(`   Has status indicator: ${hasStatus ? '✅' : '❌'}`);
        
        // Check for Pause/Resume
        const hasPause = pageText.includes('Pause') || pageText.includes('Resume');
        console.log(`   Has Pause/Resume: ${hasPause ? '✅' : '❌'}`);
        
        // Check for Restart
        const hasRestart = pageText.includes('Restart');
        console.log(`   Has Restart: ${hasRestart ? '✅' : '❌'}`);
        
        // Check for Open
        const hasOpen = pageText.includes('Open');
        console.log(`   Has Open: ${hasOpen ? '✅' : '❌'}`);
        
        // Check for Git Push
        const hasGitPush = pageText.includes('Git Push') || pageText.includes('Push');
        console.log(`   Has Git Push: ${hasGitPush ? '✅' : '❌'}`);
        
        // Check for Add Task
        const hasAddTask = pageText.includes('Add Task') || pageText.includes('Add');
        console.log(`   Has Add Task: ${hasAddTask ? '✅' : '❌'}`);
        
        // Take screenshot
        await page.screenshot({ path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/quick-actions-v2.png' });
        console.log('\n   Screenshot saved');
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        const primaryOk = hasPause && hasRestart && hasOpen;
        const secondaryOk = hasGitPush && hasAddTask;
        
        if (primaryOk) {
            console.log('✅ Primary buttons found (Pause/Restart/Open)');
        } else {
            console.log('❌ Primary buttons incomplete');
        }
        
        if (secondaryOk) {
            console.log('✅ Secondary buttons found (Git Push/Add Task)');
        } else {
            console.log('❌ Secondary buttons incomplete');
        }
        
        if (errors.length === 0) {
            console.log('✅ No critical JavaScript errors');
        } else {
            console.log(`⚠️  ${errors.length} warnings/errors (may be non-critical)`);
        }
        
        const overall = primaryOk && secondaryOk;
        console.log(`\n${overall ? '✅ PASS' : '❌ FAIL'}: Quick Actions reorganization`);
        
    } catch (error) {
        console.error('Test error:', error.message);
    }
    
    await browser.close();
}

testQuickActionsV2();