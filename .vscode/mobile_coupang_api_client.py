# mobile_coupang_api_client.py
import requests
import json
import time
import hashlib
import uuid
import os
from urllib.parse import urlencode

class MobileCoupangAPIClient:
    def __init__(self):
        self.base_url = "https://www.coupang.com"
        self.mobile_base_url = "https://m.coupang.com"
        self.api_base_url = "https://www.coupang.com/np"
        
        self.session = requests.Session()
        self.device_id = self.generate_mobile_device_id()
        self.session_token = None
        
        # 모바일 환경 헤더 설정
        self.setup_mobile_headers()
        
        # 캡처된 API 정보 로드
        self.load_captured_apis()
    
    def generate_mobile_device_id(self):
        """모바일 디바이스 ID 생성"""
        # 실제 Android 디바이스 ID 패턴 모방
        import platform
        import getpass
        
        # 시스템 정보 기반 고유 ID 생성
        system_info = f"{platform.node()}-{getpass.getuser()}-{time.time()}"
        device_hash = hashlib.sha256(system_info.encode()).hexdigest()
        
        # Android 디바이스 ID 형식으로 변환 (32자리 대문자)
        return device_hash[:32].upper()
    
    def setup_mobile_headers(self):
        """모바일 환경 헤더 설정"""
        self.session.headers.update({
            # 실제 쿠팡 앱 User-Agent (캡처된 값 사용)
            'User-Agent': 'Coupang/6.0.0 (Android 14; SM-G998N Build/UP1A.231005.007; wv) AppleWebKit/537.36',
            
            # 모바일 앱 식별 헤더
            'X-Requested-With': 'com.coupang.mobile',
            'X-COUPANG-APP-VERSION': '6.0.0',
            'X-COUPANG-DEVICE-ID': self.device_id,
            'X-COUPANG-PLATFORM': 'android',
            'X-COUPANG-OS-VERSION': '14',
            
            # 표준 HTTP 헤더
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            
            # 모바일 브라우저 헤더
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            
            # 쿠팡 특화 헤더
            'Origin': 'https://m.coupang.com',
            'Referer': 'https://m.coupang.com/'
        })
    
    def load_captured_apis(self):
        """캡처된 API 정보 로드"""
        try:
            analyzed_file = os.path.join('captured_apis', 'analyzed_ranking_apis.json')
            with open(analyzed_file, 'r', encoding='utf-8') as f:
                self.captured_apis = json.load(f)
                print(f"✅ {len(self.captured_apis)}개의 API 정보 로드됨")
        except FileNotFoundError:
            print("⚠️ 캡처된 API 파일이 없습니다. 기본 API 사용")
            self.captured_apis = self.get_default_apis()
    
    def get_default_apis(self):
        """기본 API 정보 (일반적인 패턴)"""
        return [
            {
                'name': '베스트셀러 순위',
                'url': f'{self.api_base_url}/v2/products/bestsellers',
                'method': 'GET',
                'required_params': {
                    'categoryId': {'type': 'required', 'description': '카테고리 ID'},
                    'page': {'type': 'optional', 'description': '페이지 번호'},
                    'size': {'type': 'optional', 'description': '페이지당 항목 수'}
                }
            },
            {
                'name': '실시간 인기 상품',
                'url': f'{self.api_base_url}/v3/realtime/popular',
                'method': 'GET',
                'required_params': {
                    'category': {'type': 'required', 'description': '카테고리'},
                    'limit': {'type': 'optional', 'description': '최대 결과 수'}
                }
            }
        ]
    
    def acquire_session_token(self):
        """세션 토큰 획득"""
        try:
            # 모바일 메인 페이지 접속
            response = self.session.get(self.mobile_base_url, timeout=10)
            
            if response.status_code == 200:
                # 쿠키에서 세션 토큰 추출
                for cookie in self.session.cookies:
                    if cookie.name in ['PCID', 'sessionId', 'coupang_session']:
                        self.session_token = cookie.value
                        self.session.headers['X-COUPANG-SESSION-ID'] = self.session_token
                        print(f"✅ 세션 토큰 획득: {self.session_token[:20]}...")
                        return True
                
                print("⚠️ 세션 토큰을 찾을 수 없습니다")
                return False
            else:
                print(f"❌ 메인 페이지 접속 실패: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 세션 토큰 획득 실패: {e}")
            return False
    
    def test_connection(self):
        """연결 테스트"""
        print("🔍 모바일 네트워크 연결 테스트...")
        
        # 현재 IP 확인
        try:
            ip_response = requests.get('https://ipinfo.io/json', timeout=10)
            ip_info = ip_response.json()
            
            print(f"📍 현재 IP: {ip_info.get('ip')}")
            print(f"🏢 ISP: {ip_info.get('org')}")
            print(f"🌍 지역: {ip_info.get('city')}, {ip_info.get('country')}")
            
            # 모바일 통신사 IP인지 확인
            mobile_isps = ['KT', 'SKT', 'LG U+', 'SK Telecom']
            is_mobile = any(isp in ip_info.get('org', '') for isp in mobile_isps)
            
            if is_mobile:
                print("✅ 모바일 IP 확인됨")
            else:
                print("⚠️ 모바일 IP가 아닐 수 있습니다")
            
        except Exception as e:
            print(f"❌ IP 확인 실패: {e}")
        
        # 쿠팡 연결 테스트
        test_urls = [
            'https://www.coupang.com',
            'https://m.coupang.com'
        ]
        
        for url in test_urls:
            try:
                start_time = time.time()
                response = self.session.get(url, timeout=10)
                end_time = time.time()
                
                response_time = round((end_time - start_time) * 1000, 2)
                
                if response.status_code == 200:
                    print(f"✅ {url}: {response.status_code} ({response_time}ms)")
                else:
                    print(f"⚠️ {url}: {response.status_code} ({response_time}ms)")
                    
            except Exception as e:
                print(f"❌ {url}: 연결 실패 - {e}")
    
    def get_ranking_data(self, api_name=None, **params):
        """순위 데이터 조회"""
        if not self.captured_apis:
            print("❌ 사용 가능한 API가 없습니다")
            return None
        
        # API 선택
        if api_name:
            selected_api = None
            for api in self.captured_apis:
                if api_name in api.get('name', ''):
                    selected_api = api
                    break
            
            if not selected_api:
                print(f"❌ '{api_name}' API를 찾을 수 없습니다")
                return None
        else:
            # 첫 번째 API 사용
            selected_api = self.captured_apis[0]
        
        print(f"🎯 API 사용: {selected_api['name']}")
        print(f"📡 URL: {selected_api['url']}")
        
        try:
            # 요청 파라미터 준비
            request_params = {}
            for key, value in params.items():
                if key in selected_api.get('required_params', {}):
                    request_params[key] = value
            
            # API 호출
            if selected_api['method'] == 'GET':
                response = self.session.get(
                    selected_api['url'],
                    params=request_params,
                    timeout=30
                )
            else:
                response = self.session.post(
                    selected_api['url'],
                    json=request_params,
                    timeout=30
                )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"✅ API 호출 성공: {len(str(data))} bytes")
                    return data
                except:
                    print(f"⚠️ JSON 파싱 실패, 텍스트 응답: {len(response.text)} bytes")
                    return response.text
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                print(f"응답: {response.text[:500]}")
                return None
                
        except Exception as e:
            print(f"❌ API 호출 중 오류: {e}")
            return None
    
    def find_product_rank(self, keyword, product_id, max_pages=5):
        """특정 상품의 순위 찾기"""
        print(f"🔍 상품 순위 검색: {keyword} - {product_id}")
        
        for page in range(1, max_pages + 1):
            print(f"📄 {page}페이지 검색 중...")
            
            # 검색 API 호출
            search_data = self.get_ranking_data(
                api_name='검색',
                query=keyword,
                page=page,
                size=60
            )
            
            if not search_data:
                continue
            
            # 상품 목록에서 해당 상품 찾기
            products = self.extract_products_from_response(search_data)
            
            if not products:
                print(f"⚠️ {page}페이지에서 상품을 찾을 수 없습니다")
                continue
            
            for i, product in enumerate(products):
                if self.is_target_product(product, product_id):
                    rank = (page - 1) * 60 + i + 1
                    print(f"🎉 상품 발견! 순위: {rank}위")
                    return {
                        'rank': rank,
                        'page': page,
                        'position': i + 1,
                        'product': product
                    }
            
            print(f"📋 {page}페이지: {len(products)}개 상품 확인, 대상 상품 없음")
        
        print(f"❌ {max_pages}페이지 내에서 상품을 찾을 수 없습니다")
        return None
    
    def extract_products_from_response(self, response_data):
        """응답에서 상품 목록 추출"""
        if not response_data:
            return []
        
        # 다양한 응답 구조 처리
        product_keys = ['productList', 'products', 'items', 'data', 'results', 'list', 'content']
        
        for key in product_keys:
            if key in response_data:
                products = response_data[key]
                if isinstance(products, list):
                    return products
        
        # 직접 배열인 경우
        if isinstance(response_data, list):
            return response_data
        
        return []
    
    def is_target_product(self, product, target_id):
        """대상 상품인지 확인"""
        if not product or not isinstance(product, dict):
            return False
        
        # 다양한 ID 필드 확인
        id_fields = ['productId', 'itemId', 'id', 'product_id', 'item_id']
        
        for field in id_fields:
            if field in product and str(product[field]) == str(target_id):
                return True
        
        # URL에서 ID 추출
        url_fields = ['productUrl', 'url', 'link', 'product_url']
        
        for field in url_fields:
            if field in product:
                url = str(product[field])
                if target_id in url:
                    return True
        
        return False

def main():
    """메인 실행 함수"""
    print("🚀 모바일 쿠팡 API 클라이언트 시작")
    
    # 클라이언트 초기화
    client = MobileCoupangAPIClient()
    
    # 연결 테스트
    client.test_connection()
    
    # 세션 토큰 획득
    if not client.acquire_session_token():
        print("⚠️ 세션 토큰 없이 진행합니다")
    
    # 사용 가능한 API 목록 출력
    print("\n📋 사용 가능한 API:")
    for i, api in enumerate(client.captured_apis, 1):
        print(f"{i}. {api['name']}")
        print(f"   URL: {api['url']}")
        print(f"   파라미터: {list(api.get('required_params', {}).keys())}")
        print()
    
    # 테스트 검색
    print("🔍 테스트 검색 실행...")
    test_data = client.get_ranking_data(query='무선마우스', page=1, size=20)
    
    if test_data:
        print("✅ 테스트 검색 성공!")
        print(f"응답 데이터 크기: {len(str(test_data))} bytes")
        
        # 상품 목록 추출
        products = client.extract_products_from_response(test_data)
        print(f"추출된 상품 수: {len(products)}")
        
        if products:
            print("첫 번째 상품 정보:")
            first_product = products[0]
            for key, value in first_product.items():
                if len(str(value)) < 100:  # 긴 값은 생략
                    print(f"  {key}: {value}")
    else:
        print("❌ 테스트 검색 실패")

if __name__ == "__main__":
    main()











