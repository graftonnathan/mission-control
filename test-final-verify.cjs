const { chromium } = require('playwright');

async function finalVerification() {
    console.log('Final Verification of Quick Actions...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Click on a project
        const projectCards = await page.locator('.cursor-pointer').all();
        for (const card of projectCards) {
            const text = await card.textContent();
            if (text.includes('mission-control')) {
                await card.click();
                await page.waitForTimeout(2000);
                break;
            }
        }
        
        // Get the project panel content
        const projectPanel = await page.evaluate(() => {
            const headers = document.querySelectorAll('h3');
            for (const h of headers) {
                const text = h.textContent.trim();
                // Look for project panel (has project name as title)
                if (text && ['mission-control', 'chickens', 'snek', 'spec-interpreter', 'kinectv1'].some(p => text.includes(p))) {
                    let parent = h.parentElement;
                    while (parent && parent.tagName !== 'BODY') {
                        const parentText = parent.textContent;
                        return {
                            found: true,
                            title: text,
                            fullContent: parentText,
                            hasPause: parentText.includes('Pause'),
                            hasRestart: parentText.includes('Restart'),
                            hasOpen: parentText.includes('Open'),
                            hasPush: parentText.includes('Push'),
                            hasAdd: parentText.includes('Add'),
                            hasOpenLink: parentText.includes('Open →'),
                            // Check if Open is in a button/primary row vs status bar
                            openInButton: parentText.match(/Open[\s\S]{0,50}Pause|Pause[\s\S]{0,50}Open/) !== null
                        };
                    }
                }
            }
            return { found: false };
        });
        
        console.log('=== VERIFICATION RESULTS ===\n');
        
        if (projectPanel.found) {
            console.log(`Project Panel: ${projectPanel.title}`);
            console.log('');
            
            // Check buttons
            console.log('Button Presence:');
            console.log(`  Pause: ${projectPanel.hasPause ? '✅' : '❌'}`);
            console.log(`  Restart: ${projectPanel.hasRestart ? '✅' : '❌'}`);
            console.log(`  Open: ${projectPanel.hasOpen ? '✅' : '❌'}`);
            console.log(`  Push: ${projectPanel.hasPush ? '✅' : '❌'}`);
            console.log(`  Add: ${projectPanel.hasAdd ? '✅' : '❌'}`);
            console.log('');
            
            // Check status bar
            console.log('Status Bar Check:');
            if (projectPanel.hasOpenLink) {
                console.log('  ❌ Open link found in status bar (should be removed)');
            } else {
                console.log('  ✅ No Open link in status bar');
            }
            console.log('');
            
            // Check button organization
            console.log('Button Organization:');
            if (projectPanel.openInButton) {
                console.log('  ✅ Open is grouped with Pause/Restart (primary row)');
            } else {
                console.log('  ❌ Open may not be in primary row');
            }
            
            // Check layout
            const html = await page.content();
            const hasGrid3 = html.includes('grid-cols-3');
            const hasGrid2 = html.includes('grid-cols-2');
            
            console.log('');
            console.log('Layout:');
            console.log(`  3-column grid: ${hasGrid3 ? '✅' : '❌'}`);
            console.log(`  2-column grid: ${hasGrid2 ? '✅' : '❌'}`);
            
            // Overall result
            console.log('');
            console.log('=== OVERALL ===');
            
            const allButtons = projectPanel.hasPause && projectPanel.hasRestart && 
                              projectPanel.hasOpen && projectPanel.hasPush && projectPanel.hasAdd;
            const statusBarOk = !projectPanel.hasOpenLink;
            const layoutOk = hasGrid3 && hasGrid2;
            const organizationOk = projectPanel.openInButton;
            
            if (allButtons) {
                console.log('✅ All buttons present');
            } else {
                console.log('❌ Missing buttons');
            }
            
            if (statusBarOk) {
                console.log('✅ Status bar simplified (no Open link)');
            } else {
                console.log('❌ Status bar still has Open link');
            }
            
            if (organizationOk) {
                console.log('✅ Buttons properly organized');
            }
            
            if (layoutOk) {
                console.log('✅ Correct grid layout');
            }
            
            const pass = allButtons && statusBarOk && layoutOk;
            console.log('');
            console.log(`${pass ? '✅ TEST PASSED' : '❌ TEST FAILED'}`);
            
        } else {
            console.log('❌ Project panel not found');
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/mission-control/screenshots/final-verification.png',
            fullPage: true
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

finalVerification();