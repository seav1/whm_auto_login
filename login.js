const { chromium } = require('playwright');

(async () => {
  const usernames = process.env.USERNAMES.split(',');
  const passwords = process.env.PASSWORDS.split(',');

  for (let i = 0; i < usernames.length; i++) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('https://webhostmost.com/login');

      // 输入用户名和密码
      await page.fill('input[name="username"]', usernames[i]);
      await page.fill('input[name="password"]', passwords[i]);

      // 提交表单
      await page.click('button[type="submit"]');

      // 检查是否跳转到clientarea.php
      await page.waitForNavigation();
      if (page.url() === 'https://webhostmost.com/clientarea.php') {
        console.log(`Login successful for user: ${usernames[i]}`);
      } else if (await page.$('div.captcha')) {
        throw new Error('Captcha detected');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error(`Attempt 1 failed for user: ${usernames[i]}. Retrying...`);
      try {
        // 第二次尝试
        await page.goto('https://webhostmost.com/login');
        await page.fill('input[name="username"]', usernames[i]);
        await page.fill('input[name="password"]', passwords[i]);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
        if (page.url() === 'https://webhostmost.com/clientarea.php') {
          console.log(`Login successful for user: ${usernames[i]}`);
        } else if (await page.$('div.captcha')) {
          throw new Error('Captcha detected');
        } else {
          throw new Error('Login failed');
        }
      } catch (error) {
        console.error(`Attempt 2 failed for user: ${usernames[i]}`);
      }
    } finally {
      await browser.close();
    }
  }
})();
