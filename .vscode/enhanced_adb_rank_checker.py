import subprocess
import time
import json
import re
from datetime import datetime
import os
import configparser
import cv2
import numpy as np
from PIL import Image
import pytesseract

class EnhancedADBCoupangRankChecker:
    def __init__(self):
        self.adb_path = "adb.exe"  # ADB 경로
        self.device_id = None
        self.coupang_package = "com.coupang.mobile"
        self.config = self.load_config()
        
        # Tesseract 경로 설정 (Windows)
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
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
    
    def run_adb_command(self, command, timeout=30, retries=3):
        """ADB 명령어 실행 (재시도 로직 포함)"""
        for attempt in range(retries):
            try:
                full_command = f"{self.adb_path} {command}"
                result = subprocess.run(
                    full_command, 
                    shell=True, 
                    capture_output=True, 
                    text=True, 
                    timeout=timeout,
                    encoding='utf-8',
                    errors='replace'  # 인코딩 오류 시 대체 문자 사용
                )
                
                if result.returncode == 0:
                    return True, result.stdout, result.stderr
                else:
                    print(f"ADB command failed (attempt {attempt + 1}/{retries}): {result.stderr}")
                    if attempt < retries - 1:
                        time.sleep(2)  # 재시도 전 대기
                        continue
                    return False, result.stdout, result.stderr
                    
            except subprocess.TimeoutExpired:
                print(f"ADB command timeout (attempt {attempt + 1}/{retries})")
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                return False, "", "Command timeout"
            except Exception as e:
                print(f"ADB command error (attempt {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                return False, "", str(e)
        
        return False, "", "All retry attempts failed"
    
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
    
    def wake_up_screen(self):
        """화면 깨우기"""
        print("Waking up screen...")
        
        # 화면 상태 확인
        success, stdout, stderr = self.run_adb_command("shell dumpsys display | findstr mDisplayState")
        if success and "OFF" in stdout:
            print("Screen is off, waking up...")
            # 화면 켜기
            self.run_adb_command("shell input keyevent KEYCODE_POWER")
            time.sleep(1)
            self.run_adb_command("shell input keyevent KEYCODE_WAKEUP")
            time.sleep(2)
            
            # 화면이 켜졌는지 확인
            success, stdout, stderr = self.run_adb_command("shell dumpsys display | findstr mDisplayState")
            if success and "ON" in stdout:
                print("Screen is now on")
                return True
            else:
                print("Failed to wake up screen")
                return False
        else:
            print("Screen is already on")
            return True
    
    def launch_coupang_app(self):
        """쿠팡 앱 실행"""
        print("Launching Coupang app...")
        
        # 먼저 화면 켜기
        if not self.wake_up_screen():
            return False
        
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
        """스크린샷 촬영 (개선된 버전)"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.png"
        
        # 여러 방법으로 스크린샷 시도
        methods = [
            f"exec-out screencap -p > {filename}",
            f"shell screencap -p /sdcard/screenshot.png && pull /sdcard/screenshot.png {filename}",
            f"shell screencap -p /sdcard/screenshot.png && pull /sdcard/screenshot.png {filename} && shell rm /sdcard/screenshot.png"
        ]
        
        for i, method in enumerate(methods):
            print(f"Screenshot method {i+1}: {method}")
            success, stdout, stderr = self.run_adb_command(method)
            
            if success and os.path.exists(filename) and os.path.getsize(filename) > 1000:
                print(f"Screenshot saved: {filename} ({os.path.getsize(filename)} bytes)")
                return filename
            else:
                print(f"Screenshot method {i+1} failed: {stderr}")
                if os.path.exists(filename):
                    os.remove(filename)
        
        print("All screenshot methods failed")
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
    
    def preprocess_image_for_ocr(self, image_path):
        """OCR을 위한 이미지 전처리 (개선된 버전)"""
        try:
            # 이미지 로드
            image = cv2.imread(image_path)
            if image is None:
                print(f"Could not load image: {image_path}")
                return None
            
            # 그레이스케일 변환
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 이미지 크기 조정 (OCR 정확도 향상)
            height, width = gray.shape
            if width > 2000:
                scale = 2000 / width
                new_width = int(width * scale)
                new_height = int(height * scale)
                gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_AREA)
            
            # 가우시안 블러로 노이즈 제거
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            
            # 적응적 히스토그램 균등화
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            enhanced = clahe.apply(blurred)
            
            # 모폴로지 연산으로 텍스트 선명화
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            enhanced = cv2.morphologyEx(enhanced, cv2.MORPH_CLOSE, kernel)
            
            # 적응적 이진화 (더 나은 텍스트 인식)
            binary = cv2.adaptiveThreshold(
                enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # 노이즈 제거 (작은 점들 제거)
            kernel_noise = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
            binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_noise)
            
            # 전처리된 이미지 저장
            processed_path = image_path.replace('.png', '_processed.png')
            cv2.imwrite(processed_path, binary)
            
            print(f"Image preprocessed: {processed_path}")
            return processed_path
            
        except Exception as e:
            print(f"Image preprocessing failed: {e}")
            return None
    
    def extract_text_with_ocr(self, image_path):
        """OCR로 텍스트 추출 (개선된 버전)"""
        try:
            # 이미지 전처리
            processed_path = self.preprocess_image_for_ocr(image_path)
            if not processed_path:
                return ""
            
            # OCR 실행
            image = Image.open(processed_path)
            
            # 여러 OCR 설정 시도
            ocr_configs = [
                r'--oem 3 --psm 6 -l eng',  # 영어만
                r'--oem 3 --psm 3 -l eng',  # 자동 페이지 분할
                r'--oem 3 --psm 4 -l eng',  # 단일 컬럼 텍스트
                r'--oem 3 --psm 8 -l eng',  # 단일 단어
                r'--oem 3 --psm 13 -l eng'  # 원시 라인
            ]
            
            best_text = ""
            max_length = 0
            
            for config in ocr_configs:
                try:
                    text = pytesseract.image_to_string(image, config=config)
                    if len(text.strip()) > max_length:
                        max_length = len(text.strip())
                        best_text = text
                except Exception as e:
                    print(f"OCR config failed: {config}, error: {e}")
                    continue
            
            # 숫자와 특수문자 포함한 텍스트 정리
            cleaned_text = self.clean_ocr_text(best_text)
            
            print(f"OCR extracted {len(cleaned_text)} characters")
            return cleaned_text
            
        except Exception as e:
            print(f"OCR failed: {e}")
            return ""
    
    def clean_ocr_text(self, text):
        """OCR 텍스트 정리"""
        if not text:
            return ""
        
        try:
            # 인코딩 문제 해결
            if isinstance(text, bytes):
                text = text.decode('utf-8', errors='replace')
            
            # 불필요한 공백 제거
            lines = text.split('\n')
            cleaned_lines = []
            
            for line in lines:
                line = line.strip()
                if line and len(line) > 2:  # 너무 짧은 줄 제외
                    # 특수문자 정리
                    line = line.replace('\x00', '').replace('\ufffd', '')
                    cleaned_lines.append(line)
            
            return '\n'.join(cleaned_lines)
            
        except Exception as e:
            print(f"Error cleaning OCR text: {e}")
            return text if text else ""
    
    def extract_products_from_screenshot(self, screenshot_file, keyword):
        """스크린샷에서 상품 정보 추출 (OCR 사용)"""
        products = []
        
        print(f"Analyzing screenshot with OCR: {screenshot_file}")
        
        try:
            # OCR로 텍스트 추출
            ocr_text = self.extract_text_with_ocr(screenshot_file)
            
            if not ocr_text:
                print("No text extracted from screenshot")
                return []
            
            print(f"OCR extracted text length: {len(ocr_text)}")
            print("OCR Text preview:")
            
            # 안전한 텍스트 출력
            try:
                safe_text = ocr_text.encode('utf-8', errors='replace').decode('utf-8')
                print(safe_text[:500] + "..." if len(safe_text) > 500 else safe_text)
            except:
                print("Text preview unavailable due to encoding issues")
            
            # 상품 정보 파싱
            products = self.parse_product_info_from_text(ocr_text, keyword)
            
            # 순위 감지 알고리즘 적용
            products = self.detect_product_ranks(products, keyword)
            
            return products
            
        except Exception as e:
            print(f"Error extracting products from screenshot: {e}")
            return []
    
    def detect_product_ranks(self, products, keyword):
        """상품 순위 감지 알고리즘"""
        if not products:
            return []
        
        try:
            # 상품 정보를 기반으로 순위 재정렬
            ranked_products = []
            
            # 1. 가격이 있는 상품 우선
            products_with_price = [p for p in products if p['price'] != 'N/A']
            products_without_price = [p for p in products if p['price'] == 'N/A']
            
            # 2. 가격이 있는 상품을 가격 순으로 정렬 (낮은 가격부터)
            if products_with_price:
                # 가격 문자열에서 숫자만 추출하여 정렬
                def extract_price_number(price_str):
                    try:
                        # "12,000원" -> 12000
                        price_clean = re.sub(r'[^\d]', '', price_str)
                        return int(price_clean) if price_clean else 0
                    except:
                        return 0
                
                products_with_price.sort(key=lambda x: extract_price_number(x['price']))
            
            # 3. 리뷰 수가 많은 상품 우선 (가격이 없는 상품 중)
            if products_without_price:
                def extract_review_number(review_str):
                    try:
                        review_clean = re.sub(r'[^\d]', '', review_str)
                        return int(review_clean) if review_clean else 0
                    except:
                        return 0
                
                products_without_price.sort(key=lambda x: extract_review_number(x['reviews']), reverse=True)
            
            # 4. 최종 순위 할당
            all_products = products_with_price + products_without_price
            
            for i, product in enumerate(all_products):
                product['rank'] = i + 1
                product['confidence'] = self.calculate_rank_confidence(product, keyword)
                ranked_products.append(product)
            
            print(f"Rank detection completed: {len(ranked_products)} products ranked")
            
            return ranked_products
            
        except Exception as e:
            print(f"Error in rank detection: {e}")
            return products
    
    def calculate_rank_confidence(self, product, keyword):
        """순위 신뢰도 계산"""
        confidence = 0.0
        
        try:
            # 기본 신뢰도
            confidence += 0.3
            
            # 키워드 매칭 점수
            title_lower = product['title'].lower()
            keyword_lower = keyword.lower()
            
            if keyword_lower in title_lower:
                confidence += 0.4
                
                # 키워드 위치에 따른 점수
                keyword_pos = title_lower.find(keyword_lower)
                if keyword_pos == 0:  # 제목 시작에 키워드
                    confidence += 0.2
                elif keyword_pos < len(title_lower) * 0.3:  # 앞쪽에 키워드
                    confidence += 0.1
            
            # 가격 정보가 있으면 점수 추가
            if product['price'] != 'N/A':
                confidence += 0.2
            
            # 리뷰 수가 있으면 점수 추가
            if product['reviews'] != '0' and product['reviews'] != 'N/A':
                try:
                    review_num = int(re.sub(r'[^\d]', '', product['reviews']))
                    if review_num > 0:
                        confidence += 0.1
                except:
                    pass
            
            # 제목 길이 적절성
            title_len = len(product['title'])
            if 10 <= title_len <= 100:
                confidence += 0.1
            
            return min(confidence, 1.0)  # 최대 1.0
            
        except Exception as e:
            print(f"Error calculating confidence: {e}")
            return 0.5
    
    def parse_product_info_from_text(self, text, keyword):
        """OCR 텍스트에서 상품 정보 파싱 (개선된 버전)"""
        products = []
        
        try:
            # 인코딩 문제 해결
            if isinstance(text, bytes):
                text = text.decode('utf-8', errors='replace')
            
            # 특수문자 정리
            text = text.replace('\x00', '').replace('\ufffd', '').replace('\xa9', '')
            # 다양한 가격 패턴 (더 포괄적)
            price_patterns = [
                r'(\d{1,3}(?:,\d{3})*)\s*원',
                r'₩\s*(\d{1,3}(?:,\d{3})*)',
                r'(\d{1,3}(?:,\d{3})*)\s*₩',
                r'(\d{1,3}(?:,\d{3})*)\s*W',
                r'(\d{1,3}(?:,\d{3})*)\s*KRW',
                r'(\d{1,3}(?:,\d{3})*)\s*₩',
                r'(\d{1,3}(?:,\d{3})*)\s*원',
                r'(\d{1,3}(?:,\d{3})*)\s*원',
                r'(\d{1,3}(?:,\d{3})*)\s*원',
                r'(\d{1,3}(?:,\d{3})*)\s*원'
            ]
            
            # 리뷰 수 패턴 (더 포괄적)
            review_patterns = [
                r'(\d{1,3}(?:,\d{3})*)\s*개?\s*리뷰',
                r'리뷰\s*(\d{1,3}(?:,\d{3})*)',
                r'\((\d{1,3}(?:,\d{3})*)\)',
                r'(\d{1,3}(?:,\d{3})*)\s*review',
                r'review\s*(\d{1,3}(?:,\d{3})*)',
                r'(\d{1,3}(?:,\d{3})*)\s*개',
                r'(\d{1,3}(?:,\d{3})*)\s*건'
            ]
            
            # 상품 제목 패턴 (키워드 포함)
            title_patterns = [
                rf'{keyword}.*?(?=\d{{1,3}}(?:,\d{{3}})*\s*원)',
                rf'{keyword}.*?(?=₩)',
                rf'{keyword}.*?(?=\d{{1,3}}(?:,\d{{3}})*\s*개?\s*리뷰)',
                rf'{keyword}.*?(?=\d{{1,3}}(?:,\d{{3}})*\s*review)'
            ]
            
            # 텍스트를 줄 단위로 분할
            lines = text.split('\n')
            
            current_rank = 1
            for i, line in enumerate(lines):
                line = line.strip()
                if not line or len(line) < 5:
                    continue
                
                # 키워드가 포함된 줄 찾기 (대소문자 무시)
                if keyword.lower() in line.lower():
                    product_info = {
                        'rank': current_rank,
                        'product_id': f'extracted_{current_rank}',
                        'title': line[:50] + "..." if len(line) > 50 else line,
                        'price': 'N/A',
                        'reviews': '0',
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    # 가격 추출
                    for pattern in price_patterns:
                        price_match = re.search(pattern, line)
                        if price_match:
                            product_info['price'] = price_match.group(1) + '원'
                            break
                    
                    # 리뷰 수 추출
                    for pattern in review_patterns:
                        review_match = re.search(pattern, line)
                        if review_match:
                            product_info['reviews'] = review_match.group(1)
                            break
                    
                    # 가격이 없어도 상품 정보 추가 (키워드 포함)
                    products.append(product_info)
                    current_rank += 1
                    
                    # 최대 20개까지만
                    if current_rank > 20:
                        break
            
            # 가격이 있는 상품 우선 정렬
            products_with_price = [p for p in products if p['price'] != 'N/A']
            products_without_price = [p for p in products if p['price'] == 'N/A']
            
            # 가격이 있는 상품을 먼저, 그 다음 가격이 없는 상품
            sorted_products = products_with_price + products_without_price
            
            print(f"Parsed {len(sorted_products)} products from OCR text")
            print(f"Products with price: {len(products_with_price)}")
            print(f"Products without price: {len(products_without_price)}")
            
            return sorted_products
            
        except Exception as e:
            print(f"Error parsing product info: {e}")
            return []
    
    def search_products(self, keyword):
        """상품 검색 (개선된 버전)"""
        print(f"\nSearching for: {keyword}")
        
        try:
            # 1. 앱 실행
            if not self.launch_coupang_app():
                return []
            
            # 2. 화면 정보 확인
            screen_info = self.get_screen_info()
            screen_width = 1080
            screen_height = 1920
            
            # 3. 스크린샷 촬영 (검색 전)
            before_screenshot = self.take_screenshot(f"before_search_{keyword}.png")
            if not before_screenshot:
                print("Failed to take before search screenshot")
                return []
            
            # 4. 검색창 찾기 및 클릭 (여러 위치 시도)
            search_positions = [
                (screen_width // 2, 200),   # 상단 중앙
                (screen_width // 2, 150),   # 더 위쪽
                (screen_width // 2, 250),   # 더 아래쪽
                (screen_width // 2, 300),   # 더 아래쪽
            ]
            
            search_clicked = False
            for x, y in search_positions:
                print(f"Trying search position: ({x}, {y})")
                self.tap_screen(x, y)
                time.sleep(2)
                
                # 검색창이 활성화되었는지 확인
                current_activity = self.get_current_activity()
                if current_activity and "search" in current_activity.lower():
                    print("Search box activated")
                    search_clicked = True
                    break
            
            if not search_clicked:
                print("Search box not found, trying default position")
                self.tap_screen(screen_width // 2, 200)
                time.sleep(2)
            
            # 5. 검색어 입력
            print("Entering search keyword...")
            self.input_text(keyword)
            time.sleep(2)
            
            # 6. 검색 실행 (엔터키)
            print("Executing search...")
            success, stdout, stderr = self.run_adb_command("shell input keyevent KEYCODE_ENTER")
            time.sleep(3)
            
            # 7. 검색 결과 페이지 대기
            print("Waiting for search results...")
            time.sleep(8)  # 더 긴 대기 시간
            
            # 8. 스크린샷 촬영 (검색 후)
            after_screenshot = self.take_screenshot(f"after_search_{keyword}.png")
            if not after_screenshot:
                print("Failed to take after search screenshot")
                return []
            
            # 9. 검색 결과 스크롤하여 더 많은 상품 로드
            print("Scrolling to load more products...")
            for i in range(5):  # 더 많은 스크롤
                self.swipe_screen(screen_width//2, screen_height*0.8, screen_width//2, screen_height*0.2, 800)
                time.sleep(3)  # 더 긴 대기 시간
            
            # 10. 최종 스크린샷
            final_screenshot = self.take_screenshot(f"final_search_{keyword}.png")
            if not final_screenshot:
                print("Failed to take final screenshot")
                return []
            
            # 11. 현재 액티비티 확인
            self.get_current_activity()
            
            # 12. 상품 정보 추출 (OCR 사용)
            products = self.extract_products_from_screenshot(final_screenshot, keyword)
            
            return products
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def check_rank(self, keyword):
        """순위 체크 실행 (개선된 에러 처리)"""
        print(f"\nRank check started: {keyword}")
        
        try:
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
            print("-" * 100)
            print(f"{'Rank':<4} {'Product ID':<12} {'Title':<40} {'Price':<10} {'Reviews':<8} {'Confidence':<10}")
            print("-" * 100)
            
            for product in products:
                title = product['title'][:37] + "..." if len(product['title']) > 40 else product['title']
                confidence = f"{product.get('confidence', 0.0):.2f}"
                print(f"{product['rank']:<4} {product['product_id']:<12} {title:<40} {product['price']:<10} {product['reviews']:<8} {confidence:<10}")
            
            return products
            
        except Exception as e:
            print(f"Error in rank check: {e}")
            return None
    
    def save_rank_data(self, keyword, products, filename=None):
        """순위 데이터 저장"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"enhanced_rank_data_{keyword}_{timestamp}.json"
        
        data = {
            'keyword': keyword,
            'timestamp': datetime.now().isoformat(),
            'total_products': len(products),
            'products': products,
            'device_id': self.device_id,
            'coupang_package': self.coupang_package,
            'method': 'ADB_OCR'
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
        print("Enhanced ADB rank checker closed")

def main():
    """메인 실행 함수"""
    print("Enhanced ADB Coupang Rank Checker System (with OCR)")
    print("=" * 70)
    
    checker = EnhancedADBCoupangRankChecker()
    
    try:
        # 테스트 키워드들
        test_keywords = [
            "트롤리"
        ]
        
        for keyword in test_keywords:
            try:
                # 순위 체크
                products = checker.check_rank(keyword)
                
                if products:
                    # 데이터 저장
                    checker.save_rank_data(keyword, products)
                
                print("\n" + "="*70)
                time.sleep(5)  # 키워드 간 대기
                
            except Exception as e:
                print(f"Error searching {keyword}: {e}")
                continue
        
        print("Enhanced ADB rank check completed!")
        
    finally:
        # 정리 작업
        checker.close()

if __name__ == "__main__":
    main()
