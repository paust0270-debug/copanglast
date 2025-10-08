# pc_coupang_api_capture.py
from mitmproxy import http
import json
import time
import os

class PCCoupangAPICapture:
    def __init__(self):
        self.captured_apis = {}
        self.ranking_endpoints = []
        self.capture_dir = "captured_pc_apis"
        
        if not os.path.exists(self.capture_dir):
            os.makedirs(self.capture_dir)
        
        print("🖥️ PC 쿠팡 API 캡처 시스템 시작")
        print(f"📁 캡처 디렉토리: {self.capture_dir}")
        
    def response(self, flow: http.HTTPFlow) -> None:
        """API 응답 캡처"""
        
        # 쿠팡 관련 요청만 필터링
        if not self.is_coupang_request(flow.request):
            return
        
        # PC 웹 API 감지
        if self.is_pc_web_api(flow.request):
            self.capture_pc_api(flow)
        
        # 모든 API 정보 저장
        self.save_api_info(flow)
    
    def is_coupang_request(self, request):
        """쿠팡 요청인지 확인"""
        coupang_domains = [
            'coupang.com',
            'coupangcdn.com',
            'coupang-api.com',
            'api.coupang.com',
            'www.coupang.com'
        ]
        
        return any(domain in request.pretty_host for domain in coupang_domains)
    
    def is_pc_web_api(self, request):
        """PC 웹 API인지 확인"""
        # PC 웹 관련 키워드
        pc_keywords = [
            'search', 'products', 'ranking', 'bestseller', 
            'popular', 'category', 'list', 'sort', 'filter',
            'np/search', 'np/products', 'np/ranking'
        ]
        
        url_lower = request.pretty_url.lower()
        
        # PC 웹 API 패턴 확인
        is_pc_api = any(keyword in url_lower for keyword in pc_keywords)
        
        # 모바일 API 제외
        mobile_indicators = ['/m/', '/mobile/', 'm.coupang.com']
        is_mobile = any(indicator in url_lower for indicator in mobile_indicators)
        
        return is_pc_api and not is_mobile
    
    def capture_pc_api(self, flow):
        """PC 웹 API 상세 캡처"""
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
                'content_type': response.headers.get('content-type', ''),
                'user_agent': request.headers.get('user-agent', ''),
                'referer': request.headers.get('referer', '')
            }
            
            # JSON 응답 파싱 시도
            try:
                if 'application/json' in response.headers.get('content-type', ''):
                    api_info['response_json'] = json.loads(response.text)
                    print(f"🎯 PC JSON API 캡처: {request.pretty_url}")
                else:
                    print(f"📄 PC 일반 API 캡처: {request.pretty_url}")
            except:
                print(f"⚠️ JSON 파싱 실패: {request.pretty_url}")
            
            # 파일로 저장
            timestamp = int(time.time())
            filename = f"pc_api_{timestamp}.json"
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
                'is_pc_api': self.is_pc_web_api(request),
                'user_agent': request.headers.get('user-agent', '')
            }
        
        self.captured_apis[api_key]['count'] += 1
        self.captured_apis[api_key]['last_seen'] = time.time()

# 전역 인스턴스 생성
pc_api_capture = PCCoupangAPICapture()

def response(flow: http.HTTPFlow) -> None:
    pc_api_capture.response(flow)

def done():
    """캡처 완료 시 실행"""
    print(f"\n📊 PC API 캡처 완료:")
    print(f"- 총 API 수: {len(pc_api_capture.captured_apis)}")
    print(f"- PC 웹 API 수: {len(pc_api_capture.ranking_endpoints)}")
    
    # PC 웹 API 목록 출력
    print("\n🖥️ 발견된 PC 웹 API:")
    for i, api in enumerate(pc_api_capture.ranking_endpoints, 1):
        print(f"{i}. {api['method']} {api['url']}")
    
    # 전체 결과 저장
    summary_file = os.path.join(pc_api_capture.capture_dir, 'pc_captured_apis_summary.json')
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump({
            'total_apis': len(pc_api_capture.captured_apis),
            'pc_web_apis': pc_api_capture.ranking_endpoints,
            'all_apis': pc_api_capture.captured_apis,
            'capture_time': time.strftime('%Y-%m-%d %H:%M:%S')
        }, f, ensure_ascii=False, indent=2)
    
    print(f"📁 전체 결과 저장: {summary_file}")










