# 📋 Supabase 마이그레이션 실행 가이드

## 🚀 마이그레이션 실행 방법

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 해당 프로젝트 선택

### 2. SQL Editor 접속
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

### 3. 마이그레이션 스크립트 실행
1. `supabase-migration-complete.sql` 파일의 내용을 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭

### 4. 실행 결과 확인
마이그레이션이 성공적으로 완료되면 다음 결과가 표시됩니다:
- `Migration completed successfully` 메시지
- 정산 ID 5의 데이터
- 정산 ID 5에 대한 settlement_items 데이터

## 📊 마이그레이션 내용

### 추가되는 필드 (settlements 테이블)
- `original_settlement_id`: 원본 정산 ID (버전 관리용)
- `version`: 정산 버전 번호
- `is_latest`: 최신 버전 여부
- `included_slot_ids`: 포함된 슬롯 ID 배열

### 새로 생성되는 테이블
- `settlement_items`: 정산 아이템 상세 정보

### 생성되는 인덱스
- `idx_settlements_original_id`
- `idx_settlements_version`
- `idx_settlements_is_latest`
- `idx_settlements_included_slots`
- `idx_settlement_items_settlement_id`
- `idx_settlement_items_slot_id`

## ✅ 마이그레이션 완료 후

1. **개발 서버 재시작**
   ```bash
   npm run dev
   ```

2. **정산 수정 페이지 확인**
   - 정산 ID 5의 데이터가 올바르게 표시되는지 확인
   - 새로운 필드들이 정상적으로 작동하는지 확인

## 🔧 문제 해결

### 마이그레이션 실패 시
1. SQL Editor에서 각 섹션별로 개별 실행
2. 오류 메시지 확인 후 수정
3. 필요한 경우 기존 데이터 백업

### 데이터 확인
```sql
-- settlements 테이블 확인
SELECT * FROM settlements WHERE id = 5;

-- settlement_items 테이블 확인
SELECT * FROM settlement_items WHERE settlement_id = 5;

-- 새로운 필드 확인
SELECT id, version, is_latest, original_settlement_id FROM settlements WHERE id = 5;
```

## 📝 참고사항

- 이 마이그레이션은 기존 데이터와 호환되도록 설계되었습니다
- 정산 ID 5에 대한 기본 settlement_items가 자동으로 생성됩니다
- 모든 기존 정산 데이터는 version 1, is_latest = true로 설정됩니다
