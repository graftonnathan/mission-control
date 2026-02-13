const { chromium } = require('playwright');

async function getQuickActionsContent() {
    console.log('Getting Quick Actions Content...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Get all HTML content
        const html = await page.content();
        
        // Look for Quick Actions section
        const quickActionsIndex = html.indexOf('Quick Actions');
        if (quickActionsIndex >= 0) {
            console.log('Found "Quick Actions" in HTML');
            console.log('\nContent around Quick Actions (500 chars):');
            console.log(html.substring(quickActionsIndex, quickActionsIndex + 500));
        }
        
        // Look for the project panel (should show when project is selected)
        // The panel title should be the project name
        const chickensIndex = html.indexOf('chickens');
        if (chickensIndex >= 0) {
            console.log('\n\nFound "chickens" in HTML');
            console.log('\nContent around chickens (500 chars):');
            console.log(html.substring(chickensIndex, chickensIndex + 500));
        }
        
        // Check if the panel with project name exists
        const panelMatch = html.match(/<h[1-6][^>]*>chickens<\/h[1-6]>/);
        if (panelMatch) {
            console.log('\n\nFound chickens as panel title!');
        } else {
            console.log('\n\nNo panel with chickens as title found');
        }
        
        // Look for grid patterns
        const grid3Match = html.match(/grid-cols-3[^>]*>([\s\S]*?)<\/div>/);
        if (grid3Match) {
            console.log('\n\nFound grid-cols-3 content:');
            console.log(grid3Match[0].substring(0, 500));
        }
        
        // Check for Pause text
        const pauseIndex = html.indexOf('Pause');
        if (pauseIndex >= 0) {
            console.log('\n\nFound "Pause" in HTML at position:', pauseIndex);
        } else {
            console.log('\n\nNo "Pause" found in HTML');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

getQuickActionsContent();