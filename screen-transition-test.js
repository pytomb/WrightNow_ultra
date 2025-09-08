const { chromium } = require('playwright');

async function testScreenTransition() {
  console.log('🖥️  Testing Screen Transition Behavior...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 // Very slow to clearly see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Loading page...');
    await page.goto('http://localhost:3001/enhanced-index.html');
    await page.waitForLoadState('networkidle');
    
    // Check initial screen state
    console.log('\n🔍 INITIAL SCREEN STATE:');
    const welcomeVisible = await page.locator('#welcome-screen').isVisible();
    const gameSetupVisible = await page.locator('#game-setup-screen').isVisible();
    const welcomeHasActive = await page.locator('#welcome-screen.active').count() > 0;
    const gameSetupHasActive = await page.locator('#game-setup-screen.active').count() > 0;
    
    console.log(`Welcome screen visible: ${welcomeVisible ? '✅' : '❌'}`);
    console.log(`Welcome screen has "active" class: ${welcomeHasActive ? '✅' : '❌'}`);
    console.log(`Game setup screen visible: ${gameSetupVisible ? '✅' : '❌'}`);
    console.log(`Game setup screen has "active" class: ${gameSetupHasActive ? '✅' : '❌'}`);
    
    // Check if both screens are positioned on top of each other
    const welcomeRect = await page.locator('#welcome-screen').boundingBox();
    const gameSetupRect = await page.locator('#game-setup-screen').boundingBox();
    
    console.log(`\\nWelcome screen position: x=${welcomeRect?.x}, y=${welcomeRect?.y}, h=${welcomeRect?.height}`);
    console.log(`Game setup screen position: x=${gameSetupRect?.x}, y=${gameSetupRect?.y}, h=${gameSetupRect?.height}`);
    
    if (welcomeRect && gameSetupRect) {
      const overlap = Math.abs(welcomeRect.y - gameSetupRect.y) < 50;
      console.log(`Screens overlap/same position: ${overlap ? '✅ (Normal)' : '❌ (Issue!)'}`);
    }
    
    // Fill form and test button
    console.log('\\n📝 Filling form and testing button click...');
    await page.fill('#user-name', 'Test User');
    await page.fill('#user-phone', '555-TEST');
    await page.fill('#user-email', 'test@test.com');
    await page.check('#privacy-consent');
    
    // Take screenshot before click
    await page.screenshot({ path: 'before-button-click.png', fullPage: true });
    console.log('📸 Screenshot taken: before-button-click.png');
    
    // Click the button and monitor what happens
    console.log('\\n🖱️  Clicking "Start Your Session" button...');
    await page.click('#continue-btn');
    
    // Wait a moment then check screen state
    await page.waitForTimeout(1000);
    
    console.log('\\n🔍 SCREEN STATE AFTER BUTTON CLICK:');
    const welcomeVisibleAfter = await page.locator('#welcome-screen').isVisible();
    const gameSetupVisibleAfter = await page.locator('#game-setup-screen').isVisible();
    const welcomeActiveAfter = await page.locator('#welcome-screen.active').count() > 0;
    const gameSetupActiveAfter = await page.locator('#game-setup-screen.active').count() > 0;
    
    console.log(`Welcome screen visible: ${welcomeVisibleAfter ? '✅' : '❌'}`);
    console.log(`Welcome screen has "active" class: ${welcomeActiveAfter ? '✅' : '❌'}`);
    console.log(`Game setup screen visible: ${gameSetupVisibleAfter ? '✅' : '❌'}`);
    console.log(`Game setup screen has "active" class: ${gameSetupActiveAfter ? '✅' : '❌'}`);
    
    // Take screenshot after click
    await page.screenshot({ path: 'after-button-click.png', fullPage: true });
    console.log('📸 Screenshot taken: after-button-click.png');
    
    // Check if transition actually happened
    if (!welcomeActiveAfter && gameSetupActiveAfter) {
      console.log('\\n✅ SUCCESS: Screen transition worked correctly!');
      console.log('   Welcome screen deactivated, Game setup screen activated');
    } else if (welcomeActiveAfter && !gameSetupActiveAfter) {
      console.log('\\n❌ ISSUE: Still on welcome screen - transition failed');
    } else if (welcomeActiveAfter && gameSetupActiveAfter) {
      console.log('\\n❌ ISSUE: Both screens active simultaneously');
    } else {
      console.log('\\n❌ ISSUE: Neither screen active - lost state');
    }
    
    // Test if we can see different content
    console.log('\\n🔍 CONTENT VISIBILITY TEST:');
    
    try {
      // Elements that should only be visible on welcome screen
      const userNameField = await page.locator('#user-name').isVisible();
      console.log(`User name field (welcome screen): ${userNameField ? 'Visible' : 'Hidden'}`);
      
      // Elements that should only be visible on game setup screen  
      const courseSelect = await page.locator('#course-select').isVisible();
      console.log(`Course select (game setup screen): ${courseSelect ? 'Visible' : 'Hidden'}`);
      
      if (!userNameField && courseSelect) {
        console.log('✅ Content correctly switched to game setup screen');
      } else if (userNameField && !courseSelect) {
        console.log('❌ Content still showing welcome screen');
      } else if (userNameField && courseSelect) {
        console.log('❌ PROBLEM: Both screens\' content visible simultaneously');
      }
      
    } catch (error) {
      console.log('Error checking content visibility:', error.message);
    }
    
    // Let's also test the showScreen function directly
    console.log('\\n🧪 DIRECT showScreen FUNCTION TEST:');
    await page.evaluate(() => {
      console.log('Testing showScreen function directly...');
      if (typeof showScreen === 'function') {
        console.log('showScreen function exists');
        showScreen('game-setup-screen');
        console.log('Called showScreen("game-setup-screen")');
      } else {
        console.log('ERROR: showScreen function not found');
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Final state check
    const finalGameSetupActive = await page.locator('#game-setup-screen.active').count() > 0;
    console.log(`Game setup screen active after direct call: ${finalGameSetupActive ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\\n🔍 Test completed. Check the screenshots and browser for visual verification.');
    console.log('📸 Compare before-button-click.png and after-button-click.png');
    
    // Keep browser open for manual inspection
    await new Promise(() => {});
  }
}

testScreenTransition().catch(console.error);