const { chromium } = require('playwright'); 

(async () => {
  const browser = await chromium.launch();

  const usernames = process.env.USERNAMES.split(',');
  const passwords = process.env.PASSWORDS.split(',');

  for (let i = 0; i < usernames.length; i++) {
    let retries = 0;
    let success = false;

    while (retries < 2 && !success) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        console.log(`尝试登录用户 ${usernames[i]} (第 ${retries + 1} 次尝试)...`);
        await page.goto('https://webhostmost.com/login');
        await page.fill('input[name="username"]', usernames[i]);
        await page.fill('input[name="password"]', passwords[i]);
        await page.click('button[type="submit"]');
        
        // 检查页面跳转是否成功
        await page.waitForURL('https://webhostmost.com/clientarea.php', { timeout: 60000 });

        console.log(`用户 ${usernames[i]} 登录成功！`);
        success = true;
      } catch (error) {
        console.error(`用户 ${usernames[i]} 登录失败 (第 ${retries + 1} 次尝试)：`, error);
        retries++;
      } finally {
        await context.close();
      }
    }

    if (!success) {
      console.error(`用户 ${usernames[i]} 登录失败，已达最大重试次数。`);
    }
  }

  await browser.close();
})();
