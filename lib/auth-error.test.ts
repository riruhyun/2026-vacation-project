import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth-error";

describe("authErrorMessage", () => {
  it("explains invalid email format errors returned by Supabase", () => {
    expect(
      authErrorMessage({
        message: "Unable to validate email address: invalid format",
      }),
    ).toBe("올바른 이메일 형식으로 입력해 주세요.");
  });
});
