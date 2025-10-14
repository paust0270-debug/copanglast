#!/usr/bin/env python
# -*- coding: utf-8 -*-
import requests
import json
import time

print('Hybrid Coupang Client (Mobile IP + PC Web)')

# Check Mobile IP
try:
    response = requests.get('https://ipinfo.io/json', timeout=10)
    ip_info = response.json()
    
    print('Current IP:', ip_info.get('ip'))
    print('ISP:', ip_info.get('org'))
    print('Region:', ip_info.get('city'), ip_info.get('country'))
    
    mobile_isps = ['KT', 'SKT', 'LG U+', 'SK Telecom']
    is_mobile = any(isp in ip_info.get('org', '') for isp in mobile_isps)
    
    if is_mobile:
        print('Mobile IP Confirmed')
    else:
        print('May not be mobile IP')
        
except Exception as e:
    print('IP Check Failed:', e)

# Test Coupang PC Web Connection
session = requests.Session()
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
    'https://www.coupang.com/np/search?q=mouse'
]

print('\nHybrid Connection Test...')
for url in test_urls:
    try:
        start_time = time.time()
        response = session.get(url, timeout=10)
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000, 2)
        
        if response.status_code == 200:
            print('SUCCESS', url, ':', response.status_code, '(' + str(response_time) + 'ms)')
        else:
            print('WARNING', url, ':', response.status_code, '(' + str(response_time) + 'ms)')
            
    except Exception as e:
        print('FAILED', url, ':', str(e))

print('\nTest Search...')
search_url = 'https://www.coupang.com/np/search'
params = {'q': 'mouse', 'page': 1, 'size': 60}

try:
    response = session.get(search_url, params=params, timeout=30)
    
    if response.status_code == 200:
        print('Search Success:', len(response.text), 'bytes')
        print('Hybrid System Working!')
    else:
        print('Search Failed:', response.status_code)
        
except Exception as e:
    print('Search Error:', str(e))











