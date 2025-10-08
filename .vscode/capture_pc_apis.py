#!/usr/bin/env python
# -*- coding: utf-8 -*-
import requests
import time

print('🚀 PC 웹 쿠팡 API 캡처 시작')
print('📡 mitmproxy: http://localhost:8080')

# 프록시 설정
proxies = {
    'http': 'http://localhost:8080',
    'https': 'http://localhost:8080'
}

session = requests.Session()
session.proxies.update(proxies)

# PC 웹 브라우저 헤더 설정
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

# 테스트 URL들
test_urls = [
    'https://www.coupang.com',
    'https://www.coupang.com/np/search?q=무선마우스',
    'https://www.coupang.com/np/search?q=키보드',
    'https://www.coupang.com/np/search?q=모니터'
]

print('🔍 PC 웹 쿠팡 API 호출 중...')
for i, url in enumerate(test_urls, 1):
    try:
        print(f'{i}. {url}')
        start_time = time.time()
        response = session.get(url, timeout=30)
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000, 2)
        
        if response.status_code == 200:
            print(f'   ✅ 성공: {response.status_code} ({response_time}ms) - {len(response.text)} bytes')
        else:
            print(f'   ⚠️ 경고: {response.status_code} ({response_time}ms)')
        
        # 2초 대기
        time.sleep(2)
        
    except Exception as e:
        print(f'   ❌ 실패: {e}')

print('🎯 PC 웹 API 캡처 완료!')
print('📁 captured_apis/ 디렉토리에서 결과 확인')










