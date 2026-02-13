const { chromium } = require('playwright');

async function findProjectElements() {
    console.log('Finding Project Elements...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Get all elements with click handlers or that look like cards
        const html = await page.content();
        
        // Look for chickens in the Projects section
        const projectsIndex = html.indexOf('Projects');
        const projectsSection = html.substring(projectsIndex, projectsIndex + 2000);
        
        console.log('Projects section (first 1500 chars):');
        console.log(projectsSection.substring(0, 1500));
        
        // Look for clickable elements with project names
        console.log('\n\nSearching for clickable project elements...');
        
        // Find all elements containing "chickens" in the projects section
        const chickensMatches = projectsSection.match(/<[^>]*chickens[^>]*>/gi);
        if (chickensMatches) {
            console.log(`\nFound ${chickensMatches.length} elements with "chickens":`);
            chickensMatches.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

findProjectElements();