# 애드팡팡 (AddPangPang) - 완전 백업

> **백업 일시**: 2025-10-17T09:43:34-820Z  
> **백업 저장소**: https://github.com/paust0270-debug/backup  
> **원본 저장소**: https://github.com/paust0270-debug/copanglast

## 🎯 백업 내용

이 저장소는 애드팡팡 프로젝트의 **완전한 백업**입니다.

### 📦 포함된 내용

1. **전체 소스코드**
   - Next.js 애플리케이션 (Frontend & Backend)
   - API 라우트
   - UI 컴포넌트
   - 설정 파일

2. **데이터베이스 백업** ✅
   - **총 1,532개 레코드**
   - **19개 테이블 전체 백업**
   - JSON 형식으로 저장
   - 완벽한 복원 가능

3. **백업/복원 도구**
   - `backup-database.js`: 데이터베이스 백업 스크립트
   - `restore-database.js`: 데이터베이스 복원 스크립트
   - 자동화된 백업/복원 프로세스

## 📊 데이터베이스 백업 상세

### 백업된 테이블 (19개)

| 테이블명            | 레코드 수 | 설명                   |
| ------------------- | --------- | ---------------------- |
| user_profiles       | 14        | 사용자 프로필          |
| slots               | 78        | 슬롯 기본 정보         |
| slot_status         | 390       | 쿠팡 슬롯 상태         |
| slot_coupangvip     | 20        | 쿠팡VIP 슬롯           |
| slot_coupangapp     | 10        | 쿠팡APP 슬롯           |
| slot_naver          | 10        | 네이버쇼핑 슬롯        |
| slot_place          | 30        | 플레이스 슬롯          |
| slot_todayhome      | 15        | 오늘의집 슬롯          |
| slot_aliexpress     | 10        | 알리 슬롯              |
| slot_copangrank     | 11        | 쿠팡순위체크 슬롯      |
| slot_naverrank      | 10        | N쇼핑순위체크 슬롯     |
| slot_placerank      | 1         | N플레이스순위체크 슬롯 |
| settlements         | 153       | 정산 정보              |
| settlement_history  | 12        | 정산 이력              |
| settlement_requests | 0         | 정산 요청              |
| notices             | 10        | 공지사항               |
| distributors        | 5         | 총판 정보              |
| traffic             | 630       | 트래픽 데이터          |
| keywords            | 123       | 키워드 관리            |
| **총계**            | **1,532** |                        |

### 백업 위치

```
database-backup-2025-10-17T09-43-34-820Z/
├── _metadata.json              # 백업 메타데이터
├── user_profiles.json          # 사용자 데이터
├── slots.json                  # 슬롯 데이터
├── slot_status.json            # 슬롯 상태 데이터
├── slot_coupangvip.json
├── slot_coupangapp.json
├── slot_naver.json
├── slot_place.json
├── slot_todayhome.json
├── slot_aliexpress.json
├── slot_copangrank.json
├── slot_naverrank.json
├── slot_placerank.json
├── settlements.json            # 정산 데이터
├── settlement_history.json
├── settlement_requests.json
├── notices.json                # 공지사항
├── distributors.json           # 총판 정보
├── traffic.json                # 트래픽 데이터
└── keywords.json               # 키워드 데이터
```

## 🔄 복원 방법

### 1. 데이터베이스 복원

```bash
# 1. 저장소 클론
git clone https://github.com/paust0270-debug/backup.git
cd backup

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env.local 파일 생성 후 Supabase 정보 입력
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. 데이터베이스 복원 실행
node restore-database.js
```

### 2. 복원 프로세스

1. 스크립트 실행 시 사용 가능한 백업 목록 표시
2. 복원할 백업 선택
3. 각 테이블별로 복원 진행
4. 기존 데이터 삭제 여부 선택 가능
5. 자동으로 배치 처리 (100개씩)

### 3. 주의사항

⚠️ **복원 시 주의사항**:

- 기존 데이터를 삭제하면 복구할 수 없습니다
- 복원 전 현재 데이터베이스를 백업하세요
- Supabase 환경 변수가 올바르게 설정되어 있어야 합니다
- 네트워크 연결이 안정적이어야 합니다

## 📝 백업 스크립트 사용법

### 새로운 백업 생성

```bash
node backup-database.js
```

자동으로:

- 모든 테이블 데이터를 조회
- JSON 파일로 저장
- 백업 메타데이터 생성
- 타임스탬프 기반 디렉토리 생성

### 백업 주기

권장 백업 주기:

- **일일 백업**: 중요한 데이터 변경 시
- **주간 백업**: 정기적인 백업
- **배포 전 백업**: 필수!

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Backup Format**: JSON
- **Version Control**: Git

## 🔐 보안

- ✅ `.env.local` 파일은 백업에 포함되지 않음
- ✅ 민감한 API 키는 별도 관리 필요
- ✅ 백업 파일은 안전한 장소에 보관
- ✅ 정기적인 백업 검증 권장

## 📞 복원 지원

복원 중 문제 발생 시:

1. **환경 변수 확인**: Supabase URL과 API 키가 올바른지 확인
2. **네트워크 확인**: 인터넷 연결 상태 확인
3. **Supabase 상태 확인**: Supabase 대시보드에서 프로젝트 상태 확인
4. **로그 확인**: 콘솔에 출력되는 오류 메시지 확인

## 📄 라이선스

MIT License

---

**⚠️ 중요**: 이 백업은 정기적으로 업데이트되지 않습니다. 최신 코드는 원본 저장소를 참조하세요.

**원본 저장소**: https://github.com/paust0270-debug/copanglast

**백업 날짜**: 2025년 10월 17일
