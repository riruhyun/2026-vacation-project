/**
 * 닉네임 규칙입니다. 회원가입과 프로필 수정이 같은 규칙을 씁니다.
 * Supabase에 의존하지 않으므로 어디서든 불러 쓸 수 있습니다.
 */

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

export const NICKNAME_TAKEN_MESSAGE = "이미 사용 중인 닉네임이에요.";

/** 앞뒤 공백을 없애고 사이의 연속 공백은 하나로 줄입니다. 공백만 다른 사칭을 막기 위해서입니다. */
export function normalizeNickname(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

/** 문제가 없으면 null, 있으면 그대로 보여줄 수 있는 메시지를 돌려줍니다. */
export function nicknameError(nickname: string) {
  if (!nickname) return "닉네임을 입력해 주세요.";
  if (nickname.length < NICKNAME_MIN_LENGTH) {
    return `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return `닉네임은 ${NICKNAME_MAX_LENGTH}자 이하여야 합니다.`;
  }
  // 줄바꿈 같은 제어 문자는 화면을 망가뜨리므로 막습니다.
  const hasControlCharacter = [...nickname].some((char) => {
    const code = char.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
  if (hasControlCharacter) return "닉네임에 사용할 수 없는 문자가 있습니다.";
  return null;
}
