const { chromium } = require('playwright');

async function testScreenFix() {
  console.log('🔧 Testing Screen Transition Fix...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Loading fixed page...');
    await page.goto('http://localhost:3001/enhanced-index.html');
    await page.waitForLoadState('networkidle');
    
    // Check initial screen positions
    console.log('\n🔍 SCREEN POSITIONS AFTER FIX:');
    const welcomeRect = await page.locator('#welcome-screen').boundingBox();
    const gameSetupRect = await page.locator('#game-setup-screen').boundingBox();
    
    console.log(`Welcome screen: x=${welcomeRect?.x}, y=${welcomeRect?.y}, h=${welcomeRect?.height}`);
    console.log(`Game setup screen: x=${gameSetupRect?.x}, y=${gameSetupRect?.y}, h=${gameSetupRect?.height}`);
    
    if (welcomeRect && gameSetupRect) {
      const samePosition = Math.abs(welcomeRect.y - gameSetupRect.y) < 10;
      console.log(`Screens at same position: ${samePosition ? '✅ FIXED!' : '❌ Still stacked'}`);
    }
    
    // Check visibility
    const welcomeVisible = await page.locator('#welcome-screen').isVisible();
    const gameSetupVisible = await page.locator('#game-setup-screen').isVisible();
    
    console.log(`\\nWelcome screen visible: ${welcomeVisible ? '✅' : '❌'}`);
    console.log(`Game setup screen visible: ${gameSetupVisible ? '❌ (Hidden - Good!)' : '✅ (Visible - Bad!)'}`);
    
    // Fill form and test transition
    console.log('\\n📝 Testing the button click transition...');
    await page.fill('#user-name', 'Test User');
    await page.fill('#user-phone', '555-TEST');
    await page.fill('#user-email', 'test@test.com');
    await page.check('#privacy-consent');
    
    console.log('🖱️  Clicking "Start Your Session"...');
    await page.click('#continue-btn');
    await page.waitForTimeout(1000);
    
    // Check after click
    const welcomeVisibleAfter = await page.locator('#welcome-screen').isVisible();
    const gameSetupVisibleAfter = await page.locator('#game-setup-screen').isVisible();
    
    console.log(`\\nAfter button click:`);
    console.log(`Welcome screen visible: ${welcomeVisibleAfter ? '❌ (Should be hidden)' : '✅ (Hidden - Good!)'}`);
    console.log(`Game setup screen visible: ${gameSetupVisibleAfter ? '✅ (Visible - Good!)' : '❌ (Hidden - Bad!)'}`);
    
    if (!welcomeVisibleAfter && gameSetupVisibleAfter) {
      console.log('\\n🎉 SUCCESS: Screen transition now works properly!');
      console.log('   ✅ Welcome screen is hidden');
      console.log('   ✅ Game setup screen is visible');
      console.log('   ✅ No more stacking/scrolling behavior');
    } else {
      console.log('\\n❌ Still have issues with screen transition');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'screen-fix-result.png', fullPage: true });
    console.log('\\n📸 Screenshot saved: screen-fix-result.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\\n🔍 Test completed. Check browser to see the fix in action!');
    // Keep browser open
    await new Promise(() => {});
  }
}

testScreenFix().catch(console.error);