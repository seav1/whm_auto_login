const { chromium } = require('playwright');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

async function bypassHiddenCaptcha(page) {
  await page.evaluate(() => {
    // 移除可能的验证码脚本
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.textContent.includes('captcha') || 
          script.textContent.includes('grecaptcha')) {
        script.remove();
      }
    });

    // 模拟人类行为
    const mouseMove = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight
    });
    document.dispatchEvent(mouseMove);
  });
}

async function sophisticatedLogin(browser, username, password) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    geolocation: { latitude: 39.9042, longitude: 116.4074 },
    permissions: ['geolocation']
  });

  const page = await context.newPage();

  try {
    // 禁用WebDriver特征
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto('https://webhostmost.com/login', { 
      waitUntil: 'networkidle',
      timeout: 45000 
    });

    // 模拟真实用户行为
    await page.evaluate(() => {
      const simulateMouseInteraction = () => {
        const elements = document.querySelectorAll('input, button');
        if (elements.length > 0) {
          const randomElement = elements[Math.floor(Math.random() * elements.length)];
          const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true });
          randomElement.dispatchEvent(mouseOverEvent);
        }
      };
      simulateMouseInteraction();
    });

    // 随机延迟
    await page.waitForTimeout(Math.random() * 2000 + 1000);

    // 填写登录信息（模拟人类输入）
    await page.fill('input[name="username"]', username, { delay: 50 });
    await page.waitForTimeout(Math.random() * 500);
    await page.fill('input[name="password"]', password, { delay: 50 });

    // 处理隐藏式验证码
    await bypassHiddenCaptcha(page);

    // 点击登录
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);

    // 验证登录成功
    const pageTitle = await page.title();
    const isLoggedIn = pageTitle.includes('客户中心') || page.url().includes('clientarea.php');

    return isLoggedIn;
  } catch (error) {
    console.error('登录复杂验证失败:', error);
    return false;
  } finally {
    await page.close();
    await context.close();
  }
}

async function main() {
  if (!process.env.USERNAMES || !process.env.PASSWORDS) {
    console.error('缺少用户名或密码环境变量');
    process.exit(1);
  }

  const usernames = process.env.USERNAMES.split(',');
  const passwords = process.env.PASSWORDS.split(',');

  const browser = await chromium.launch({
    headless: true,
    timeout: 60000
  });

  try {
    for (let i = 0; i < usernames.length; i++) {
      let success = false;
      const username = usernames[i];
      const password = passwords[i];

      for (let retry = 0; retry < 3 && !success; retry++) {
        console.log(`第 ${retry + 1} 次尝试登录 ${username}`);
        success = await sophisticatedLogin(browser, username, password);
        
        if (!success) {
          await sleep(3000 * (retry + 1));
        }
      }

      if (!success) {
        console.error(`用户 ${username} 登录失败，已达最大重试次数`);
      }
    }
  } catch (error) {
    console.error('整体脚本执行异常：', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
