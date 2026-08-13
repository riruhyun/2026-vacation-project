"use client";

import Button from "@/components/ui/Button";

type LoginScreenProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: () => void;
};

export default function LoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
}: LoginScreenProps) {
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
        <label htmlFor="login-email" className="sr-only">이메일 주소</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일 주소"
          autoComplete="email"
          className="h-14 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[18px] text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
        />
        <label htmlFor="login-password" className="sr-only">비밀번호</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
          autoComplete="current-password"
          className="h-14 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[18px] text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
        />
        <Button type="button" variant="primary" fullWidth onClick={onSubmit}>
          이메일로 로그인
        </Button>
      </section>

      <div className="my-[34px] flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span>또는</span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <Button type="button" variant="secondary" fullWidth disabled aria-disabled="true">
        Google로 계속하기 · 준비 중
      </Button>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className="mt-7 text-center text-sm text-[var(--color-text-muted)] disabled:cursor-not-allowed"
      >
        회원가입 · 준비 중
      </button>

      <div className="mt-auto rounded-[var(--radius-card)] bg-[var(--color-info-surface)] px-[18px] py-5">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          사진과 관찰 기록은 본인 계정에 저장되며, 위치 정보는 동의 없이 수집하지 않아요.
        </p>
      </div>
    </div>
  );
}
