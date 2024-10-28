const { chromium } = require('playwright');
const axios = require('axios');

const YOUR_API_KEY = 'Justinfu';
const YOUR_API_SECRET = 'trdmHyS6pS6lVBdqxOcd';

async function solveCaptcha(siteKey, url) {
  // 向 TrueCaptcha 提交任务
  const response = await axios.post('https://truecaptcha.com/api/v1/captcha/solve', {
    api_key: YOUR_API_KEY,
    site_key: siteKey,
    page_url: url,
  });

  const captchaId = response.data.captcha_id;

  // 轮询以检查 CAPTCHA 是否已解决
  while (true) {
    const result = await axios.get(`https://truecaptcha.com/api/v1/captcha/status`, {
      params: {
        api_key: YOUR_API_KEY,
        captcha_id: captchaId,
      },
    });

    if (result.data.status === 'solved') {
      return result.data.response;
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒再检查
  }
}

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

      // 检查是否出现 reCAPTCHA 验证
      const recaptchaFrame = await page.frame({ name: 'recaptcha' });
      if (recaptchaFrame) {
        const siteKey = await recaptchaFrame.evaluate(() => {
          return document.querySelector('.g-recaptcha').getAttribute('data-sitekey');
        });

        const captchaResponse = await solveCaptcha(siteKey, page.url());
        await page.evaluate(response => {
          document.getElementById('g-recaptcha-response').innerHTML = response;
        }, captchaResponse);
        await page.click('button[type="submit"]'); // 再次提交
      }

      // 检查页面跳转是否成功
      await page.waitForURL('https://webhostmost.com/clientarea.php', { timeout: 60000 });
      console.log(`用户 ${usernames[i]} 登录成功！`);

    } catch (error) {
      console.error(`用户 ${usernames[i]} 登录失败：`, error);
    } finally {
      await context.close();
    }
  }

  await browser.close();
})();
