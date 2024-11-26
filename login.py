import os
import sys
import asyncio
from playwright.async_api import async_playwright

async def login_webhostmost(username, password):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # 导航到登录页面
            await page.goto('https://webhostmost.com/login')
            
            # 输入用户名和密码
            await page.fill('input[name="username"]', username)
            await page.fill('input[name="password"]', password)
            
            # 处理隐藏式captcha
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    # 点击登录按钮
                    await page.click('input[type="submit"]')
                    
                    # 等待页面跳转或登录结果
                    await page.wait_for_url('https://webhostmost.com/clientarea.php', timeout=10000)
                    
                    print(f"登录成功: {username}")
                    return True
                
                except Exception as e:
                    if attempt < max_attempts - 1:
                        print(f"登录第 {attempt + 1} 次失败，重试中...")
                        # 可能需要添加额外的验证码处理逻辑
                        await page.reload()
                        await asyncio.sleep(2)
                    else:
                        print(f"登录失败：{username}")
                        return False
        
        except Exception as e:
            print(f"发生错误：{e}")
            return False
        
        finally:
            await browser.close()

async def main():
    # 从环境变量获取用户名和密码
    usernames = os.environ.get('USERNAMES', '').split(',')
    passwords = os.environ.get('PASSWORDS', '').split(',')
    
    if len(usernames) != len(passwords):
        print("用户名和密码数量不匹配")
        sys.exit(1)
    
    # 并行登录
    tasks = [login_webhostmost(username.strip(), password.strip()) 
             for username, password in zip(usernames, passwords)]
    
    results = await asyncio.gather(*tasks)
    
    # 检查是否至少有一个账户登录成功
    if not any(results):
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
