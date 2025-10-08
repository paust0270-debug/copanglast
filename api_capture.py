# api_capture.py
from mitmproxy import http
import json
import time
import os

class CoupangAPICapture:
    def __init__(self):
        self.captured_apis = {}
        self.ranking_endpoints = []
        self.capture_dir = "captured_apis"
        
        if not os.path.exists(self.capture_dir):
            os.makedirs(self.capture_dir)
        
        print("?렞 荑좏뙜 API 罹≪쿂 ?쒖뒪???쒖옉")
        
    def response(self, flow: http.HTTPFlow) -> None:
        if not self.is_coupang_request(flow.request):
            return
        
        if self.is_ranking_api(flow.request):
            self.capture_ranking_api(flow)
        
        self.save_api_info(flow)
    
    def is_coupang_request(self, request):
        coupang_domains = ['coupang.com', 'coupangcdn.com']
        return any(domain in request.pretty_host for domain in coupang_domains)
    
    def is_ranking_api(self, request):
        ranking_keywords = ['ranking', 'bestseller', 'popular', 'search', 'products']
        url_lower = request.pretty_url.lower()
        return any(keyword in url_lower for keyword in ranking_keywords)
    
    def capture_ranking_api(self, flow):
        request = flow.request
        response = flow.response
        
        if response and response.status_code == 200:
            api_info = {
                'timestamp': time.time(),
                'method': request.method,
                'url': request.pretty_url,
                'headers': dict(request.headers),
                'params': dict(request.query) if request.query else {}
            }
            
            try:
                if 'application/json' in response.headers.get('content-type', ''):
                    api_info['response_json'] = json.loads(response.text)
                    print(f"?렞 JSON API 罹≪쿂: {request.pretty_url}")
            except:
                print(f"?좑툘 JSON ?뚯떛 ?ㅽ뙣: {request.pretty_url}")
            
            timestamp = int(time.time())
            filename = f"ranking_api_{timestamp}.json"
            filepath = os.path.join(self.capture_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(api_info, f, ensure_ascii=False, indent=2)
            
            print(f"?뮶 ??λ맖: {filepath}")
            self.ranking_endpoints.append(api_info)
    
    def save_api_info(self, flow):
        request = flow.request
        api_key = f"{request.method}:{request.pretty_host}{request.path}"
        
        if api_key not in self.captured_apis:
            self.captured_apis[api_key] = {
                'first_seen': time.time(),
                'count': 0,
                'method': request.method,
                'host': request.pretty_host,
                'path': request.path,
                'headers': dict(request.headers)
            }
        
        self.captured_apis[api_key]['count'] += 1

api_capture = CoupangAPICapture()

def response(flow: http.HTTPFlow) -> None:
    api_capture.response(flow)

def done():
    print(f"?뱤 罹≪쿂 ?꾨즺: {len(api_capture.ranking_endpoints)}媛?API")
