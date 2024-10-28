const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth');

// 使用 stealth 插件
chromium.use(stealth());

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // 设置真实的用户代理
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  // 在页面加载时修改 navigator.webdriver 属性
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });

    // 模拟真实的 WebGL 渲染信息
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) return 'Intel Open Source Technology Center'; // UNMASKED_VENDOR_WEBGL
      if (parameter === 37446) return 'Mesa DRI Intel(R) HD Graphics 620'; // UNMASKED_RENDERER_WEBGL
      return getParameter(parameter);
    };
  });

  const usernames = process.env.USERNAMES.split(',');
  const passwords = process.env.PASSWORDS.split(',');

  for (let i = 0; i < usernames.length; i++) {
    const page = await context.newPage();

    try {
      await page.goto('https://webhostmost.com/login');

      // 模拟人类输入，带有随机延迟
      await page.type('input[name="username"]', usernames[i], { delay: Math.random() * 100 + 50 });
      await page.type('input[name="password"]', passwords[i], { delay: Math.random() * 100 + 50 });

      // 随机移动鼠标到登录按钮并点击
      await page.hover('button[type="submit"]');
      await page.waitForTimeout(Math.random() * 1000 + 500); // 随机等待
      await page.click('button[type="submit"]');

      // 检查是否成功登录
      await page.waitForURL('https://webhostmost.com/clientarea.php', { timeout: 60000 });
      console.log(`用户 ${usernames[i]} 登录成功！`);
      
    } catch (error) {
      console.error(`用户 ${usernames[i]} 登录失败：`, error);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();
