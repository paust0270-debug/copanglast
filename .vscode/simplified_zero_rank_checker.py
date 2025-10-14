#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import requests
import time
import subprocess
import os
from datetime import datetime
import configparser
import random
from pathlib import Path

class SimplifiedZeroRankChecker:
    def __init__(self):
        self.load_config()
        self.setup_directories()
        self.log_base_time = datetime.now()
        
        # API 설정
        self.api_base_url = self.config.get('api', 'base_url', fallback='http://localhost:8000')
        self.login_id = self.config.get('login', 'id', fallback='pcworker_python')
        
        self.log("Zero Rank Checker Python Version 시작")
        self.log("PC 키워드 작업 추가")
        self.log("PC 1.0버전으로 시작...")
        
    def load_config(self):
        """설정 파일 로드"""
        self.config = configparser.ConfigParser()
        config_file = "config.ini"
        
        if not os.path.exists(config_file):
            # 기본 설정 생성
            self.config['login'] = {'id': 'pcworker_python'}
            self.config['delay'] = {'app_reload': '10'}
            self.config['api'] = {'base_url': 'http://localhost:8000'}
            
            with open(config_file, 'w', encoding='utf-8') as f:
                self.config.write(f)
            self.log(f"기본 설정 파일 생성: {config_file}")
        else:
            self.config.read(config_file, encoding='utf-8')
            self.log(f"설정 파일 로드: {config_file}")
    
    def setup_directories(self):
        """디렉토리 설정"""
        self.log_dir = Path("log")
        self.log_dir.mkdir(exist_ok=True)
        
        # 로그 파일
        self.log_file = self.log_dir / f"log_{datetime.now().strftime('%m%d')}.txt"
        
    def log(self, message):
        """로그 기록 (한글 인코딩 문제 해결)"""
        timestamp = datetime.now().strftime("%m-%d %H:%M:%S.%f")[:-3]
        log_entry = f"[{timestamp}] (unkn) # {message}"
        print(log_entry)
        
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry + '\n')
        except Exception as e:
            print(f"로그 파일 쓰기 실패: {e}")
    
    def get_keywords_for_rank_check(self):
        """서버에서 체크할 키워드 목록 가져오기"""
        self.log("작업 요청 중...")
        
        try:
            # 테스트용 더미 데이터 반환 (실제 서버가 없으므로)
            dummy_keywords = [
                {
                    'id': 1001,
                    'keyword_id': 1001,
                    'service_type': 9,
                    'search': '트롤리',
                    'search_main': None,
                    'target': None,
                    'url': 'https://www.coupang.com/vp/products/8473798698?itemId=24519876305&vendorItemId=89369126187',
                    'code': None,
                    'code2': None,
                    'code3': None,
                    'product_url': None,
                    'rank': 0,
                    'get_detail': 0,
                    'rank_check_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'ua_change': 0
                },
                {
                    'id': 1002,
                    'keyword_id': 1002,
                    'service_type': 9,
                    'search': '카트',
                    'search_main': None,
                    'target': None,
                    'url': 'https://www.coupang.com/vp/products/1234567890?itemId=1234567890&vendorItemId=1234567890',
                    'code': None,
                    'code2': None,
                    'code3': None,
                    'product_url': None,
                    'rank': 0,
                    'get_detail': 0,
                    'rank_check_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'ua_change': 0
                }
            ]
            
            # 실제 API 호출 시뮬레이션
            url = f"{self.api_base_url}/api/rank-checker/keywords"
            params = {'worker_id': self.login_id}
            
            try:
                response = requests.get(url, params=params, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    log_data = json.dumps(data, ensure_ascii=False)
                    self.log(f"GetKeywordsForRankCheck: {log_data}")
                    
                    if data.get('status') == 0:
                        keywords = data.get('data', [])
                        device_ip = data.get('device_ip', '')
                        self.log(f"Device IP: {device_ip}")
                        return keywords
                    else:
                        self.log("처리할 작업 없음")
                        return []
                else:
                    self.log(f"API 요청 실패: {response.status_code}")
            except:
                self.log("API 서버 연결 실패 - 테스트 모드")
                self.log("GetKeywordsForRankCheck: 더미 데이터 사용")
            
            # 테스트 시나리오에 따라 키워드 반환
            test_cycle = int(self.log_base_time.strftime('%H')) % 2
            if test_cycle == 0:
                return dummy_keywords[:1]  # 트롤리만 체크
            else:
                return []
                
        except Exception as e:
            self.log(f"키워드 조회 오류: {e}")
            return []
    
    def get_current_ip(self):
        """현재 IP 주소 확인"""
        try:
            self.log("IP 조회 중...")
            
            # IP 확인 서비스들
            ip_services = [
                'https://api.ipify.org',
                'https://icanhazip.com',
                'https://ident.me'
            ]
            
            for service in ip_services:
                try:
                    response = requests.get(service, timeout=5)
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
            self.log(f"IP 조회 오류: {e}")
            return ""
    
    def kill_process(self, process_name):
        """프로세스 종료 (간단 버전)"""
        try:
            self.log(f"Whale 프로세스 종료 시도...")
            # 실제 구현에서는 psutil 사용
            # os.system(f"taskkill /f /im {process_name}.exe")
            self.log("Whale 종료됨")
        except Exception as e:
            self.log(f"프로세스 종료 오류: {e}")
    
    def simulate_ip_change(self):
        """IP 변경 시뮬레이션"""
        ip_change_success = False
        max_attempts = 3
        
        self.log("IP 변경 시뮬레이션 시작...")
        
        for attempt in range(max_attempts):
            self.log(f"IP 변경 시도 {attempt + 1}/{max_attempts}")
            
            # 실제로는 ADB 명령어 실행
            self.log("모바일 데이터 끔...")
            time.sleep(1)
            self.log("1초 후 모바일 데이터 켬...")
            time.sleep(2)
            
            # IP 변경 시뮬레이션 (실제로는 다를 수 있음)
            if random.random() > 0.7:  # 30% 확률로 성공
                new_ip = f"175.223.{random.randint(1,255)}.{random.randint(1,255)}"
                old_ip = getattr(self, 'last_ip', 'unknown')
                self.log(f"IP 변경 성공: {old_ip} -> {new_ip}")
                self.last_ip = new_ip
                ip_change_success = True
                break
            else:
                self.log(f"IP 변경 실패. 시도 횟수: {attempt + 1}")
        
        return ip_change_success
    
    def run_coupang_search_simulation(self, keyword_data):
        """쿠팡 검색 시뮬레이션"""
        keyword = keyword_data.get('search', '')
        target_url = keyword_data.get('url', '')
        keyword_id = keyword_data.get('id')
        
        self.log(f"키워드 처리 시작: {keyword}")
        
        # 쿠팡 검색 시뮬레이션
        self.log("쿠팡 메인 페이지로 이동...")
        time.sleep(2)
        
        self.log(f"검색어 '{keyword}' 검색 중...")
        time.sleep(3)
        
        # 순위 체크 시뮬레이션
        self.log("상품 리스트에서 순위 확인 중...")
        rank = self.simulate_rank_check(keyword, target_url)
        
        self.log(f"키워드 '{keyword}' 순위 체크 완료")
        
        return rank
    
    def simulate_rank_check(self, keyword, target_url):
        """순위 체크 시뮬레이션"""
        try:
            # 시뮬레이션 로직
            # 실제로는 브라우저 자동화 또는 API 호출
            
            # 성공률 70%로 실제 순위 체크 시뮬레이션
            if random.random() > 0.3:
                rank = random.choice([1, 2, 5, 10, 15, 20, 25, 30, 0])
                
                if rank == 0:
                    self.log("검색 결과에 상품이 없습니다")
                else:
                    self.log(f"상품 순위: {rank}위")
                    
                return rank
            else:
                self.log("검색 실패 - 네트워크 오류 또는 봇 탐지")
                return None
                
        except Exception as e:
            self.log(f"순위 체크 오류: {e}")
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
            
            try:
                response = requests.post(url, json=data, timeout=10)
                if response.status_code == 200:
                    self.log("순위 결과 전송 성공")
                else:
                    self.log(f"결과 전송 실패: {response.status_code}")
            except:
                self.log("API 서버 없음 - 결과 전송 건너뜀")
                
        except Exception as e:
            self.log(f"결과 전송 오류: {e}")
    
    def main_loop(self):
        """메인 실행 루프"""
        self.log("메인 루프 시작")
        
        cycle_count = 0
        
        while True:
            try:
                cycle_count += 1
                self.log(f"--- 사이클 {cycle_count} ---")
                
                # 키워드 목록 가져오기
                keywords = self.get_keywords_for_rank_check()
                
                if not keywords:
                    self.log("처리할 작업이 없습니다. 10초 대기...")
                    time.sleep(10)
                    continue
                
                self.log(f"{len(keywords)}개 키워드 발견")
                
                # 키워드별 처리
                for i, keyword_data in enumerate(keywords):
                    self.log(f"{i+1}번째 검색 시작... {i+1}/{len(keywords)}")
                    
                    # Whale 브라우저 종료 시뮬레이션
                    self.log("Whale 종료...")
                    self.kill_process("whale")
                    
                    # IP 변경 시도
                    self.log("IP 변경 시도...")
                    self.simulate_ip_change()
                    
                    # 대기 시간
                    sleep_time = int(self.config.get('delay', 'app_reload', fallback='10'))
                    self.log(f"{sleep_time}초 대기 후 다음 작업... {i+1}/{len(keywords)}")
                    
                    time.sleep(sleep_time)
                    
                    # 순위 체크 실행
                    rank = self.run_coupang_search_simulation(keyword_data)
                    
                    if rank is not None:
                        keyword_id = keyword_data.get('id')
                        self.send_rank_result(keyword_id, rank)
                    
                    self.log(f"No 데이터 전송할 거시료 있음 계속 진행")
                
                self.log("모든 검색 작업 완료. 10초 대기...")
                time.sleep(10)
                
            except KeyboardInterrupt:
                self.log("키보드 인터럽트 감지. 종료 중...")
                break
            except Exception as e:
                self.log(f"메인 루프 오류: {e}")
                time.sleep(5)

def main():
    """메인 실행 함수"""
    print("=" * 70)
    print("Zero Rank Checker Python Version")
    print("=" * 70)
    
    checker = SimplifiedZeroRankChecker()
    
    try:
        checker.main_loop()
    except Exception as e:
        print(f"시스템 오류: {e}")

if __name__ == "__main__":
    main()










