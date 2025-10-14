import subprocess
import time
import json
import re
from datetime import datetime
import os
import configparser

class ADBCoupangRankChecker:
    def __init__(self):
        self.adb_path = "adb.exe"  # ADB 경로
        self.device_id = None
        self.coupang_package = "com.coupang.mobile"
        self.config = self.load_config()
        
    def load_config(self):
        """설정 파일 로드"""
        config = configparser.ConfigParser()
        config_file = "config.ini"
        
        if os.path.exists(config_file):
            config.read(config_file, encoding='utf-8')
        else:
            # 기본 설정 생성
            config['login'] = {'id': 'pc_rank4'}
            config['delay'] = {'app_reload': '10000'}
            with open(config_file, 'w', encoding='utf-8') as f:
                config.write(f)
        
        return config
    
    def run_adb_command(self, command, timeout=30):
        """ADB 명령어 실행"""
        try:
            full_command = f"{self.adb_path} {command}"
            result = subprocess.run(
                full_command, 
                shell=True, 
                capture_output=True, 
                text=True, 
                timeout=timeout,
                encoding='utf-8'
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Command timeout"
        except Exception as e:
            return False, "", str(e)
    
    def check_device_connection(self):
        """디바이스 연결 확인"""
        print("Checking device connection...")
        success, stdout, stderr = self.run_adb_command("devices")
        
        if not success:
            print(f"ADB command failed: {stderr}")
            return False
        
        lines = stdout.strip().split('\n')
        devices = []
        
        for line in lines[1:]:  # 첫 번째 줄은 "List of devices attached" 제외
            if line.strip() and '\tdevice' in line:
                device_id = line.split('\t')[0]
                devices.append(device_id)
        
        if devices:
            self.device_id = devices[0]
            print(f"Device connected: {self.device_id}")
            return True
        else:
            print("No device connected")
            return False
    
    def check_coupang_app(self):
        """쿠팡 앱 설치 확인"""
        print("Checking Coupang app...")
        success, stdout, stderr = self.run_adb_command(f"shell pm list packages | findstr {self.coupang_package}")
        
        if success and self.coupang_package in stdout:
            print(f"Coupang app found: {self.coupang_package}")
            return True
        else:
            print(f"Coupang app not found: {self.coupang_package}")
            return False
    
    def launch_coupang_app(self):
        """쿠팡 앱 실행"""
        print("Launching Coupang app...")
        success, stdout, stderr = self.run_adb_command(f"shell monkey -p {self.coupang_package} -c android.intent.category.LAUNCHER 1")
        
        if success:
            print("Coupang app launched successfully")
            time.sleep(3)  # 앱 로딩 대기
            return True
        else:
            print(f"Failed to launch app: {stderr}")
            return False
    
    def get_screen_info(self):
        """화면 정보 가져오기"""
        success, stdout, stderr = self.run_adb_command("shell wm size")
        if success:
            print(f"Screen size: {stdout.strip()}")
            return stdout.strip()
        return None
    
    def take_screenshot(self, filename=None):
        """스크린샷 촬영"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.png"
        
        success, stdout, stderr = self.run_adb_command(f"exec-out screencap -p > {filename}")
        if success:
            print(f"Screenshot saved: {filename}")
            return filename
        else:
            print(f"Screenshot failed: {stderr}")
            return None
    
    def tap_screen(self, x, y):
        """화면 탭"""
        success, stdout, stderr = self.run_adb_command(f"shell input tap {x} {y}")
        if success:
            print(f"Tapped at ({x}, {y})")
            return True
        else:
            print(f"Tap failed: {stderr}")
            return False
    
    def swipe_screen(self, x1, y1, x2, y2, duration=300):
        """화면 스와이프"""
        success, stdout, stderr = self.run_adb_command(f"shell input swipe {x1} {y1} {x2} {y2} {duration}")
        if success:
            print(f"Swiped from ({x1}, {y1}) to ({x2}, {y2})")
            return True
        else:
            print(f"Swipe failed: {stderr}")
            return False
    
    def input_text(self, text):
        """텍스트 입력"""
        # 특수문자 이스케이프
        escaped_text = text.replace(' ', '%s').replace('&', '\\&')
        success, stdout, stderr = self.run_adb_command(f'shell input text "{escaped_text}"')
        if success:
            print(f"Text input: {text}")
            return True
        else:
            print(f"Text input failed: {stderr}")
            return False
    
    def press_back(self):
        """뒤로가기 버튼"""
        success, stdout, stderr = self.run_adb_command("shell input keyevent KEYCODE_BACK")
        if success:
            print("Back button pressed")
            return True
        else:
            print(f"Back button failed: {stderr}")
            return False
    
    def press_home(self):
        """홈 버튼"""
        success, stdout, stderr = self.run_adb_command("shell input keyevent KEYCODE_HOME")
        if success:
            print("Home button pressed")
            return True
        else:
            print(f"Home button failed: {stderr}")
            return False
    
    def get_current_activity(self):
        """현재 액티비티 정보"""
        success, stdout, stderr = self.run_adb_command("shell dumpsys activity activities | grep mResumedActivity")
        if success:
            print(f"Current activity: {stdout.strip()}")
            return stdout.strip()
        return None
    
    def search_products(self, keyword):
        """상품 검색"""
        print(f"\nSearching for: {keyword}")
        
        try:
            # 1. 앱 실행
            if not self.launch_coupang_app():
                return []
            
            # 2. 화면 정보 확인
            self.get_screen_info()
            
            # 3. 스크린샷 촬영 (검색 전)
            self.take_screenshot(f"before_search_{keyword}.png")
            
            # 4. 검색창 찾기 및 클릭 (일반적인 검색창 위치)
            # 쿠팡 앱의 검색창은 보통 상단에 위치
            screen_width = 1080  # 일반적인 모바일 화면 크기
            screen_height = 1920
            
            # 검색창 위치 추정 (상단 중앙)
            search_x = screen_width // 2
            search_y = 200
            
            print("Looking for search box...")
            self.tap_screen(search_x, search_y)
            time.sleep(2)
            
            # 5. 검색어 입력
            print("Entering search keyword...")
            self.input_text(keyword)
            time.sleep(1)
            
            # 6. 검색 실행 (엔터키)
            success, stdout, stderr = self.run_adb_command("shell input keyevent KEYCODE_ENTER")
            time.sleep(3)
            
            # 7. 검색 결과 페이지 대기
            print("Waiting for search results...")
            time.sleep(5)
            
            # 8. 스크린샷 촬영 (검색 후)
            self.take_screenshot(f"after_search_{keyword}.png")
            
            # 9. 검색 결과 스크롤하여 더 많은 상품 로드
            print("Scrolling to load more products...")
            for i in range(3):
                self.swipe_screen(screen_width//2, screen_height*0.8, screen_width//2, screen_height*0.2, 500)
                time.sleep(2)
            
            # 10. 최종 스크린샷
            self.take_screenshot(f"final_search_{keyword}.png")
            
            # 11. 현재 액티비티 확인
            self.get_current_activity()
            
            # 12. 상품 정보 추출 (스크린샷 분석)
            products = self.extract_products_from_screenshot(f"final_search_{keyword}.png", keyword)
            
            return products
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def extract_products_from_screenshot(self, screenshot_file, keyword):
        """스크린샷에서 상품 정보 추출 (기본 구조)"""
        products = []
        
        # 실제 구현에서는 OCR이나 이미지 분석을 사용해야 함
        # 여기서는 기본 구조만 제공
        
        print(f"Analyzing screenshot: {screenshot_file}")
        
        # 임시 데이터 (실제로는 스크린샷 분석 결과)
        sample_products = [
            {
                'rank': 1,
                'product_id': '1234567890',
                'title': f'{keyword} 상품 1',
                'price': '29,900원',
                'reviews': '1,234',
                'timestamp': datetime.now().isoformat()
            },
            {
                'rank': 2,
                'product_id': '1234567891',
                'title': f'{keyword} 상품 2',
                'price': '39,900원',
                'reviews': '2,345',
                'timestamp': datetime.now().isoformat()
            }
        ]
        
        return sample_products
    
    def check_rank(self, keyword):
        """순위 체크 실행"""
        print(f"\nRank check started: {keyword}")
        
        # 디바이스 연결 확인
        if not self.check_device_connection():
            print("Device not connected")
            return None
        
        # 쿠팡 앱 확인
        if not self.check_coupang_app():
            print("Coupang app not installed")
            return None
        
        # 상품 검색
        products = self.search_products(keyword)
        
        if not products:
            print("No products found.")
            return None
        
        # 결과 출력
        print(f"\nSearch results (Total {len(products)} products):")
        print("-" * 80)
        print(f"{'Rank':<4} {'Product ID':<12} {'Title':<40} {'Price':<10} {'Reviews':<8}")
        print("-" * 80)
        
        for product in products:
            title = product['title'][:37] + "..." if len(product['title']) > 40 else product['title']
            print(f"{product['rank']:<4} {product['product_id']:<12} {title:<40} {product['price']:<10} {product['reviews']:<8}")
        
        return products
    
    def save_rank_data(self, keyword, products, filename=None):
        """순위 데이터 저장"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"adb_rank_data_{keyword}_{timestamp}.json"
        
        data = {
            'keyword': keyword,
            'timestamp': datetime.now().isoformat(),
            'total_products': len(products),
            'products': products,
            'device_id': self.device_id,
            'coupang_package': self.coupang_package
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Rank data saved: {filename}")
        return filename
    
    def close(self):
        """정리 작업"""
        print("Cleaning up...")
        # 앱 종료
        self.run_adb_command(f"shell am force-stop {self.coupang_package}")
        print("ADB rank checker closed")

def main():
    """메인 실행 함수"""
    print("ADB Coupang Rank Checker System")
    print("=" * 60)
    
    checker = ADBCoupangRankChecker()
    
    try:
        # 테스트 키워드들
        test_keywords = [
            "mouse",
            "keyboard"
        ]
        
        for keyword in test_keywords:
            try:
                # 순위 체크
                products = checker.check_rank(keyword)
                
                if products:
                    # 데이터 저장
                    checker.save_rank_data(keyword, products)
                
                print("\n" + "="*60)
                time.sleep(5)  # 키워드 간 대기
                
            except Exception as e:
                print(f"Error searching {keyword}: {e}")
                continue
        
        print("ADB rank check completed!")
        
    finally:
        # 정리 작업
        checker.close()

if __name__ == "__main__":
    main()










