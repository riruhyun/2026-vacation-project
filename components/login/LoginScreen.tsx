"use client";

import Button from "@/components/ui/Button";

const fieldClassName =
  "h-14 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[18px] text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]";

type LoginScreenProps = {
  nickname: string;
  setNickname: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: () => void;
  mode: "sign-in" | "sign-up";
  onToggleMode: () => void;
  errorMessage: string | null;
  isSubmitting: boolean;
};

export default function LoginScreen({
  nickname,
  setNickname,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  mode,
  onToggleMode,
  errorMessage,
  isSubmitting,
}: LoginScreenProps) {
  const isSignUp = mode === "sign-up";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-background)] px-6 pb-7 pt-[76px]">
      <section className="mb-11">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-[var(--color-primary-strong)]">
          기록을 안전하게
          <br />
          보관해요
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
          로그인하면 식물 도감과 관찰 기록을 이어서 볼 수 있어요.
        </p>
      </section>

      <section className="flex flex-col gap-3.5">
        {isSignUp ? (
          <>
            <label htmlFor="login-nickname" className="sr-only">닉네임</label>
            <input
              id="login-nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="닉네임"
              autoComplete="nickname"
              maxLength={16}
              className={fieldClassName}
            />
          </>
        ) : null}
        <label htmlFor="login-email" className="sr-only">이메일 주소</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일 주소"
          autoComplete="email"
          className={fieldClassName}
        />
        <label htmlFor="login-password" className="sr-only">비밀번호</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className={fieldClassName}
        />
        <Button type="button" variant="primary" fullWidth onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "처리 중..." : isSignUp ? "이메일로 회원가입" : "이메일로 로그인"}
        </Button>
        {errorMessage ? <p role="alert" className="text-sm text-red-700">{errorMessage}</p> : null}
      </section>

      <button
        type="button"
        onClick={onToggleMode}
        className="mt-7 text-center text-sm text-[var(--color-text-muted)]"
      >
        {isSignUp ? (
          <>
            계정이 이미 있으신가요?{" "}
            <span className="font-bold text-[var(--color-primary)]">로그인</span>
          </>
        ) : (
          <>
            계정이 없으신가요?{" "}
            <span className="font-bold text-[var(--color-primary)]">회원가입</span>
          </>
        )}
      </button>

      <div className="mt-auto rounded-[var(--radius-card)] bg-[var(--color-info-surface)] px-[18px] py-5">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          사진과 관찰 기록은 본인 계정에 저장되며, 위치 정보는 동의 없이 수집하지 않아요.
        </p>
      </div>
    </div>
  );
}
