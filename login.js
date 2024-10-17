const { chromium } = require('playwright');

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

      // 使用更具体的等待方法，等待特定元素
      await page.waitForSelector('selector_for_element_indicating_successful_login', { timeout: 30000 });
      
      // 或者可以使用 waitForFunction 进行自定义条件等待
      // await page.waitForFunction(() => document.querySelector('selector_for_element_indicating_successful_login') !== null, { timeout: 30000 });

      console.log(`用户 ${usernames[i]} 登录成功！`);
    } catch (error) {
      console.error(`用户 ${usernames[i]} 登录失败：`, error);
    } finally {
      await context.close();
    }
  }

  await browser.close();
})();
