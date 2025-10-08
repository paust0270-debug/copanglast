# 데이터베이스 백업 정보 - 2025년 10월 1일

## 백업 일시
- **백업 날짜**: 2025-10-01
- **백업 시각**: 한국 표준시(KST, UTC+9) 기준

## 백업 파일
- **파일명**: `database_backup_2025-10-01.json`
- **백업 스크립트**: `backup_database_20251001.js`

## 백업된 테이블 및 레코드 수

| 테이블명 | 레코드 수 | 설명 |
|---------|---------|------|
| `customers` | 0개 | 고객 정보 |
| `users` | 6개 | 사용자 계정 정보 |
| `user_profiles` | 9개 | 사용자 프로필 정보 |
| `slots` | 3개 | 슬롯 메인 정보 (KST 시간대, created_at + usage_days) |
| `slot_status` | 30개 | 슬롯 상태 정보 (개별 작업 등록 데이터) |
| `keywords` | 37개 | 키워드 관리 정보 |
| `notices` | 3개 | 공지사항 (is_important 필드 포함) |
| **총계** | **88개** | |

## 백업된 데이터베이스 주요 특징

### 1. 시간대 처리
- 모든 `created_at`, `updated_at` 필드는 **KST (UTC+9)** 기준으로 저장됨
- 밀리초(소수점) 제거: `YYYY-MM-DD HH:mm:ss` 형식

### 2. slots 테이블
- `created_at`: 슬롯 생성일 (KST)
- `updated_at`: 만료일 = `created_at + usage_days` (자동 계산)
- `usage_days`: 사용 일수

### 3. slot_status 테이블
- 개별 작업 등록 정보 저장
- `/coupangapp/add` 페이지에서 사용
- `slots` 테이블의 `created_at`을 기준으로 잔여기간 계산

### 4. notices 테이블
- `is_important`: 중요 공지사항 여부 (Boolean)
- 기존 `author`, `target` 필드 제거됨

## 백업 복원 방법

### 1. 백업 파일 확인
```bash
ls -la database_backup_2025-10-01.json
```

### 2. 복원 스크립트 작성 (필요시)
```javascript
const fs = require('fs');
const backupData = JSON.parse(fs.readFileSync('database_backup_2025-10-01.json', 'utf8'));

// 각 테이블별로 데이터 복원
Object.entries(backupData.tables).forEach(async ([tableName, records]) => {
  console.log(`복원 중: ${tableName} (${records.length}개 레코드)`);
  // Supabase insert 로직 추가
});
```

## GitHub 저장소
- **브랜치**: `20251001`
- **URL**: https://github.com/paust0270-debug/crawling-project-backup-20250925/tree/20251001

## 주요 개선 사항 (이번 백업 시점 기준)

### ✅ 완료된 작업
1. **잔여기간/등록일·만료일 일치**
   - `/slot-status` 페이지와 `/coupangapp/add` 페이지의 데이터 일치
   - `slots` 테이블 기준으로 통일

2. **KST 시간대 적용**
   - 모든 API 엔드포인트에서 KST 시간대 사용
   - 밀리초 제거

3. **Supabase 자동 updated_at 갱신 문제 해결**
   - API 레벨에서 명시적으로 `expiry_date` 계산
   - 디버깅 로그 추가 및 제거

4. **공지사항 테이블 스키마 변경**
   - `author` → `is_important` 필드로 변경
   - React key prop 오류 수정

5. **데이터 일관성 개선**
   - `slots` 테이블과 `slot_status` 테이블 매핑 로직 완성
   - 잔여기간 계산 로직 통일

## 백업 자동화 (향후 계획)
- 주기적 백업 스케줄링 (예: cron)
- 백업 파일 암호화
- 원격 저장소(S3, Google Drive 등) 연동

## 문의 및 복원 지원
- 백업 복원이 필요한 경우 이 문서를 참고하여 진행
- 문제 발생 시 GitHub 이슈 또는 개발팀에 문의


