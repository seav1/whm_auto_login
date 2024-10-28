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
      
      await page.click('input[name="username"]');
      await page.type('input[name="username"]', usernames[i], { delay: 100 });
      await page.click('input[name="password"]');
      await page.type('input[name="password"]', passwords[i], { delay: 100 });
      await page.click('button[type="submit"]');
      
      await page.waitForURL('https://webhostmost.com/clientarea.php', { timeout: 60000 });
      console.log(`用户 ${usernames[i]} 登录成功！`);

    } catch (error) {
      console.error(`用户 ${usernames[i]} 登录失败：`, error);
    } finally {
      await context.close();
    }
  }

  await browser.close(); // 确保浏览器在最后关闭
})();
