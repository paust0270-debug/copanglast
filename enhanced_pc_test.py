import requests
import time
import re

print('Enhanced PC Web Coupang API Test (Mobile IP)')

session = requests.Session()

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

def test_search(keyword, max_retries=3):
    print(f'Searching for: {keyword}')
    
    for attempt in range(max_retries):
        try:
            url = f'https://www.coupang.com/np/search?q={keyword}'
            print(f'  Attempt {attempt + 1}: {url}')
            
            start_time = time.time()
            response = session.get(url, timeout=60)
            end_time = time.time()
            
            response_time = round((end_time - start_time) * 1000, 2)
            
            if response.status_code == 200:
                print(f'  SUCCESS: {response.status_code} ({response_time}ms) - {len(response.text)} bytes')
                
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
                
        except Exception as e:
            print(f'  FAILED: {e}')
            if attempt < max_retries - 1:
                print(f'  Retrying in 5 seconds...')
                time.sleep(5)
    
    return {'success': False, 'error': 'Max retries exceeded'}

test_keywords = ['mouse', 'keyboard', 'monitor']

print('Enhanced PC Web Coupang Search Test...')
results = []

for keyword in test_keywords:
    result = test_search(keyword)
    results.append(result)
    print()
    time.sleep(3)

print('Test Results Summary:')
for result in results:
    if result['success']:
        print(f"SUCCESS {result['keyword']}: {result['product_count']} products found")
    else:
        print(f"FAILED {result['keyword']}: {result['error']}")

print('Enhanced PC Web API Test Complete!')
