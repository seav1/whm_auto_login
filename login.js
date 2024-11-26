const { chromium } = require('playwright-extra');
const playwrightStealth = require('playwright-extra-plugin-stealth');
const { chromium: playwright } = require('playwright');

const stealth = playwrightStealth();

chromium.use(stealth);

const USERS = process.env.USERNAMES.split(',');
const PASSWORDS = process.env.PASSWORDS.split(',');

(async () => {
  if (USERS.length !== PASSWORDS.length) {
    console.log("Number of usernames and passwords don't match!");
    process.exit(1);
  }

  for (let i = 0; i < USERS.length; i++) {
    await login(USERS[i], PASSWORDS[i]);
  }
})();

async function login(username, password) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log(`Attempting to log in as ${username}`);

    // Navigate to the login page
    await page.goto('https://webhostmost.com/login');

    // Input username and password
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    // Try to submit login and handle the CAPTCHA
    await submitLogin(page);

    // If login is successful, it will redirect to the clientarea page
    if (page.url() === 'https://webhostmost.com/clientarea.php') {
      console.log(`Login successful for ${username}!`);
    } else {
      console.log(`Login failed for ${username}`);
    }
  } catch (error) {
    console.error(`Error during login for ${username}:`, error);
  } finally {
    await browser.close();
  }
}

async function submitLogin(page) {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`Attempt #${attempt} to submit login`);
    await page.click('button[name="login"]');
    
    // Wait for potential captcha and try to solve it if shown
    try {
      await page.waitForSelector('div.captcha', { timeout: 5000 });
      console.log('Captcha detected, retrying...');
      
      // Wait for the CAPTCHA and try to handle it (this can be customized depending on how CAPTCHA works)
      await page.waitForTimeout(3000); // Wait for CAPTCHA to show up (example timeout)
      
      if (attempt === maxAttempts) {
        console.log('Captcha failed after 3 attempts.');
        break;
      }
    } catch (error) {
      // No CAPTCHA detected, move forward
      break;
    }
  }
}
