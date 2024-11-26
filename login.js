const { chromium } = require('playwright');

async function loginToWebHostMost(username, password) {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto('https://webhostmost.com/login');

    // Wait for login form to load
    await page.waitForSelector('input[name="username"]');

    // Fill in login credentials
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    // Handle potential reCAPTCHA or hidden challenges
    let loginAttempts = 0;
    let loginSuccess = false;

    while (loginAttempts < 2 && !loginSuccess) {
      try {
        // Advanced reCAPTCHA/Challenge detection and handling
        const challengeElements = [
          'iframe[src*="recaptcha"]',
          '[data-testid="challenge"]',
          '.captcha-container'
        ];

        const challengeSelector = challengeElements.join(',');
        
        // Check for challenge elements
        const challengeExists = await page.locator(challengeSelector).count() > 0;

        if (challengeExists) {
          console.log('Captcha or challenge detected. Attempting manual bypass...');
          
          // Optional: Look for alternative interaction methods
          const invisibleCheckbox = await page.locator('input[type="checkbox"][style*="hidden"]');
          if (await invisibleCheckbox.count() > 0) {
            await invisibleCheckbox.first().click();
          }

          // Additional interaction to simulate human behavior
          await page.mouse.move(
            Math.random() * 500, 
            Math.random() * 500
          );
          await page.mouse.down();
          await page.mouse.up();
        }

        // Click login button with careful timing
        await page.click('button[type="submit"]', { 
          delay: Math.random() * 500 + 300 
        });

        // Wait for potential navigation or error
        await page.waitForURL('https://webhostmost.com/clientarea.php', {
          timeout: 10000
        });

        loginSuccess = true;
        console.log(`Login successful for user: ${username}`);

      } catch (loginError) {
        loginAttempts++;
        console.log(`Login attempt ${loginAttempts} failed for ${username}`);
        
        // Exponential backoff
        await page.waitForTimeout(2000 * loginAttempts);
      }
    }

    if (!loginSuccess) {
      throw new Error(`Failed to login after 2 attempts for ${username}`);
    }

    // Take screenshot as proof of successful login
    await page.screenshot({ 
      path: `login_${username}_success.png`,
      fullPage: true 
    });

  } catch (error) {
    console.error(`Login process error: ${error.message}`);
    
    // Optional: Screenshot of error state
    await page.screenshot({ 
      path: `login_${username}_error.png`,
      fullPage: true 
    });

    process.exit(1);
  } finally {
    await browser.close();
  }
}

async function main() {
  const usernames = process.env.USERNAMES.split(',');
  const passwords = process.env.PASSWORDS.split(',');

  if (usernames.length !== passwords.length) {
    console.error('Usernames and passwords count do not match');
    process.exit(1);
  }

  for (let i = 0; i < usernames.length; i++) {
    await loginToWebHostMost(usernames[i].trim(), passwords[i].trim());
  }
}

main().catch(console.error);
