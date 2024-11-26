const { chromium } = require('playwright');

async function loginToWebHostMost(username, password) {
    const browser = await chromium.launch({
        headless: true
    });
    const context = await browser.newContext({
        // 添加更多浏览器指纹伪造选项
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
        }
    });
    
    // 禁用某些特征
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    });

    const page = await context.newPage();

    try {
        // 导航到登录页面
        await page.goto('https://webhostmost.com/login', { 
            waitUntil: 'networkidle' 
        });

        // 等待登录表单加载
        await page.waitForSelector('#username');
        await page.waitForSelector('#password');

        // 填写用户名和密码
        await page.fill('#username', username);
        await page.fill('#password', password);

        // 处理可能的隐藏式验证码
        let loginAttempts = 0;
        let loginSuccess = false;

        while (loginAttempts < 3 && !loginSuccess) {
            // 尝试提交登录表单
            await page.click('button[type="submit"]');

            // 等待页面跳转或错误提示
            try {
                await Promise.race([
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
                    await page.fill('#username', username);
                    await page.fill('#password', password);
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
    const usernames = process.env.USERNAMES.split(',');
    const passwords = process.env.PASSWORDS.split(',');

    if (usernames.length !== passwords.length) {
        console.error('用户名和密码数量不匹配');
        process.exit(1);
    }

    for (let i = 0; i < usernames.length; i++) {
        await loginToWebHostMost(usernames[i].trim(), passwords[i].trim());
    }
}

main().catch(console.error);
