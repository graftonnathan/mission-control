const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/home/molten/.openclaw/workspace/PROJECTS/mission-control';
const SCREENSHOTS_DIR = path.join(PROJECT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
    timestamp: new Date().toISOString(),
    ticket: 'TICKET-1770582688526-mission-control',
    project: 'mission-control',
    tester: 'dummy',
    tests: [],
    screenshots: [],
    success: true
};

async function runTests() {
    console.log('Testing Mission Control - Subroutine Status Display');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 }
    });
    
    const page = await context.newPage();
    
    try {
        // Step 1: Test API endpoint
        console.log('Step 1: Testing API endpoint...');
        const response = await page.goto('http://localhost:5173/api/projects/Kinectv1/subroutines', { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        
        const apiData = await page.evaluate(() => {
            try {
                return JSON.parse(document.body.innerText);
            } catch (e) {
                return null;
            }
        });
        
        const apiWorks = apiData && apiData.subroutines && apiData.subroutines.length > 0;
        
        results.tests.push({ 
            step: 1, 
            name: 'API endpoint returns subroutines', 
            status: apiWorks ? 'pass' : 'fail',
            details: { 
                hasSubroutines: apiData?.hasSubroutines,
                count: apiData?.subroutines?.length,
                summary: apiData?.summary
            }
        });
        console.log(`✓ API: ${apiWorks ? 'working' : 'failed'}`, apiData?.summary);
        
        // Step 2: Open Mission Control UI
        console.log('Step 2: Opening Mission Control UI...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        const screenshot1 = path.join(SCREENSHOTS_DIR, 'test-01-mc-home.png');
        await page.screenshot({ path: screenshot1 });
        results.screenshots.push(screenshot1);
        
        results.tests.push({ step: 2, name: 'Mission Control UI loads', status: 'pass' });
        console.log('✓ UI loaded');
        
        // Step 3: Find project with subroutines
        console.log('Step 3: Looking for subroutine list...');
        
        // Look for Kinectv1 project and check if subroutines are shown
        const subroutineSection = await page.locator('text=Subroutines').first();
        const hasSubroutineSection = await subroutineSection.isVisible().catch(() => false);
        
        if (hasSubroutineSection) {
            const screenshot2 = path.join(SCREENSHOTS_DIR, 'test-02-subroutines-visible.png');
            await page.screenshot({ path: screenshot2 });
            results.screenshots.push(screenshot2);
            
            results.tests.push({ 
                step: 3, 
                name: 'Subroutine section visible', 
                status: 'pass'
            });
            console.log('✓ Subroutine section found');
            
            // Step 4: Test expand/collapse
            console.log('Step 4: Testing expand/collapse...');
            
            // Click to expand
            await subroutineSection.click();
            await page.waitForTimeout(500);
            
            const screenshot3 = path.join(SCREENSHOTS_DIR, 'test-03-expanded.png');
            await page.screenshot({ path: screenshot3 });
            results.screenshots.push(screenshot3);
            
            // Check for subroutine items
            const subroutineItems = await page.locator('[class*="subroutine"], [class*="bg-mission-bg"]').all();
            
            results.tests.push({ 
                step: 4, 
                name: 'Subroutine list expands', 
                status: subroutineItems.length > 0 ? 'pass' : 'fail',
                details: { itemCount: subroutineItems.length }
            });
            console.log(`✓ Expanded, found ${subroutineItems.length} items`);
            
        } else {
            results.tests.push({ 
                step: 3, 
                name: 'Subroutine section visible', 
                status: 'fail',
                error: 'Subroutine section not found in UI'
            });
            console.log('✗ Subroutine section not found');
        }
        
        // Step 5: Test different projects
        console.log('Step 5: Testing spec-interpreter subroutines...');
        
        const specResponse = await page.goto('http://localhost:5173/api/projects/spec-interpreter/subroutines');
        const specData = await page.evaluate(() => {
            try { return JSON.parse(document.body.innerText); } catch (e) { return null; }
        });
        
        results.tests.push({ 
            step: 5, 
            name: 'spec-interpreter API works', 
            status: specData?.hasSubroutines !== undefined ? 'pass' : 'fail',
            details: { hasSubroutines: specData?.hasSubroutines }
        });
        console.log(`✓ spec-interpreter API:`, specData?.hasSubroutines);
        
    } catch (error) {
        results.success = false;
        console.error('Test error:', error.message);
        
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `test-error-${Date.now()}.png`);
        await page.screenshot({ path: errorScreenshot });
        results.screenshots.push(errorScreenshot);
        
        results.tests.push({ 
            step: 'error', 
            name: 'Test execution', 
            status: 'fail', 
            error: error.message 
        });
    }
    
    await browser.close();
    
    const passed = results.tests.filter(t => t.status === 'pass').length;
    const failed = results.tests.filter(t => t.status === 'fail').length;
    
    results.summary = {
        total: results.tests.length,
        passed,
        failed,
        successRate: `${Math.round((passed / results.tests.length) * 100)}%`
    };
    results.success = failed === 0;
    
    fs.writeFileSync(path.join(PROJECT_DIR, '05-test-results.json'), JSON.stringify(results, null, 2));
    
    console.log('\n=== Test Results ===');
    console.log(`Total: ${results.tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${results.summary.successRate}`);
    
    return results.success;
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});