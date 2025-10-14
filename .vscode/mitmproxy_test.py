import requests
import time
import re

print('PC Web Coupang API Test with mitmproxy (Port 8082)')

# ?꾨줉???ㅼ젙
proxies = {
    'http': 'http://localhost:8082',
    'https': 'http://localhost:8082'
}

session = requests.Session()
session.proxies.update(proxies)

session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Origin': 'https://www.coupang.com',
    'Referer': 'https://www.coupang.com/'
})

def test_search(keyword):
    print(f'Searching for: {keyword}')
    
    try:
        url = f'https://www.coupang.com/np/search?q={keyword}'
        print(f'  URL: {url}')
        
        start_time = time.time()
        response = session.get(url, timeout=30)
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000, 2)
        
        if response.status_code == 200:
            print(f'  SUCCESS: {response.status_code} ({response_time}ms) - {len(response.text)} bytes')
            
            # ?곹뭹 留곹겕 異붿텧
            product_links = re.findall(r'/products/(\d+)', response.text)
            print(f'  Found {len(product_links)} product links')
            
            if product_links:
                print(f'  Sample product IDs: {product_links[:5]}')
                return {
                    'success': True,
                    'keyword': keyword,
                    'product_count': len(product_links),
                    'sample_products': product_links[:10],
                    'response_time': response_time
                }
            else:
                print('  No products found')
                return {'success': False, 'error': 'No products found'}
        else:
            print(f'  WARNING: {response.status_code} ({response_time}ms)')
            return {'success': False, 'error': f'HTTP {response.status_code}'}
            
    except Exception as e:
        print(f'  FAILED: {e}')
        return {'success': False, 'error': str(e)}

# ?뚯뒪??寃?됱뼱??test_keywords = ['mouse', 'keyboard']

print('PC Web Coupang Search Test with mitmproxy...')
results = []

for keyword in test_keywords:
    result = test_search(keyword)
    results.append(result)
    print()
    time.sleep(2)

print('Test Results Summary:')
for result in results:
    if result['success']:
        print(f"SUCCESS {result['keyword']}: {result['product_count']} products found")
    else:
        print(f"FAILED {result['keyword']}: {result['error']}")

print('PC Web API Test Complete!')
