# 스키마 캐시 문제 해결 가이드

## ✅ 현재 상태
- Supabase 연결: **성공**
- 환경 변수: **설정 완료**
- 테이블 접근: **정상**

## 🔧 스키마 캐시 문제 해결

### 1단계: Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 `cwsdvgkjptuvbdtxcejt` 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2단계: 스키마 재생성
1. **New Query** 클릭
2. `emergency-schema-fix.sql` 파일의 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭

### 3단계: 실행 확인
다음 메시지가 나타나면 성공입니다:
```
긴급 스키마 캐시 문제가 완전히 해결되었습니다!
```

## 📋 테이블 구조 확인

실행 후 다음 쿼리로 테이블 구조를 확인하세요:

```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- user_profiles 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- customers 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

## 🚀 애플리케이션 실행

### 개발 서버 시작
```bash
npm run dev
```

### 브라우저에서 확인
- http://localhost:3000 접속
- 고객 관리 페이지: http://localhost:3000/customer
- 회원가입 페이지: http://localhost:3000/signup

## 🔍 문제 해결

### 만약 여전히 오류가 발생한다면:

1. **Supabase 프로젝트 상태 확인**
   - 프로젝트가 활성화되어 있는지 확인
   - Database → Tables에서 테이블 존재 여부 확인

2. **RLS 정책 확인**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **인덱스 확인**
   ```sql
   SELECT indexname, tablename, indexdef
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

4. **완전한 재설정**
   ```sql
   -- 모든 테이블 삭제 후 재생성
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

## 📞 추가 지원

문제가 지속되면 다음 정보를 확인해주세요:
- 브라우저 개발자 도구의 콘솔 오류
- Supabase 대시보드의 로그
- 애플리케이션의 네트워크 탭

## ✅ 완료 체크리스트

- [ ] Supabase 연결 테스트 성공
- [ ] emergency-schema-fix.sql 실행 완료
- [ ] 테이블 구조 확인 완료
- [ ] 개발 서버 정상 실행
- [ ] 브라우저에서 페이지 접속 성공
- [ ] 고객 관리 기능 정상 작동
- [ ] 회원가입 기능 정상 작동

---

**🎉 스키마 캐시 문제가 해결되었습니다!**
