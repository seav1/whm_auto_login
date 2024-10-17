const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  const usernames = process.env.USERNAMES.split(',');
  const passwords = process.env.PASSWORDS.split(',');

  for (let i = 0; i < usernames.length; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('https://app.koyeb.com/auth/signin');
      await page.fill('input[name="email"]', usernames[i]);
      await page.fill('input[name="password"]', passwords[i]);
      await page.click('button[type="submit"]');
      
      // 增加超时时间或等待特定元素出现
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 600000 });

      // 或者等待某个特定元素出现
      // await page.waitForSelector('selector_for_element_indicating_successful_login', { timeout: 60000 });

      console.log(`用户 ${usernames[i]} 登录成功！`);
    } catch (error) {
      console.error(`用户 ${usernames[i]} 登录失败：`, error);
    } finally {
      await context.close();
    }
  }

  await browser.close();
})();
