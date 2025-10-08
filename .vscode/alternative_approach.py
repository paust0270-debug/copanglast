import requests
import time
import json
from datetime import datetime
import random

class AlternativeCoupangApproach:
    def __init__(self):
        self.session = requests.Session()
        self.setup_session()
        
    def setup_session(self):
        """세션 설정"""
        # 다양한 User-Agent 랜덤 선택
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36"
        ]
        
        selected_ua = random.choice(user_agents)
        
        self.session.headers.update({
            'User-Agent': selected_ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        })
        
        # HTTP/1.1 강제 사용
        self.session.mount('https://', requests.adapters.HTTPAdapter(max_retries=3))
        self.session.mount('http://', requests.adapters.HTTPAdapter(max_retries=3))
    
    def get_current_ip(self):
        """현재 IP 정보 확인"""
        try:
            response = requests.get('https://ipinfo.io/json', timeout=10)
            ip_info = response.json()
            print(f"Current IP: {ip_info.get('ip')}")
            print(f"ISP: {ip_info.get('org')}")
            return ip_info
        except Exception as e:
            print(f"IP check failed: {e}")
            return None
    
    def test_alternative_endpoints(self):
        """대안 엔드포인트 테스트"""
        print("\nTesting alternative Coupang endpoints...")
        
        endpoints = [
            "https://www.coupang.com",
            "https://m.coupang.com",
            "https://www.coupang.com/np",
            "https://www.coupang.com/np/categories",
            "https://www.coupang.com/np/search",
            "https://www.coupang.com/np/search?q=test"
        ]
        
        results = {}
        
        for endpoint in endpoints:
            try:
                print(f"Testing: {endpoint}")
                
                # 랜덤 지연
                time.sleep(random.uniform(2, 4))
                
                response = self.session.get(endpoint, timeout=30)
                
                results[endpoint] = {
                    'status_code': response.status_code,
                    'content_length': len(response.text),
                    'success': response.status_code == 200
                }
                
                print(f"  Status: {response.status_code}, Length: {len(response.text)}")
                
            except Exception as e:
                results[endpoint] = {
                    'status_code': 'ERROR',
                    'error': str(e),
                    'success': False
                }
                print(f"  Error: {e}")
        
        return results
    
    def try_mobile_version(self):
        """모바일 버전 시도"""
        print("\nTrying mobile version...")
        
        # 모바일 User-Agent로 변경
        mobile_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        
        self.session.headers.update({
            'User-Agent': mobile_ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
        })
        
        try:
            # 모바일 메인 페이지
            response = self.session.get("https://m.coupang.com", timeout=30)
            print(f"Mobile main page: {response.status_code} - {len(response.text)} bytes")
            
            if response.status_code == 200:
                # 모바일 검색 페이지
                search_response = self.session.get("https://m.coupang.com/np/search?q=mouse", timeout=30)
                print(f"Mobile search page: {search_response.status_code} - {len(search_response.text)} bytes")
                
                return search_response.status_code == 200
            
        except Exception as e:
            print(f"Mobile version failed: {e}")
            return False
    
    def try_different_search_approaches(self):
        """다른 검색 접근법 시도"""
        print("\nTrying different search approaches...")
        
        approaches = [
            {
                'name': 'Direct Search URL',
                'url': 'https://www.coupang.com/np/search?q=mouse',
                'headers': {}
            },
            {
                'name': 'Mobile Search URL',
                'url': 'https://m.coupang.com/np/search?q=mouse',
                'headers': {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'}
            },
            {
                'name': 'Category Page',
                'url': 'https://www.coupang.com/np/categories/393760',
                'headers': {}
            },
            {
                'name': 'API Endpoint',
                'url': 'https://www.coupang.com/api/v4/search',
                'headers': {'Accept': 'application/json'}
            }
        ]
        
        results = {}
        
        for approach in approaches:
            try:
                print(f"Testing {approach['name']}...")
                
                # 헤더 업데이트
                test_headers = self.session.headers.copy()
                test_headers.update(approach['headers'])
                
                # 랜덤 지연
                time.sleep(random.uniform(3, 6))
                
                response = self.session.get(approach['url'], headers=test_headers, timeout=30)
                
                results[approach['name']] = {
                    'status_code': response.status_code,
                    'content_length': len(response.text),
                    'success': response.status_code == 200,
                    'url': approach['url']
                }
                
                print(f"  Status: {response.status_code}, Length: {len(response.text)}")
                
            except Exception as e:
                results[approach['name']] = {
                    'status_code': 'ERROR',
                    'error': str(e),
                    'success': False,
                    'url': approach['url']
                }
                print(f"  Error: {e}")
        
        return results
    
    def analyze_results(self, results):
        """결과 분석"""
        print("\n" + "="*60)
        print("ANALYSIS RESULTS")
        print("="*60)
        
        successful_endpoints = []
        failed_endpoints = []
        
        for name, result in results.items():
            if result['success']:
                successful_endpoints.append((name, result))
                print(f"✅ {name}: {result['status_code']} - {result['content_length']} bytes")
            else:
                failed_endpoints.append((name, result))
                print(f"❌ {name}: {result.get('status_code', 'ERROR')} - {result.get('error', 'Unknown error')}")
        
        print(f"\nSummary:")
        print(f"  Successful: {len(successful_endpoints)}")
        print(f"  Failed: {len(failed_endpoints)}")
        
        if successful_endpoints:
            print(f"\nWorking endpoints:")
            for name, result in successful_endpoints:
                print(f"  - {name}: {result['url']}")
        
        return successful_endpoints, failed_endpoints

def main():
    """메인 실행 함수"""
    print("Alternative Coupang Approach Test")
    print("=" * 60)
    
    checker = AlternativeCoupangApproach()
    
    # IP 확인
    checker.get_current_ip()
    
    # 대안 엔드포인트 테스트
    endpoint_results = checker.test_alternative_endpoints()
    
    # 모바일 버전 테스트
    mobile_success = checker.try_mobile_version()
    
    # 다른 검색 접근법 테스트
    search_results = checker.try_different_search_approaches()
    
    # 모든 결과 합치기
    all_results = {**endpoint_results, **search_results}
    
    # 결과 분석
    successful, failed = checker.analyze_results(all_results)
    
    # 결과 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"alternative_approach_results_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'successful_endpoints': successful,
            'failed_endpoints': failed,
            'all_results': all_results,
            'mobile_success': mobile_success
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nResults saved to: {filename}")
    print("Alternative approach test completed!")

if __name__ == "__main__":
    main()










