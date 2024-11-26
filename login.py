import os
import sys
import asyncio
from playwright.async_api import async_playwright

async def login_to_webhostmost(username, password):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            await page.goto('https://webhostmost.com/login')
            
            # 等待登录表单加载
            await page.wait_for_selector('input[name="username"]', timeout=10000)
            
            # 填写用户名和密码
            await page.fill('input[name="username"]', username)
            await page.fill('input[name="password"]', password)
            
            # 处理隐藏的Captcha
            max_attempts = 2
            for attempt in range(max_attempts):
                try:
                    # 尝试点击登录按钮
                    await page.click('input[type="submit"]')
                    
                    # 等待页面跳转或错误消息
                    await page.wait_for_url('https://webhostmost.com/clientarea.php', timeout=10000)
                    print(f"成功登录: {username}")
                    return True
                
                except Exception as e:
                    print(f"登录尝试 {attempt + 1} 失败: {e}")
                    
                    # 检查是否有错误消息
                    error_locator = page.locator('.alert-danger')
                    if await error_locator.count() > 0:
                        error_text = await error_locator.first.inner_text()
                        print(f"错误信息: {error_text}")
                    
                    # 如果不是最后一次尝试，刷新页面
                    if attempt < max_attempts - 1:
                        await page.reload()
            
            print(f"登录失败: {username}")
            return False
        
        except Exception as e:
            print(f"发生错误: {e}")
            return False
        
        finally:
            await browser.close()

async def main():
    usernames = os.environ.get('USERNAMES', '').split(',')
    passwords = os.environ.get('PASSWORDS', '').split(',')
    
    if len(usernames) != len(passwords):
        print("用户名和密码数量不匹配")
        sys.exit(1)
    
    tasks = []
    for username, password in zip(usernames, passwords):
        task = login_to_webhostmost(username.strip(), password.strip())
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    # 如果所有登录都失败，则退出码为1
    if not any(results):
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
