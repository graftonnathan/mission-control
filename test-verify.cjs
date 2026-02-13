const { chromium } = require('playwright');

async function verifyImplementation() {
    console.log('Verifying Quick Actions Implementation...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Click on a project
        const projectCards = await page.locator('.cursor-pointer').all();
        for (const card of projectCards) {
            const text = await card.textContent();
            if (text.includes('mission-control') || text.includes('chickens')) {
                await card.click();
                await page.waitForTimeout(2000);
                break;
            }
        }
        
        // Get the Quick Actions panel specifically
        const quickActionsPanel = await page.evaluate(() => {
            // Find the Quick Actions panel
            const headers = document.querySelectorAll('h3');
            for (const h of headers) {
                if (h.textContent.trim() === 'Quick Actions') {
                    // Get the parent container
                    let parent = h.parentElement;
                    while (parent && !parent.classList.contains('bg-mission-panel')) {
                        parent = parent.parentElement;
                    }
                    
                    if (parent) {
                        return {
                            found: true,
                            title: h.textContent,
                            content: parent.textContent,
                            hasPlaceholder: parent.textContent.includes('Select a project'),
                            hasPause: parent.textContent.includes('Pause'),
                            hasRestart: parent.textContent.includes('Restart'),
                            hasOpen: parent.textContent.includes('Open'),
                            hasPush: parent.textContent.includes('Push'),
                            hasAdd: parent.textContent.includes('Add')
                        };
                    }
                }
            }
            return { found: false };
        });
        
        console.log('Quick Actions Panel Analysis:');
        console.log(`  Found: ${quickActionsPanel.found}`);
        console.log(`  Has Placeholder: ${quickActionsPanel.hasPlaceholder}`);
        console.log(`  Has Pause: ${quickActionsPanel.hasPause}`);
        console.log(`  Has Restart: ${quickActionsPanel.hasRestart}`);
        console.log(`  Has Open: ${quickActionsPanel.hasOpen}`);
        console.log(`  Has Push: ${quickActionsPanel.hasPush}`);
        console.log(`  Has Add: ${quickActionsPanel.hasAdd}`);
        
        if (quickActionsPanel.found) {
            console.log('\nPanel content preview:');
            console.log(quickActionsPanel.content.substring(0, 600));
        }
        
        // Check for the project-specific panel (the one with project name as title)
        const projectPanel = await page.evaluate(() => {
            const headers = document.querySelectorAll('h3');
            for (const h of headers) {
                const text = h.textContent.trim();
                if (text && text !== 'Quick Actions' && text !== 'Tokens' && text !== 'Recent Activity' && text !== 'Log' && text !== 'Projects' && text !== 'Agents' && text !== 'Tickets') {
                    // This might be a project panel
                    let parent = h.parentElement;
                    while (parent && parent.tagName !== 'BODY') {
                        const parentText = parent.textContent;
                        if (parentText.includes('Pause') || parentText.includes('Restart')) {
                            return {
                                found: true,
                                title: text,
                                hasPause: parentText.includes('Pause'),
                                hasRestart: parentText.includes('Restart'),
                                hasOpen: parentText.includes('Open'),
                                hasPush: parentText.includes('Push'),
                                hasAdd: parentText.includes('Add')
                            };
                        }
                        parent = parent.parentElement;
                    }
                }
            }
            return { found: false };
        });
        
        if (projectPanel.found) {
            console.log('\n\nProject Panel Analysis:');
            console.log(`  Title: ${projectPanel.title}`);
            console.log(`  Has Pause: ${projectPanel.hasPause}`);
            console.log(`  Has Restart: ${projectPanel.hasRestart}`);
            console.log(`  Has Open: ${projectPanel.hasOpen}`);
            console.log(`  Has Push: ${projectPanel.hasPush}`);
            console.log(`  Has Add: ${projectPanel.hasAdd}`);
        }
        
        // Final assessment
        console.log('\n=== FINAL VERIFICATION ===');
        
        // The buttons exist on the page - that's what matters
        const allButtonsExist = quickActionsPanel.hasPause && 
                                quickActionsPanel.hasRestart && 
                                quickActionsPanel.hasOpen && 
                                quickActionsPanel.hasPush && 
                                quickActionsPanel.hasAdd;
        
        if (allButtonsExist) {
            console.log('✅ ALL BUTTONS PRESENT');
            console.log('  - Pause/Resume');
            console.log('  - Restart');
            console.log('  - Open');
            console.log('  - Push');
            console.log('  - Add');
        } else {
            console.log('❌ Some buttons missing');
        }
        
        // Check grids
        const html = await page.content();
        const hasGrid3 = html.includes('grid-cols-3');
        const hasGrid2 = html.includes('grid-cols-2');
        
        if (hasGrid3 && hasGrid2) {
            console.log('✅ CORRECT LAYOUT (3-col + 2-col grids)');
        } else {
            console.log('❌ Layout incorrect');
        }
        
        const overall = allButtonsExist && hasGrid3 && hasGrid2;
        console.log(`\n${overall ? '✅ PASS' : '❌ FAIL'}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

verifyImplementation();