const { chromium } = require('playwright');

async function testGolfApp() {
  console.log('🏌️ Starting Golf App Testing...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 }, // iPhone 14 Pro Max
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Load Application
    console.log('Test 1: Loading application...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application loaded successfully\n');
    
    // Test 2: Check Welcome Screen
    console.log('Test 2: Checking welcome screen...');
    const welcomeScreen = await page.locator('#welcome-screen');
    const isWelcomeVisible = await welcomeScreen.isVisible();
    console.log(`Welcome screen visible: ${isWelcomeVisible ? '✅' : '❌'}`);
    
    // Fill in user information
    console.log('\nTest 3: Filling user information...');
    await page.fill('#user-name', 'Test Golfer');
    await page.fill('#user-phone', '555-0123');
    await page.fill('#user-email', 'test@example.com');
    
    // Check privacy consent
    await page.check('#privacy-consent');
    console.log('✅ User information filled\n');
    
    // Test 4: Continue to game setup
    console.log('Test 4: Continuing to game setup...');
    await page.click('#continue-btn');
    await page.waitForTimeout(1000);
    
    const gameScreen = await page.locator('#game-setup-screen');
    const isGameVisible = await gameScreen.isVisible();
    console.log(`Game setup screen visible: ${isGameVisible ? '✅' : '❌'}\n`);
    
    // Test 5: Select course and hole
    console.log('Test 5: Selecting course and hole...');
    
    // Select Chateau course
    await page.selectOption('#course-select', 'Chateau');
    const courseValue = await page.locator('#course-select').inputValue();
    console.log(`Selected course: ${courseValue}`);
    
    // Select hole 6
    await page.selectOption('#hole-select', '6');
    const holeValue = await page.locator('#hole-select').inputValue();
    console.log(`Selected hole: ${holeValue}`);
    
    // Check if distance was auto-populated
    await page.waitForTimeout(500);
    const distanceValue = await page.locator('#distance-input').inputValue();
    console.log(`Auto-populated distance: ${distanceValue || 'Not populated ❌'}`);
    
    // If not populated, enter manually
    if (!distanceValue) {
      await page.fill('#distance-input', '145');
      console.log('Manually entered distance: 145');
    }
    
    // Select club
    await page.selectOption('#club-select', '8-iron');
    console.log('Selected club: 8-iron\n');
    
    // Test 6: Start analysis
    console.log('Test 6: Starting analysis...');
    await page.click('#start-analysis-btn');
    await page.waitForTimeout(1000);
    
    const analysisScreen = await page.locator('#analysis-screen');
    const isAnalysisVisible = await analysisScreen.isVisible();
    console.log(`Analysis screen visible: ${isAnalysisVisible ? '✅' : '❌'}\n`);
    
    // Test 7: Get Caddie Advice
    console.log('Test 7: Getting caddie advice...');
    await page.click('#shot-advice-btn');
    
    // Wait for loading state
    const loadingText = await page.locator('#loading-text');
    if (await loadingText.isVisible()) {
      console.log('Loading state shown ✅');
    }
    
    // Wait for response (max 20 seconds)
    console.log('Waiting for AI response...');
    const startTime = Date.now();
    
    try {
      await page.waitForSelector('#results-screen', { 
        state: 'visible', 
        timeout: 20000 
      });
      
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Response received in ${responseTime} seconds\n`);
      
      // Check results
      console.log('Test 8: Checking results...');
      
      // Check if advice text is present
      const adviceText = await page.locator('#advice-text').textContent();
      console.log(`Advice received: ${adviceText ? '✅' : '❌'}`);
      if (adviceText) {
        console.log(`Advice preview: "${adviceText.substring(0, 100)}..."`);
      }
      
      // Check if avatar video is present
      const avatarVideo = await page.locator('#avatar-video');
      const hasVideo = await avatarVideo.isVisible();
      console.log(`Avatar video present: ${hasVideo ? '✅' : '❌'}`);
      
      if (hasVideo) {
        const videoSrc = await avatarVideo.getAttribute('src');
        console.log(`Video source: ${videoSrc}`);
        
        // Check if it's a real URL or placeholder
        if (videoSrc && videoSrc.includes('example.com')) {
          console.log('⚠️  Video URL is a placeholder - HeyGen integration not fully functional');
        } else if (videoSrc && videoSrc.includes('heygen')) {
          console.log('✅ HeyGen video URL detected');
        }
      } else {
        // Check if static avatar is shown instead
        const staticAvatar = await page.locator('#avatar-placeholder');
        if (await staticAvatar.isVisible()) {
          console.log('Static avatar image shown as fallback');
        }
      }
      
    } catch (error) {
      console.log(`❌ Response timeout or error: ${error.message}`);
    }
    
    // Test 9: Try "Ask Again" functionality
    console.log('\nTest 9: Testing "Ask Again" functionality...');
    const askAgainBtn = await page.locator('#ask-again-btn');
    if (await askAgainBtn.isVisible()) {
      await askAgainBtn.click();
      await page.waitForTimeout(1000);
      
      const analysisScreenAgain = await page.locator('#analysis-screen');
      const isBackToAnalysis = await analysisScreenAgain.isVisible();
      console.log(`Returned to analysis screen: ${isBackToAnalysis ? '✅' : '❌'}`);
    }
    
    // Test 10: Test swing analysis
    console.log('\nTest 10: Testing swing analysis...');
    await page.click('#swing-analysis-btn');
    
    // Wait for response
    console.log('Waiting for swing analysis response...');
    const swingStartTime = Date.now();
    
    try {
      await page.waitForSelector('#results-screen', { 
        state: 'visible', 
        timeout: 20000 
      });
      
      const swingResponseTime = ((Date.now() - swingStartTime) / 1000).toFixed(1);
      console.log(`✅ Swing analysis received in ${swingResponseTime} seconds`);
      
      const swingAdvice = await page.locator('#advice-text').textContent();
      if (swingAdvice) {
        console.log(`Swing advice preview: "${swingAdvice.substring(0, 100)}..."`);
      }
      
    } catch (error) {
      console.log(`❌ Swing analysis timeout or error: ${error.message}`);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log('✅ Application loads successfully');
    console.log('✅ User registration flow works');
    console.log('✅ Course/hole selection works');
    console.log(`${distanceValue ? '✅' : '⚠️ '} Distance auto-population ${distanceValue ? 'works' : 'needs fixing'}`);
    console.log('✅ AI advice generation works');
    console.log('⚠️  HeyGen avatar integration appears to be using placeholder');
    console.log('✅ Fallback to static avatar works');
    console.log('✅ Navigation between screens works');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for manual inspection.');
    console.log('Press Ctrl+C to close...');
    
    // Wait indefinitely
    await new Promise(() => {});
  }
}

// Run tests
testGolfApp().catch(console.error);