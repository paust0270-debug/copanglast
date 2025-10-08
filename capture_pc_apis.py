import requests
import time

print('PC Web Coupang API Capture Start')
print('mitmproxy: http://localhost:8080')

proxies = {
    'http': 'http://localhost:8080',
    'https': 'http://localhost:8080'
}

session = requests.Session()
session.proxies.update(proxies)

session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
})

test_urls = [
    'https://www.coupang.com',
    'https://www.coupang.com/np/search?q=mouse',
    'https://www.coupang.com/np/search?q=keyboard',
    'https://www.coupang.com/np/search?q=monitor'
]

print('PC Web Coupang API Calls...')
for i, url in enumerate(test_urls, 1):
    try:
        print(f'{i}. {url}')
        start_time = time.time()
        response = session.get(url, timeout=30)
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000, 2)
        
        if response.status_code == 200:
            print(f'   SUCCESS: {response.status_code} ({response_time}ms) - {len(response.text)} bytes')
        else:
            print(f'   WARNING: {response.status_code} ({response_time}ms)')
        
        time.sleep(2)
        
    except Exception as e:
        print(f'   FAILED: {e}')

print('PC Web API Capture Complete!')
print('Check captured_apis/ directory for results')
