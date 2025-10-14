# analyze_captured_apis.py
import json
import requests
import os
from urllib.parse import urlparse, parse_qs

def analyze_captured_apis():
    """캡처된 API 분석"""
    
    capture_dir = "captured_apis"
    summary_file = os.path.join(capture_dir, 'captured_apis_summary.json')
    
    try:
        with open(summary_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ 캡처된 API 파일이 없습니다.")
        print("먼저 mitmproxy로 API를 캡처해주세요.")
        return
    
    ranking_apis = data.get('ranking_apis', [])
    
    if not ranking_apis:
        print("❌ 순위 관련 API를 찾을 수 없습니다.")
        return
    
    print(f"🔍 {len(ranking_apis)}개의 순위 API 분석 중...")
    
    analyzed_apis = []
    
    for api in ranking_apis:
        analysis = analyze_single_api(api)
        if analysis:
            analyzed_apis.append(analysis)
    
    # 분석 결과 저장
    analyzed_file = os.path.join(capture_dir, 'analyzed_ranking_apis.json')
    with open(analyzed_file, 'w', encoding='utf-8') as f:
        json.dump(analyzed_apis, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(analyzed_apis)}개 API 분석 완료")
    print(f"📁 분석 결과 저장: {analyzed_file}")
    
    # 사용 가능한 API 출력
    print("\n🚀 사용 가능한 순위 API:")
    for i, api in enumerate(analyzed_apis, 1):
        print(f"{i}. {api['name']}")
        print(f"   URL: {api['url']}")
        print(f"   파라미터: {list(api['required_params'].keys())}")
        print(f"   응답 형태: {api['response_type']}")
        print()

def analyze_single_api(api_data):
    """개별 API 분석"""
    
    url = api_data.get('url', '')
    method = api_data.get('method', 'GET')
    headers = api_data.get('headers', {})
    params = api_data.get('params', {})
    response_json = api_data.get('response_json', {})
    
    # URL 파싱
    parsed_url = urlparse(url)
    path_parts = parsed_url.path.split('/')
    
    # API 이름 추정
    api_name = "Unknown"
    if 'bestseller' in url.lower():
        api_name = "베스트셀러 순위"
    elif 'ranking' in url.lower():
        api_name = "실시간 순위"
    elif 'popular' in url.lower():
        api_name = "인기 상품"
    elif 'category' in url.lower():
        api_name = "카테고리 순위"
    elif 'search' in url.lower():
        api_name = "검색 결과"
    elif 'products' in url.lower():
        api_name = "상품 목록"
    elif 'trending' in url.lower():
        api_name = "트렌딩 상품"
    
    # 필수 파라미터 분석
    required_params = {}
    for key, value in params.items():
        if key.lower() in ['categoryid', 'category', 'page', 'size', 'limit', 'query', 'sortby', 'sort']:
            required_params[key] = {
                'value': value,
                'type': 'required',
                'description': get_param_description(key)
            }
    
    # 필수 헤더 분석
    required_headers = {}
    for key, value in headers.items():
        if key.lower() in ['user-agent', 'x-coupang-device-id', 'x-coupang-session-id', 'authorization', 'x-requested-with']:
            required_headers[key] = value
    
    # 응답 구조 분석
    response_structure = analyze_response_structure(response_json)
    
    return {
        'name': api_name,
        'url': url,
        'method': method,
        'base_url': f"{parsed_url.scheme}://{parsed_url.netloc}",
        'path': parsed_url.path,
        'required_params': required_params,
        'required_headers': required_headers,
        'response_type': response_structure['type'],
        'response_fields': response_structure['fields'],
        'sample_response': response_json if len(str(response_json)) < 1000 else "Too large to display"
    }

def get_param_description(param_key):
    """파라미터 설명 반환"""
    descriptions = {
        'categoryid': '카테고리 ID (예: 186764)',
        'category': '카테고리명',
        'page': '페이지 번호 (1부터 시작)',
        'size': '페이지당 항목 수',
        'limit': '최대 결과 수',
        'sortby': '정렬 기준 (scoreDesc, priceAsc 등)',
        'sort': '정렬 기준',
        'query': '검색어'
    }
    return descriptions.get(param_key.lower(), '알 수 없는 파라미터')

def analyze_response_structure(response_json):
    """응답 구조 분석"""
    if not response_json:
        return {'type': 'empty', 'fields': []}
    
    if isinstance(response_json, dict):
        # 상품 목록 찾기
        product_list_keys = ['productList', 'products', 'items', 'data', 'results', 'list', 'content']
        
        for key in product_list_keys:
            if key in response_json:
                products = response_json[key]
                if isinstance(products, list) and len(products) > 0:
                    # 첫 번째 상품의 필드 분석
                    first_product = products[0]
                    if isinstance(first_product, dict):
                        return {
                            'type': 'product_list',
                            'fields': list(first_product.keys()),
                            'list_key': key,
                            'sample_count': len(products)
                        }
        
        # 일반 객체
        return {
            'type': 'object',
            'fields': list(response_json.keys())
        }
    
    elif isinstance(response_json, list):
        return {
            'type': 'array',
            'fields': list(response_json[0].keys()) if response_json and isinstance(response_json[0], dict) else []
        }
    
    return {'type': 'unknown', 'fields': []}

if __name__ == "__main__":
    analyze_captured_apis()











