# start_mitmproxy.py
import subprocess
import sys
import os
import time

def start_mitmproxy():
    """mitmproxy 시작"""
    print("🚀 mitmproxy 시작 중...")
    
    # 현재 IP 확인
    try:
        import requests
        response = requests.get('https://ipinfo.io/json', timeout=10)
        ip_info = response.json()
        print(f"📍 현재 IP: {ip_info.get('ip')} ({ip_info.get('org')})")
    except:
        print("⚠️ IP 확인 실패")
    
    # mitmproxy 명령어 구성
    cmd = [
        'mitmdump',
        '-s', 'api_capture.py',
        '--listen-host', '0.0.0.0',
        '--listen-port', '8080',
        '--set', 'confdir=~/.mitmproxy'
    ]
    
    print("📡 mitmproxy 설정:")
    print(f"  - 호스트: 0.0.0.0")
    print(f"  - 포트: 8080")
    print(f"  - 스크립트: api_capture.py")
    print()
    print("📱 휴대폰 설정 방법:")
    print("  1. 휴대폰에서 WiFi 설정")
    print("  2. 고급 > 프록시 > 수동")
    print("  3. 프록시 호스트: [PC의 IP 주소]")
    print("  4. 프록시 포트: 8080")
    print("  5. 쿠팡 앱에서 검색 및 순위 페이지 방문")
    print()
    print("⏹️  종료하려면 Ctrl+C를 누르세요")
    print("=" * 50)
    
    try:
        # mitmproxy 실행
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n🛑 mitmproxy 종료됨")
    except subprocess.CalledProcessError as e:
        print(f"❌ mitmproxy 실행 실패: {e}")
    except FileNotFoundError:
        print("❌ mitmproxy가 설치되지 않았습니다.")
        print("다음 명령어로 설치하세요: pip install mitmproxy")

if __name__ == "__main__":
    start_mitmproxy()