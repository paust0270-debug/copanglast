import requests
import time
import re

print('Enhanced Coupang Search Test (Mobile IP)')

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
})

def test_search(keyword):
    print(f'Searching for: {keyword}')
    
    try:
        url = f'https://www.coupang.com/np/search?q={keyword}'
        print(f'  URL: {url}')
        
        start_time = time.time()
        response = session.get(url, timeout=45)
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000, 2)
        
        if response.status_code == 200:
            print(f'  SUCCESS: {response.status_code} ({response_time}ms) - {len(response.text)} bytes')
            
            # 상품 링크 추출
            product_links = re.findall(r'/products/(\d+)', response.text)
            print(f'  Found {len(product_links)} product links')
            
            if product_links:
                print(f'  Sample product IDs: {product_links[:5]}')
                return True
            else:
                print('  No products found')
                return False
        else:
            print(f'  WARNING: {response.status_code} ({response_time}ms)')
            return False
            
    except Exception as e:
        print(f'  FAILED: {e}')
        return False

# 테스트 검색어들
test_keywords = ['mouse', 'keyboard', 'monitor']

print('Starting search tests...')
success_count = 0

for keyword in test_keywords:
    if test_search(keyword):
        success_count += 1
    print()
    time.sleep(2)

print(f'Test Results: {success_count}/{len(test_keywords)} successful')
print('Enhanced Coupang Test Complete!')










