# 애드팡팡 (AddPangPang) - 모든 페이지 링크

기본 URL: http://localhost:3000

---

## 🏠 메인 & 인증

- **홈** - http://localhost:3000/
- **로그인** - http://localhost:3000/login
- **회원가입** - http://localhost:3000/signup

---

## 📊 대시보드

- **대시보드** - http://localhost:3000/dashboard

---

## 👥 고객 관리

- **고객 관리** - http://localhost:3000/customer

---

## 🎰 슬롯 관리

### 슬롯 추가

- **슬롯 추가 (메인)** - http://localhost:3000/slot-add
- **슬롯 추가 폼** - http://localhost:3000/slot-add-forms

### 슬롯 상태 및 관리

- **슬롯 현황** - http://localhost:3000/slot-status
- **슬롯 관리** - http://localhost:3000/slot-management

---

## 🛍️ 쿠팡 관련 작업

### 쿠팡 앱

- **쿠팡 앱 메인** - http://localhost:3000/coupangapp
- **쿠팡 앱 추가** - http://localhost:3000/coupangapp/add
- **쿠팡 앱 편집** - http://localhost:3000/coupangapp/edit/[id]

### 쿠팡순위체크

- **쿠팡순위체크** - http://localhost:3000/coupangapp/copangrank

### 쿠팡 VIP

- **쿠팡 VIP** - http://localhost:3000/coupangapp/vip

### 쿠팡 앱 (다른 경로)

- **쿠팡 앱** - http://localhost:3000/coupang-app

---

## 🌐 네이버 관련 작업

- **네이버쇼핑** - http://localhost:3000/coupangapp/naver
- **N쇼핑순위체크** - http://localhost:3000/coupangapp/naverrank

---

## 📍 플레이스 관련 작업

- **플레이스** - http://localhost:3000/coupangapp/place
- **N플레이스순위체크** - http://localhost:3000/coupangapp/placerank

---

## 🏠 오늘의집

- **오늘의집** - http://localhost:3000/coupangapp/todayhome

---

## 🌍 알리익스프레스

- **알리익스프레′** - http://localhost:3000/coupangapp/aliexpress

---

## 📢 공지사항

- **공지사항 목록** - http://localhost:3000/notices
- **공지사항 작성** - http://localhost:3000/notices/write
- **공지사항 상세** - http://localhost:3000/notices/[id]
- **공지사항 편집** - http://localhost:3000/notices/edit/[id]

---

## 💰 정산 관리

### 정산 메인

- **정산 관리** - http://localhost:3000/settlement-management
- **정산** - http://localhost:3000/settlement

### 정산 상세

- **정산 상세** - http://localhost:3000/settlement/detail/[id]
- **정산 편집** - http://localhost:3000/settlement/edit
- **정산 요청** - http://localhost:3000/settlement/request
  свет **정산 현황** - http://localhost:3000/settlement/status
- **정산 이력** - http://localhost:3000/settlement/history
- **미정산** - http://localhost:3000/settlement/unsettled

### 정산 상태별 페이지

- **정산 완료** - http://localhost:3000/settlement-completed
- **정산 대기** - http://localhost:3000/settlement-pending
- **정산 요청** - http://localhost:3000/settlement-request

---

## 🔍 순위 추적

- **순위 현황** - http://localhost:3000/ranking-status

---

## 📈 트래픽 관리

- **트래픽 현황** - http://localhost:3000/traffic-status

---

## 👤 유통업체 관리

- **유통업체 추가** - http://localhost:3000/distributor-add
- **유통업체 추가 폼** - http://localhost:3000/distributor-add/add
- **유통업체 편집** - http://localhost:3000/distributor-add/edit/[id]

---

## 👨‍💼 관리자

- **관리자 - 고객 관리** - http://localhost:3000/admin/customers
- **관리자 - 슬롯 관리** - http://localhost:3000/admin/slots

---

## 🐛 디버그 & 테스트

- **Supabase 테스트** - http://localhost:3000/supabase-test
- **디버그 - 슬롯** - http://localhost:3000/debug/slots

---

## 🔗 API 엔드포인트

### 인증 API

- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/check-remembered` - 자동로그인 확인

### 고객 API

- `GET /api/customers` - 고객 목록
- `GET /api/customers/[id]` - 고객 상세
- `GET /api/customer-slots/[customerId]` - 고객 슬롯 조회

### 슬롯 API

- `GET /api/slots` - 슬롯 목록
- `GET /api/slots/[slotId]` - 슬롯 상세
- `POST /api/slots/extend` - 슬롯 연장
- `GET /api/slot-status` - 슬롯 상태 조회
- `POST /api/slot-status` - 슬롯 상태 추가
- `GET /api/slot-status/[id]` - 슬롯 상태 상세
- `DELETE /api/slot-status` - 모든 슬롯 상태 삭제
- `GET /api/slot-management` - 슬롯 관리 데이터

### 슬롯 타입별 API

- `GET /api/slot-coupangapp` - 쿠팡앱 슬롯
- `POST /api/slot-coupangapp` - 쿠팡앱 슬롯 추가
- `GET /api/slot-coupangapp/[id]` - 쿠팡앱 슬롯 상세
- `DELETE /api/slot-coupangapp/[id]` - 쿠팡앱 슬롯 삭제

- `GET /api/slot-copangrank` - 쿠팡순위체크 슬롯
- `POST /api/slot-copangrank` - 쿠팡순위체크 추가
- `GET /api/slot-copangrank/[id]` - 쿠팡순위체크 상세
- `DELETE /api/slot-copangrank/[id]` - 쿠팡순위체크 삭제

- `GET /api/slot-naver` - 네이버쇼핑 슬롯
- `POST /api/slot-naver` - 네이버쇼핑 추가
- `GET /api/slot-naver/[id]` - 네이버쇼핑 상세
- `DELETE /api/slot-naver/[id]` - 네이버쇼핑 삭제

- `GET /api/slot-naverrank` - N쇼핑순위체크 슬롯
- `POST /api/slot-naverrank` - N쇼핑순위체크 추가
- `GET /api/slot-naverrank/[id]` - N쇼핑순위체크 상세
- `DELETE /api/slot-naverrank/[id]` - N쇼핑순위체크 삭제

- `GET /api/slot-place` - 플레이스 슬롯
- `POST /api/slot-place` - 플레이스 추가
- `GET /api/slot-place/[id]` - 플레이스 상세
- `DELETE /api/slot-place/[id]` - 플레이스 삭제

- `GET /api/slot-placerank` - N플레이스순위체크 슬롯
- `POST /api/slot-placerank` - N플레이스순위체크 추가
- `GET /api/slot-placerank/[id]` - N플레이스순위체크 상세
- `DELETE /api/slot-placerank/[id]` - N플레이스순위체크 삭제

- `GET /api/slot-todayhome` - 오늘의집 슬롯
- `POST /api/slot-todayhome` - 오늘의집 추가
- `GET /api/slot-todayhome/[id]` - 오늘의집 상세
- `DELETE /api/slot-todayhome/[id]` - 오늘의집 삭제

- `GET /api/slot-aliexpress` - 알리익스프레스 슬롯
- `POST /api/slot-aliexpress` - 알리익스프레스 추가
- `GET /api/slot-aliexpress/[id]` - 알리익스프레스 상세
- `DELETE /api/slot-aliexpress/[id]` - 알리익스프레스 삭제

- `GET /api/slot-coupangvip` - 쿠팡VIP 슬롯
- `POST /api/slot-coupangvip` - 쿠팡VIP 추가
- `GET /api/slot-coupangvip/[id]` - 쿠팡VIP 상세
- `DELETE /api/slot-coupangvip/[id]` - 쿠팡VIP 삭제

### 정산 API

- `GET /api/settlement` - 정산 목록
- `POST /api/settlement` - 정산 생성
- `GET /api/settlement-history[edit]` - 정산 이력
- `GET /api/settlement-requests` - 정산 요청 목록
- `POST /api/settlement-requests` - 정산 요청 생성
- `POST /api/settlement-requests/complete` - 정산 요청 완료
- `GET /api/settlement-requests/edit/[id]` - 정산 요청 편집
- `GET /api/settlements` - 정산 데이터 조회
- `POST /api/settlements/create` - 정산 생성
- `POST /api/settlements/modify` - 정산 수정
- `GET /api/settlements/setup` - 정산 설정
- `GET /api/settlements/unsettled` - 미정산 조회
- `POST /api/settlements/update-deposit` - 입금 업데이트
- `POST /api/settlements/update-extension` - 연장 업데이트
- `GET /api/settlements/[id]` - 정산 상세

### 키워드 API

- `GET /api/keywords` - 키워드 목록
- `GET /api/keywords/[id]` - 키워드 상세

### 순위 API

- `GET /api/rank-history` - 순위 이력
- `POST /api/rank-update` - 순위 업데이트

### 트래픽 API

- `GET /api/traffic` - 트래픽 데이터
- `GET /api/traffic-counter` - 트래픽 카운터
- `GET /api/traffic-scheduler` - 트래픽 스케줄러

### 공지사항 API

- `GET /api/notices` - 공지사항 목록
- `POST /api/notices` - 공지사항 작성
- `GET /api/notices/[id]` - 공지사항 상세

### 유통업체 API

- `GET /api/distributors` - 유통업체 목록

### 사용자 API

- `GET /api/users` - 사용자 목록
- `GET /api/users/[id]` - 사용자 상세
- `POST /api/users/[id]/status` - 사용자 상태 변경
- `POST /api/users/excel-import` - 사용자 엑셀 임포트

### 슬롯 추가 폼 API

- `GET /api/slot-add-forms` - 슬롯 추가 폼 데이터
- `GET /api/pending-slots` - 대기 슬롯

### 디버그 API

- `GET /api/debug/slots` - 디버그 슬롯
- `POST /api/debug/fix-slots` - 슬롯 수정

### 테스트 API

- `GET /api/test` - 테스트
- `GET /api/test-slots` - 테스트 슬롯

### 스케줄러 API

- `POST /api/start-scheduler` - 스케줄러 시작

---

## 📱 총 페이지 수

**메인 페이지**: 47개
**API 엔드포인트**: 69개

---

## 🔑 주요 기능별 페이지

### 1. 쇼핑몰 플랫폼별 슬롯 관리 (10개)

- 쿠팡앱, 쿠팡순위체크, 쿠팡VIP, 네이버쇼핑, N쇼핑순위체크, 플레이스, N플레이스순위체크, 오늘의집, 알리익스프레스

### 2. 정산 관리 (10개)

- 정산 현황, 이력, 요청, 완료, 대기, 편집 등

### 3. 슬롯 관리 (7개)

- 슬롯 추가, 현황, 관리, 추가 폼 등

### 4. 고객 및 유통업체 관리 (4개)

- 고객 관리, 유통업체 추가/편집

### 5. 순위 및 트래픽 (2개)

- 순위 현황, 트래픽 현황

### 6. 공지사항 (4개)

- 목록, 작성, 상세, 편집

### 7. 관리자 (2개)

- 고객 관리, 슬롯 관리

### 8. 기타 (8개)

- 로그인, 회원가입, 대시보드, Supabase 테스트 등
