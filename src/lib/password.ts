// 비밀번호 해시 함수 (실제 프로덕션에서는 bcrypt 등 사용)
export function hashPassword(password: string): string {
  // 실제로는 bcrypt나 다른 보안 해시 함수를 사용해야 합니다
  // 여기서는 예시용으로 base64 인코딩을 사용합니다
  return Buffer.from(password).toString('base64');
}
