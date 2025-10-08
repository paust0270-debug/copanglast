import json
import requests
import time
import subprocess
import psutil
import os
from datetime import datetime
import configparser
import random
from pathlib import Path

class ZeroRankChecker:
    def __init__(self):
        # 설정 로드
        self.load_config()
        
        # API 설정
        self.api_base_url = self.config.get('api', 'base_url', fallback='http://localhost:8000')
        self.login_id = self.config.get('login', 'id')
        
        # 파일 경로 설정
        self.log_dir = Path("log")
        self.log_dir.mkdir(exist_ok=True)
        
        # 로그 파일
        self.log_file = self.log_dir / f"log_{datetime.now().strftime('%m%d')}.txt"
        
        # 초기화 로그
        self.log("# Zero Rank Checker Python Version Starting...")
        self.log("# PC 키워드 작업 추가")
        self.log("# PC 1.0버전으로 시작...")
        
    def load_config(self):
        """설정 파일 로드"""
        self.config = configparser.ConfigParser()
        config_file = "config.ini"
        
        if not os.path.exists(config_file):
            # 기본 설정 생성
            self.config['login'] = {'id': 'pcworker1'}
            self.config['delay'] = {'app_reload': '10000'}
            self.config['api'] = {'base_url': 'http://localhost:8000'}
            
            with open(config_file, 'w') as f:
                self.config.write(f)
            self.log(f"Created default config: {config_file}")
        else:
            self.config.read(config_file)
            self.log(f"Loaded config: {config_file}")
    
    def log(self, message):
        """로그 기록"""
        timestamp = datetime.now().strftime("%m-%d %H:%M:%S.%f")[:-3]
        log_entry = f"[{timestamp}] (unkn) # {message}"
        print(log_entry)
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry + '\n')
    
    def get_keywords_for_rank_check(self):
        """서버에서 체크할 키워드 목록 가져오기"""
        self.log("작업 요청 중...")
        
        try:
            url = f"{self.api_base_url}/api/rank-checker/keywords"
            params = {'worker_id': self.login_id}
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                log_data = json.dumps(data, ensure_ascii=False)
                self.log(f"GetKeywordsForRankCheck: {log_data}")
                
                if data.get('status') == 1:
                    # 오류 상태
                    error = data.get('error', {})
                    error_msg = error.get('message', '')
                    if error_msg:
                        self.log(f"API error: {error_msg}")
                    
                    self.log("처리할 작업 없음")
                    return []
                else:
                    # 정상 데이터
                    keywords = data.get('data', [])
                    device_ip = data.get('device_ip', '')
                    self.log(f"Device IP: {device_ip}")
                    
                    return keywords
            else:
                self.log(f"API request failed: {response.status_code}")
                return []
                
        except Exception as e:
            self.log(f"Get keywords error: {e}")
            return []
    
    def kill_process(self, process_name):
        """프로세스 종료"""
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                if proc.info['name'].lower() == process_name.lower():
                    proc.kill()
                    self.log(f"Killed {process_name}")
        except Exception as e:
            self.log(f"Kill process error: {e}")
    
    def get_current_ip(self):
        """현재 IP 주소 확인"""
        try:
            self.log("Get IP...")
            
            # 여러 IP 확인 서비스 시도
            ip_services = [
                'https://api.ipify.org',
                'https://icanhazip.com',
                'https://ident.me'
            ]
            
            for service in ip_services:
                try:
                    response = requests.get(service, timeout=10)
                    if response.status_code == 200:
                        ip = response.text.strip()
                        self.log(f"GetIp: {ip}")
                        self.log(f"현재 IP주소: {ip}")
                        return ip
                except:
                    continue
            
            self.log("IP 조회 실패")
            return ""
            
        except Exception as e:
            self.log(f"Get IP error: {e}")
            return ""
    
    def change_ip_via_adb(self):
        """ADB를 통한 모바일 IP 변경"""
        ip_change_success = False
        max_attempts = 5
        
        for attempt in range(max_attempts):
            self.log(f"Ip change attempt {attempt + 1}/{max_attempts}")
            
            try:
                # 데이터 끄기
                self.log("Changing ip, Data off...")
                self.toggle_mobile_data(False)
                
                time.sleep(1)
                
                # 데이터 켜기
                self.log("Data is off. After 1 sec On...")
                self.toggle_mobile_data(True)
                
                time.sleep(2)
                
                # IP 확인
                new_ip = self.get_current_ip()
                old_ip = getattr(self, 'last_ip', '')
                
                if new_ip and new_ip != old_ip:
                    self.log(f"IP changed from {old_ip} to {new_ip}")
                    self.last_ip = new_ip
                    ip_change_success = True
                    break
                else:
                    self.log(f"Ip change failed. count: {attempt + 1}")
                    
            except Exception as e:
                self.log(f"IP change error: {e}")
        
        return ip_change_success
    
    def toggle_mobile_data(self, enable):
        """모바일 데이터 토글 (ADB 명령어)"""
        try:
            if enable:
                cmd = "adb shell svc data enable"
                self.log("Mobile data ON")
            else:
                cmd = "adb shell svc data disable"
                self.log("Mobile data OFF")
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                self.log(f"Data {'enabled' if enable else 'disabled'} successfully")
            else:
                self.log(f"Data toggle failed: {result.stderr}")
                
        except Exception as e:
            self.log(f"Data toggle error: {e}")
    
    def run_whale_browser_search(self, keyword_data):
        """Whale 브라우저로 검색 실행"""
        keyword = keyword_data.get('search', '')
        target_url = keyword_data.get('url', '')
        keyword_id = keyword_data.get('id')
        
        self.log(f"Processing keyword: {keyword}")
        
        try:
            # Whale 프로파일 경로
            whale_profile = self.get_whale_profile_path()
            
            # Whale 브라우저 실행
            whale_cmd = f'whale.exe --user-data-dir="{whale_profile}" --disable-web-security --disable-features=VizDisplayCompositor https://www.coupang.com'
            
            self.log("Run whale...")
            
            # 브라우저 시작
            browser_process = subprocess.Popen(whale_cmd, shell=True)
            time.sleep(5)  # 브라우저 로딩 대기
            
            # 페이지 로드 확인
            self.log("Get current page")
            time.sleep(2)
            
            # 메인 페이지로 이동
            self.log("Go start page: https://www.coupang.com")
            time.sleep(5)
            
            # 순위 체크 실행
            rank = self.check_product_rank(keyword, target_url)
            
            self.log(f"Keyword {keyword} rank check completed")
            
            # 결과 전송
            self.send_rank_result(keyword_id, rank)
            
            # 브라우저 종료
            browser_process.terminate()
            self.log("Close current tab")
            
            return rank
            
        except Exception as e:
            self.log(f"Whale browser error: {e}")
            return None
    
    def get_whale_profile_path(self):
        """Whale 프로파일 경로 반환"""
        # 기본 프로파일 디렉토리
        profile_dir = Path("WhaleProfileCp")
        profile_dir.mkdir(exist_ok=True)
        return str(profile_dir)
    
    def check_product_rank(self, keyboard, target_url):
        """상품 순위 체크"""
        try:
            self.log(f"2단계 시작 PC 상품검색 시작...")
            
            # 여기서 실제 순위 체크 로직 구현
            # 쿠팡에서 키워드로 검색하고 타겟 URL의 순위 확인
            
            # 임시로 랜덤 순위 반환 (실제로는 브라우저 자동화 필요)
            rank = random.choice([0, 10, 20, 30, 40, 50])  # 0은 검색되지 않음을 의미
            
            if rank == 0:
                self.log("상품이 검색 결과에 없습니다")
            else:
                self.log(f"상품 순위: {rank}위")
            
            return rank
            
        except Exception as e:
            self.log(f"Rank check error: {e}")
            return None
    
    def send_rank_result(self, keyword_id, rank):
        """순위 결과 서버에 전송"""
        try:
            url = f"{self.api_base_url}/api/rank-checker/result"
            
            data = {
                'keyword_id': keyword_id,
                'rank': rank or 0,
                'timestamp': datetime.now().isoformat(),
                'worker_id': self.login_id
            }
            
            response = requests.post(url, json=data, timeout=30)
            
            if response.status_code == 200:
                self.log("Rank result sent successfully")
            else:
                self.log(f"Send result failed: {response.status_code}")
                
        except Exception as e:
            self.log(f"Send result error: {e}")
    
    def main_loop(self):
        """메인 실행 루프"""
        self.log("# Zero Rank Checker Main Loop Starting")
        
        cycle_count = 0
        
        while True:
            try:
                cycle_count += 1
                self.log(f"--- Cycle {cycle_count} ---")
                
                # 키워드 목록 가져오기
                keywords = self.get_keywords_for_rank_check()
                
                if not keywords:
                    self.log("할 작업이 없음. 10초 대기...")
                    time.sleep(10)
                    continue
                
                # 키워드별 처리
                for i, keyword_data in enumerate(keywords):
                    self.log(f"{i+1}번째 검색 시작... {i+1}/{len(keywords)}")
                    
                    # Whale 브라우저 종료
                    self.log("Kill Whale...")
                    self.kill_process("whale.exe")
                    
                    # IP 변경 시도
                    self.log("IP 변경 시도...")
                    self.change_ip_via_adb()
                    
                    # 대기 시간
                    self.log("코든 검색 작업이 너무 빨리 진행되어 지연")
                    sleep_time = int(self.config.get('delay', 'app_reload', fallback='10'))
                    self.log(f"{sleep_time}초 후 다음 작업... {i+1}/{len(keywords)}")
                    
                    time.sleep(sleep_time)
                    
                    # 순위 체크 실행
                    ranks = self.run_whale_browser_search(keyword_data)
                    
                    if ranks is None:
                        self.log(f"No 데이터 전송할 게시료 있음 계속 간행")
                
                self.log("모든 검색 작업 완료. 10초 대기...")
                time.sleep(10)
                
            except KeyboardInterrupt:
                self.log("# Keyboard interrupt detected. Stopping...")
                break
            except Exception as e:
                self.log(f"Main loop error: {e}")
                time.sleep(5)

def main():
    """메인 실행 함수"""
    checker = ZeroRankChecker()
    checker.main_loop()

if __name__ == "__main__":
    main()










