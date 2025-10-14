# api_capture.py
from mitmproxy import http
import json
import time
import re
import os

class CoupangAPICapture:
    def __init__(self):
        self.captured_apis = {}
        self.ranking_endpoints = []
        self.capture_dir = "captured_apis"
        
        # 캡처 디렉토리 생성
        if not os.path.exists(self.capture_dir):
            os.makedirs(self.capture_dir)
        
        print("🎯 쿠팡 API 캡처 시스템 시작")
        print(f"📁 캡처 디렉토리: {self.capture_dir}")
        
    def response(self, flow: http.HTTPFlow) -> None:
        """API 응답 캡처"""
        
        # 쿠팡 관련 요청만 필터링
        if not self.is_coupang_request(flow.request):
            return
        
        # 순위 관련 API 감지
        if self.is_ranking_api(flow.request):
            self.capture_ranking_api(flow)
        
        # 모든 API 정보 저장
        self.save_api_info(flow)
    
    def is_coupang_request(self, request):
        """쿠팡 요청인지 확인"""
        coupang_domains = [
            'coupang.com',
            'coupangcdn.com',
            'coupang-api.com',
            'api.coupang.com'
        ]
        
        return any(domain in request.pretty_host for domain in coupang_domains)
    
    def is_ranking_api(self, request):
        """순위 관련 API인지 확인"""
        ranking_keywords = [
            'ranking', 'bestseller', 'popular', 'trending',
            'top', 'hot', 'recommend', 'category', 'search',
            'products', 'item', 'list', 'sort'
        ]
        
        url_lower = request.pretty_url.lower()
        return any(keyword in url_lower for keyword in ranking_keywords)
    
    def capture_ranking_api(self, flow):
        """순위 API 상세 캡처"""
        request = flow.request
        response = flow.response
        
        if response and response.status_code == 200:
            api_info = {
                'timestamp': time.time(),
                'datetime': time.strftime('%Y-%m-%d %H:%M:%S'),
                'method': request.method,
                'url': request.pretty_url,
                'host': request.pretty_host,
                'path': request.path,
                'headers': dict(request.headers),
                'params': dict(request.query) if request.query else {},
                'body': request.text if request.text else None,
                'response_headers': dict(response.headers),
                'response_size': len(response.content),
                'response_time': getattr(flow, 'response_time', None),
                'content_type': response.headers.get('content-type', '')
            }
            
            # JSON 응답 파싱 시도
            try:
                if 'application/json' in response.headers.get('content-type', ''):
                    api_info['response_json'] = json.loads(response.text)
                    print(f"🎯 JSON API 캡처: {request.pretty_url}")
                else:
                    print(f"📄 일반 API 캡처: {request.pretty_url}")
            except:
                print(f"⚠️ JSON 파싱 실패: {request.pretty_url}")
            
            # 파일로 저장
            timestamp = int(time.time())
            filename = f"ranking_api_{timestamp}.json"
            filepath = os.path.join(self.capture_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(api_info, f, ensure_ascii=False, indent=2)
            
            print(f"💾 저장됨: {filepath}")
            
            self.ranking_endpoints.append(api_info)
    
    def save_api_info(self, flow):
        """모든 API 정보 저장"""
        request = flow.request
        
        api_key = f"{request.method}:{request.pretty_host}{request.path}"
        
        if api_key not in self.captured_apis:
            self.captured_apis[api_key] = {
                'first_seen': time.time(),
                'count': 0,
                'method': request.method,
                'host': request.pretty_host,
                'path': request.path,
                'headers': dict(request.headers),
                'query_params': list(request.query.keys()) if request.query else [],
                'is_ranking_api': self.is_ranking_api(request)
            }
        
        self.captured_apis[api_key]['count'] += 1
        self.captured_apis[api_key]['last_seen'] = time.time()

# 전역 인스턴스 생성
api_capture = CoupangAPICapture()

def response(flow: http.HTTPFlow) -> None:
    api_capture.response(flow)

def done():
    """캡처 완료 시 실행"""
    print(f"\n📊 캡처 완료:")
    print(f"- 총 API 수: {len(api_capture.captured_apis)}")
    print(f"- 순위 API 수: {len(api_capture.ranking_endpoints)}")
    
    # 순위 API 목록 출력
    print("\n🎯 발견된 순위 API:")
    for i, api in enumerate(api_capture.ranking_endpoints, 1):
        print(f"{i}. {api['method']} {api['url']}")
    
    # 전체 결과 저장
    summary_file = os.path.join(api_capture.capture_dir, 'captured_apis_summary.json')
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump({
            'total_apis': len(api_capture.captured_apis),
            'ranking_apis': api_capture.ranking_endpoints,
            'all_apis': api_capture.captured_apis,
            'capture_time': time.strftime('%Y-%m-%d %H:%M:%S')
        }, f, ensure_ascii=False, indent=2)
    
    print(f"📁 전체 결과 저장: {summary_file}")