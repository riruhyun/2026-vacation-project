"use client";

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
    <div className="flex min-h-dvh flex-col bg-[var(--color-bg)] px-6 pb-7 pt-[76px]">
      <section className="mb-11">
        <h1 className="m-0 text-[28px] font-bold leading-[1.18] tracking-[-0.03em] text-[var(--color-deep)]">
          기록을 안전하게
          <br />
          보관해요
        </h1>
        <p className="mt-[10px] text-sm font-normal leading-[1.5] text-[var(--color-sub)]">
          로그인하면 휴대폰을 바꿔도 도감과 레벨이 유지됩니다.
        </p>
      </section>

      <section className="flex flex-col gap-3.5">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일 주소"
          autoComplete="email"
          className="h-14 w-full rounded-[18px] border border-[#D9E0D8] bg-[var(--color-white)] px-[18px] text-sm font-normal text-[var(--color-text)] outline-none placeholder:text-sm placeholder:font-normal placeholder:text-[var(--color-sub)]"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
          autoComplete="current-password"
          className="h-14 w-full rounded-[18px] border border-[#D9E0D8] bg-[var(--color-white)] px-[18px] text-sm font-normal text-[var(--color-text)] outline-none placeholder:text-sm placeholder:font-normal placeholder:text-[var(--color-sub)]"
        />

        <button
          type="button"
          onClick={onSubmit}
          className="h-[54px] w-full rounded-[18px] border-none bg-[var(--color-primary)] text-base font-bold text-[var(--color-white)]"
        >
          이메일로 로그인
        </button>
      </section>

      <div className="my-[34px] flex items-center gap-3 text-xs text-[var(--color-sub)]">
        <span className="h-px flex-1 bg-[#D9E0D8]" />
        <span>또는</span>
        <span className="h-px flex-1 bg-[#D9E0D8]" />
      </div>

      <button
        type="button"
        className="h-[54px] w-full rounded-[18px] border border-[#D9E0D8] bg-[var(--color-white)] text-base font-bold text-[var(--color-primary)]"
      >
        Google로 계속하기
      </button>

      <p className="mt-7 text-center text-sm font-normal text-[var(--color-primary)]">
        아직 계정이 없나요?{" "}
        <span className="font-normal text-[var(--color-primary)]">회원가입</span>
      </p>

      <div className="mt-auto rounded-[20px] bg-[#EEF3EA] px-[18px] py-5">
        <p className="m-0 text-sm leading-[1.6] text-[var(--color-sub)]">
          사진과 관찰 기록은 본인 계정에 저장되며,
          <br />
          위치 정보는 사용자의 동의 없이 수집하지 않습니다.
        </p>
      </div>
    </div>
  );
}
