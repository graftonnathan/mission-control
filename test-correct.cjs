const { chromium } = require('playwright');

async function testQuickActionsCorrectly() {
    console.log('Testing Quick Actions (Corrected)...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('1. Opening Mission Control...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Find project cards - they're divs with cursor-pointer class
        console.log('2. Finding and clicking project card...');
        const projectCards = await page.locator('.cursor-pointer').all();
        console.log(`   Found ${projectCards.length} clickable elements`);
        
        // Find one that contains a project name
        for (const card of projectCards) {
            const text = await card.textContent();
            if (text.includes('spec-interpreter') || text.includes('chickens') || text.includes('mission-control')) {
                console.log(`   Clicking on: "${text.substring(0, 60)}"`);
                await card.click();
                await page.waitForTimeout(2000);
                break;
            }
        }
        
        // 3. Check the content
        console.log('\n3. Checking Quick Actions panel...');
        const pageText = await page.locator('body').textContent();
        
        const hasPause = pageText.includes('Pause');
        const hasResume = pageText.includes('Resume');
        const hasRestart = pageText.includes('Restart') || pageText.includes('Start');
        const hasOpen = pageText.includes('Open');
        const hasPush = pageText.includes('Push');
        const hasAdd = pageText.includes('Add');
        
        console.log(`   Pause: ${hasPause ? '✅' : '❌'}`);
        console.log(`   Resume: ${hasResume ? '✅' : '❌'}`);
        console.log(`   Restart/Start: ${hasRestart ? '✅' : '❌'}`);
        console.log(`   Open: ${hasOpen ? '✅' : '❌'}`);
        console.log(`   Push: ${hasPush ? '✅' : '❌'}`);
        console.log(`   Add: ${hasAdd ? '✅' : '❌'}`);
        
        // 4. Check layout
        console.log('\n4. Checking layout structure...');
        const html = await page.content();
        
        // Check if placeholder is gone
        const hasPlaceholder = pageText.includes('Select a project to see quick actions');
        console.log(`   Placeholder showing: ${hasPlaceholder ? 'YES (no project selected)' : 'NO (project selected)'}`);
        
        // Check grid classes in QuickActions context
        const hasGrid3 = html.includes('grid-cols-3');
        const hasGrid2 = html.includes('grid-cols-2');
        console.log(`   3-column grid: ${hasGrid3 ? '✅' : '❌'}`);
        console.log(`   2-column grid: ${hasGrid2 ? '✅' : '❌'}`);
        
        // 5. Take screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/quick-actions-test.png',
            fullPage: true
        });
        console.log('\n   Screenshot saved');
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        
        const primaryRow = (hasPause || hasResume) && hasRestart && hasOpen;
        const secondaryRow = hasPush && hasAdd;
        const layoutOk = hasGrid3 && hasGrid2 && !hasPlaceholder;
        
        if (primaryRow) {
            console.log('✅ Primary row complete (Pause/Resume/Restart/Open)');
        } else {
            console.log('❌ Primary row incomplete');
        }
        
        if (secondaryRow) {
            console.log('✅ Secondary row complete (Push/Add)');
        } else {
            console.log('❌ Secondary row incomplete');
        }
        
        if (layoutOk) {
            console.log('✅ Layout correct (3-col + 2-col grids)');
        } else {
            console.log('❌ Layout issues');
        }
        
        const overall = primaryRow && secondaryRow && layoutOk;
        console.log(`\n${overall ? '✅ PASS' : '❌ FAIL'}`);
        
        return { passed: overall };
        
    } catch (error) {
        console.error('Error:', error.message);
        return { passed: false, error: error.message };
    } finally {
        await browser.close();
    }
}

testQuickActionsCorrectly().then(results => {
    process.exit(results.passed ? 0 : 1);
});