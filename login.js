const { chromium } = require('playwright');

async function loginToWebHostMost(username, password) {
    const browser = await chromium.launch({
        headless: true
    });
    
    const context = await browser.newContext({
        // 设置更自然的浏览器指纹
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        },
        // 模拟更真实的浏览器环境
        viewport: { width: 1280, height: 720 }
    });

    // 禁用 WebDriver 特征
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();

    try {
        // 导航到登录页面
        await page.goto('https://webhostmost.com/login', { 
            waitUntil: 'networkidle' 
        });

        // 添加更多的反检测策略
        await page.evaluate(() => {
            // 移除 WebDriver 痕迹
            delete Object.getPrototypeOf(navigator).webdriver;
            
            // 模拟真实用户行为
            Object.defineProperty(navigator, 'languages', { 
                get: () => ['en-US', 'en'] 
            });
        });

        // 等待登录表单加载
        await page.waitForSelector('#username', { timeout: 10000 });
        await page.waitForSelector('#password', { timeout: 10000 });

        // 模拟人类输入
        await page.type('#username', username, { delay: 50 });
        await page.type('#password', password, { delay: 50 });

        // 处理可能的隐藏式验证码
        let loginAttempts = 0;
        let loginSuccess = false;

        while (loginAttempts < 3 && !loginSuccess) {
            // 随机等待
            await page.waitForTimeout(Math.random() * 1000 + 500);

            // 尝试提交登录表单
            await page.click('button[type="submit"]');

            // 等待页面跳转或错误提示
            try {
                const result = await Promise.race([
                    page.waitForURL('https://webhostmost.com/clientarea.php', { timeout: 5000 }),
                    page.waitForSelector('.alert-danger', { timeout: 5000 })
                ]);

                // 检查是否成功登录
                if (page.url().includes('clientarea.php')) {
                    console.log(`用户 ${username} 登录成功！`);
                    loginSuccess = true;
                } else {
                    console.log(`用户 ${username} 登录失败，正在重试...`);
                    loginAttempts++;

                    // 可能需要刷新页面或重新输入
                    await page.reload();
                    await page.type('#username', username, { delay: 50 });
                    await page.type('#password', password, { delay: 50 });
                }
            } catch (error) {
                console.log(`登录过程中出现异常：${error.message}`);
                loginAttempts++;
            }
        }

        if (!loginSuccess) {
            console.log(`用户 ${username} 多次登录失败`);
        }

    } catch (error) {
        console.error(`登录脚本执行错误：${error.message}`);
    } finally {
        await browser.close();
    }
}

async function main() {
    // 从环境变量读取用户名和密码
    const usernames = (process.env.USERNAMES || '').split(',').filter(Boolean);
    const passwords = (process.env.PASSWORDS || '').split(',').filter(Boolean);

    if (usernames.length === 0 || passwords.length === 0) {
        console.error('未设置用户名或密码');
        process.exit(1);
    }

    if (usernames.length !== passwords.length) {
        console.error('用户名和密码数量不匹配');
        process.exit(1);
    }

    for (let i = 0; i < usernames.length; i++) {
        await loginToWebHostMost(usernames[i].trim(), passwords[i].trim());
    }
}

main().catch(console.error);
