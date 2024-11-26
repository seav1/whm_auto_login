const { chromium } = require('playwright');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

async function loginUser(browser, username, password) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`开始登录用户 ${username}...`);
    
    // 设置更高的超时时间和重试间隔
    await page.setDefaultTimeout(30000);
    
    // 导航到登录页面
    await page.goto('https://webhostmost.com/login', { 
      waitUntil: 'networkidle',
      timeout: 45000 
    });

    // 更健壮的元素选择
    await page.fill('input[name="username"]', username, { timeout: 10000 });
    await page.fill('input[name="password"]', password, { timeout: 10000 });
    
    // 添加额外的安全点击处理
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);

    // 更精确的登录成功验证
    const pageTitle = await page.title();
    if (pageTitle.includes('客户中心') || page.url().includes('clientarea.php')) {
      console.log(`用户 ${username} 登录成功！`);
      return true;
    } else {
      console.warn(`用户 ${username} 可能登录失败`);
      return false;
    }
  } catch (error) {
    console.error(`用户 ${username} 登录异常：`, error.message);
    return false;
  } finally {
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

  if (usernames.length !== passwords.length) {
    console.error('用户名和密码数量不匹配');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,  // 无头模式
    timeout: 60000   // 浏览器启动超时
  });

  try {
    for (let i = 0; i < usernames.length; i++) {
      let success = false;
      const username = usernames[i];
      const password = passwords[i];

      for (let retry = 0; retry < 2 && !success; retry++) {
        console.log(`第 ${retry + 1} 次尝试登录 ${username}`);
        success = await loginUser(browser, username, password);
        
        // 失败后增加重试间隔
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
