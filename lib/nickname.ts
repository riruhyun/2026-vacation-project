export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

export const NICKNAME_TAKEN_MESSAGE = "이미 사용 중인 닉네임이에요.";

export function normalizeNickname(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function nicknameError(nickname: string) {
  if (!nickname) return "닉네임을 입력해 주세요.";
  if (nickname.length < NICKNAME_MIN_LENGTH) {
    return `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return `닉네임은 ${NICKNAME_MAX_LENGTH}자 이하여야 합니다.`;
  }
  const hasControlCharacter = [...nickname].some((char) => {
    const code = char.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
  if (hasControlCharacter) return "닉네임에 사용할 수 없는 문자가 있습니다.";
  return null;
}
