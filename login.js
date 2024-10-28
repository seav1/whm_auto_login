const { chromium } = require('playwright');
const axios = require('axios');

(async () => {
  const browser = await chromium.launch();

  const usernames = process.env.USERNAMES.split(',');
  const passwords = process.env.PASSWORDS.split(',');

  for (let i = 0; i < usernames.length; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('https://webhostmost.com/login');
      await page.fill('input[name="username"]', usernames[i]);
      await page.fill('input[name="password"]', passwords[i]);
      await page.click('button[type="submit"]');

      // Wait for reCAPTCHA to appear
      await page.waitForSelector('iframe[title="reCAPTCHA"]');

      // Solve reCAPTCHA using TrueCaptcha
      const captchaResponse = await solveCaptcha(page);
      await page.evaluate(`document.getElementById('g-recaptcha-response').innerHTML="${captchaResponse}";`);

      // Submit the form
      await page.click('button[type="submit"]');

      // Check if login was successful
      await page.waitForURL('https://webhostmost.com/clientarea.php', { timeout: 60000 });

      console.log(`User ${usernames[i]} logged in successfully!`);

    } catch (error) {
      console.error(`User ${usernames[i]} login failed:`, error);
    } finally {
      await context.close();
    }
  }

  await browser.close();
})();

async function solveCaptcha(page) {
  const captchaImage = await page.$eval('iframe[title="reCAPTCHA"]', iframe => {
    const rect = iframe.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  });

  const screenshot = await page.screenshot({
    clip: {
      x: captchaImage.x,
      y: captchaImage.y,
      width: captchaImage.width,
      height: captchaImage.height
    }
  });

  const response = await axios.post('https://api.truecaptcha.org/solve', {
    image: screenshot.toString('base64'),
    userid: process.env.TRUECAPTCHA_USERID,
    apikey: process.env.TRUECAPTCHA_APIKEY
  });

  return response.data.result;
}
