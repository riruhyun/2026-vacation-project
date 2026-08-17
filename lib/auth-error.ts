export function authErrorMessage(error: { message?: string }) {
  const original = error.message ?? "";
  // 서버가 이미 한국어로 이유를 알려준 경우(닉네임 중복 등)에는 그대로 보여줍니다.
  if (/[가-힣]/.test(original)) return original;

  const message = original.toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (message.includes("already registered")) {
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  }
  if (message.includes("unable to validate email address")) {
    return "올바른 이메일 형식으로 입력해 주세요.";
  }
  if (message.includes("at least 6 characters")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  return "인증 처리 중 문제가 발생했습니다. 다시 시도해 주세요.";
}
