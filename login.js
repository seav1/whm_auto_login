const { chromium } = require('playwright-extra');
const RecaptchaSolver = require('recaptcha-solver');

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

    // Handle reCAPTCHA (if present)
    let loginAttempts = 0;
    let loginSuccess = false;

    while (loginAttempts < 2 && !loginSuccess) {
      try {
        // Try to solve hidden captcha if exists
        const recaptchaFrame = await page.frames().find(
          frame => frame.url().includes('recaptcha')
        );

        if (recaptchaFrame) {
          const solver = new RecaptchaSolver();
          await solver.solve(recaptchaFrame);
        }

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for navigation or error
        await page.waitForNavigation({
          url: 'https://webhostmost.com/clientarea.php',
          timeout: 10000
        });

        loginSuccess = true;
        console.log(`Login successful for user: ${username}`);
      } catch (loginError) {
        loginAttempts++;
        console.log(`Login attempt ${loginAttempts} failed for ${username}`);
        
        // Wait a bit before retrying
        await page.waitForTimeout(2000);
      }
    }

    if (!loginSuccess) {
      throw new Error(`Failed to login after 2 attempts for ${username}`);
    }

    // Optional: Take screenshot or perform additional actions
    await page.screenshot({ path: `login_${username}.png` });

  } catch (error) {
    console.error(`Error during login process: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Main execution
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
