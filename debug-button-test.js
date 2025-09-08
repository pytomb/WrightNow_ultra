const { chromium } = require('playwright');

async function debugButtonIssue() {
  console.log('🔍 Starting button debug test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down actions to see them
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the enhanced version
    console.log('📍 Navigating to enhanced-index.html...');
    await page.goto('http://localhost:3001/enhanced-index.html');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded successfully\n');
    
    // Listen to console logs to see our debug messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🖥️  CONSOLE [${type}]: ${text}`);
    });
    
    // Check if the button exists
    console.log('🔍 Checking if "Start Your Session" button exists...');
    const continueButton = await page.locator('#continue-btn');
    const buttonExists = await continueButton.count() > 0;
    console.log(`Button exists: ${buttonExists ? '✅' : '❌'}`);
    
    if (buttonExists) {
      // Check button properties
      const isVisible = await continueButton.isVisible();
      const isEnabled = await continueButton.isEnabled();
      const buttonText = await continueButton.textContent();
      
      console.log(`Button visible: ${isVisible ? '✅' : '❌'}`);
      console.log(`Button enabled: ${isEnabled ? '✅' : '❌'}`);
      console.log(`Button text: "${buttonText}"`);
    }
    
    // Fill out the form with test data
    console.log('\n📝 Filling out form with test data...');
    await page.fill('#user-name', 'Tiger Woods');
    await page.fill('#user-phone', '555-GOLF-PRO');
    await page.fill('#user-email', 'tiger@golf.com');
    await page.check('#privacy-consent');
    console.log('✅ Form filled successfully');
    
    // Try clicking the button
    console.log('\n🖱️  Attempting to click "Start Your Session" button...');
    await continueButton.click();
    
    // Wait a moment to see what happens
    await page.waitForTimeout(3000);
    
    // Check if we moved to the next screen
    console.log('\n🖥️  Checking current screen state...');
    const welcomeScreen = await page.locator('#welcome-screen.active').count();
    const gameSetupScreen = await page.locator('#game-setup-screen.active').count();
    
    console.log(`Welcome screen active: ${welcomeScreen > 0 ? '✅' : '❌'}`);
    console.log(`Game setup screen active: ${gameSetupScreen > 0 ? '✅' : '❌'}`);
    
    if (gameSetupScreen > 0) {
      console.log('🎉 SUCCESS: Button click worked and screen transitioned!');
    } else {
      console.log('❌ FAILURE: Button click did not trigger screen transition');
      
      // Let's investigate further
      console.log('\n🔍 Additional debugging...');
      
      // Check if the showScreen function exists
      const showScreenExists = await page.evaluate(() => {
        return typeof showScreen !== 'undefined';
      });
      console.log(`showScreen function exists: ${showScreenExists ? '✅' : '❌'}`);
      
      // Check if the event listener was attached
      const eventListenerInfo = await page.evaluate(() => {
        const btn = document.getElementById('continue-btn');
        return {
          hasClickHandler: btn && btn.onclick !== null,
          elementFound: !!btn
        };
      });
      console.log(`Button element found: ${eventListenerInfo.elementFound ? '✅' : '❌'}`);
      console.log(`Click handler attached: ${eventListenerInfo.hasClickHandler ? '✅' : '❌'}`);
    }
    
    // Take a screenshot for visual reference
    await page.screenshot({ path: 'debug-button-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as debug-button-test.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🔍 Test completed. Browser will remain open for manual inspection...');
    // Keep browser open for manual inspection
    await new Promise(() => {});
  }
}

// Run the debug test
debugButtonIssue().catch(console.error);