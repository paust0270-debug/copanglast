# Users 테이블 설정 가이드

Customer 페이지가 정상적으로 작동하려면 Supabase에 `users` 테이블을 생성해야 합니다.

## 1. Supabase 프로젝트 접속

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. 프로젝트 `cwsdvgkjptuvbdtxcejt` 선택

## 2. SQL Editor에서 스키마 실행

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭
3. `users-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭

## 3. 테이블 생성 확인

1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. `users` 테이블이 생성되었는지 확인
3. 샘플 데이터가 삽입되었는지 확인

## 4. 테스트

1. `http://localhost:3000/customer` 접속
2. 고객 목록이 표시되는지 확인
3. `http://localhost:3000/signup`에서 회원가입 테스트
4. 가입 후 customer 페이지에 새 사용자가 표시되는지 확인

## 문제 해결

### 테이블이 생성되지 않는 경우
- SQL Editor에서 오류 메시지 확인
- RLS 정책이 이미 존재하는 경우 정책 생성 부분 제거 후 재실행

### 데이터가 표시되지 않는 경우
- 브라우저 개발자 도구에서 네트워크 탭 확인
- `/api/users` API 응답 확인
- Supabase 로그에서 오류 확인

## 스키마 구조

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  memo TEXT,
  grade TEXT DEFAULT '일반회원',
  distributor TEXT DEFAULT '일반',
  status TEXT DEFAULT 'pending',
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  processor TEXT
);
```
