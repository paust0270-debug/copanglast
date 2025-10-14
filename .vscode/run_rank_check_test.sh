#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 이모지와 색상으로 포맷된 메시지 출력
print_header() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "🎯 쿠팡 순위체크 테스트 실행"
    echo "========================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}📦 $1${NC}"
}

print_start() {
    echo -e "${BLUE}🚀 $1${NC}"
}

# 메인 함수
main() {
    print_header
    
    print_info "의존성 확인 중..."
    if [ ! -d "node_modules" ]; then
        print_info "npm install 실행 중..."
        if ! npm install; then
            print_error "npm install 실패"
            exit 1
        fi
        print_success "npm install 완료"
    else
        print_success "node_modules 확인됨"
    fi
    
    print_info "Playwright 브라우저 확인 중..."
    if ! npx playwright install --silent; then
        print_error "Playwright 브라우저 설치 실패"
        exit 1
    fi
    print_success "Playwright 브라우저 확인됨"
    
    echo
    echo "🚀 테스트 실행 옵션을 선택하세요:"
    echo
    echo "1. 기본 실행 (백그라운드)"
    echo "2. 브라우저 창 보면서 실행"
    echo "3. 디버그 모드"
    echo "4. 종료"
    echo
    
    read -p "선택 (1-4): " choice
    
    case $choice in
        1)
            echo
            print_start "기본 모드로 테스트 실행 중..."
            npx playwright test rank_check_test_with_playwright.js
            ;;
        2)
            echo
            print_start "브라우저 창 보면서 모드로 테스트 실행 중..."
            npx playwright test rank_check_test_with_playwright.js --headed
            ;;
        3)
            echo
            print_start "디버그 모드로 테스트 실행 중..."
            echo "💡 브라우저 창에서 수동으로 단계를 진행할 수 있습니다."
            npx playwright test rank_check_test_with_playwright.js --debug
            ;;
        4)
            echo "👋 테스트를 종료합니다."
            exit 0
            ;;
        *)
            print_error "잘못된 선택입니다."
            exit 1
            ;;
    esac
    
    echo
    print_success "테스트 완료!"
    echo "📊 결과는 test-results 폴더에서 확인할 수 있습니다."
    echo
}

# 스크립트 직접 실행 확인 및 메인 함수 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
