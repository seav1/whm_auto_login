const { chromium } = require('playwright');
const fs = require('fs');

async function loginWebHostMost(username, password) {
    const browser = await chromium.launch({ 
        headless: true 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 导航到登录页面
        await page.goto('https://webhostmost.com/login');

        // 等待登录表单加载
        await page.waitForSelector('form#loginform');

        // 填写用户名和密码
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);

        // 尝试处理隐藏式captcha
        let loginAttempts = 0;
        let loginSuccessful = false;

        while (loginAttempts < 2 && !loginSuccessful) {
            // 点击登录按钮
            await page.click('input[type="submit"]');

            // 等待页面跳转或错误提示
            try {
                // 最多等待10秒，检查是否成功登录
                await page.waitForURL('https://webhostmost.com/clientarea.php', { timeout: 10000 });
                loginSuccessful = true;
                console.log(`Login successful for user: ${username}`);
            } catch (err) {
                // 检查是否有错误消息
                const errorSelector = '.alert-danger';
                const hasError = await page.$(errorSelector);
                
                if (hasError) {
                    const errorText = await page.textContent(errorSelector);
                    console.log(`Login attempt ${loginAttempts + 1} failed: ${errorText}`);
                }

                loginAttempts++;
            }
        }

        if (!loginSuccessful) {
            console.error(`Login failed for user: ${username} after 2 attempts`);
        }

        // 可以在这里添加截图或其他日志记录逻辑
        if (loginSuccessful) {
            await page.screenshot({ path: `login-success-${username}.png` });
        }

    } catch (error) {
        console.error(`Error during login process: ${error}`);
    } finally {
        await browser.close();
    }
}

// 处理多用户登录
async function multiUserLogin() {
    const usernames = process.env.USERNAME.split(',');
    const passwords = process.env.PASSWORD.split(',');

    if (usernames.length !== passwords.length) {
        console.error('用户名和密码数量不匹配');
        return;
    }

    for (let i = 0; i < usernames.length; i++) {
        await loginWebHostMost(usernames[i].trim(), passwords[i].trim());
    }
}

multiUserLogin().catch(console.error);
