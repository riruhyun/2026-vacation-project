import { describe, expect, it } from "vitest";
import {
  NICKNAME_MAX_LENGTH,
  nicknameError,
  normalizeNickname,
} from "@/lib/nickname";

describe("normalizeNickname", () => {
  it("앞뒤 공백을 없앤다", () => {
    expect(normalizeNickname("  초록탐험가  ")).toBe("초록탐험가");
  });

  it("사이의 연속 공백을 하나로 줄여 공백만 다른 사칭을 막는다", () => {
    expect(normalizeNickname("초록  탐험가")).toBe("초록 탐험가");
    expect(normalizeNickname("초록\t탐험가")).toBe("초록 탐험가");
  });

  it("공백뿐인 입력은 빈 문자열이 된다", () => {
    expect(normalizeNickname("   ")).toBe("");
  });
});

describe("nicknameError", () => {
  it("올바른 닉네임은 통과한다", () => {
    expect(nicknameError("초록탐험가")).toBeNull();
    expect(nicknameError("ab")).toBeNull();
    expect(nicknameError("a".repeat(NICKNAME_MAX_LENGTH))).toBeNull();
  });

  it("비어 있으면 막는다", () => {
    expect(nicknameError("")).toBe("닉네임을 입력해 주세요.");
  });

  it("너무 짧거나 길면 막는다", () => {
    expect(nicknameError("가")).toContain("2자 이상");
    expect(nicknameError("a".repeat(NICKNAME_MAX_LENGTH + 1))).toContain(
      `${NICKNAME_MAX_LENGTH}자 이하`,
    );
  });

  it("제어 문자가 섞이면 막는다", () => {
    expect(nicknameError("초록\n탐험가")).toBe(
      "닉네임에 사용할 수 없는 문자가 있습니다.",
    );
  });
});
