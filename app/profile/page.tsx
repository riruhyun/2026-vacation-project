import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold leading-tight text-primary">프로필</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          채집 기록과 도감 완성도를 확인하는 공간입니다.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">채집자</p>
        <p className="mt-1 text-xl font-bold text-foreground">선린 방학 프로젝트 1조</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-mint p-4">
            <p className="text-2xl font-bold text-primary">3</p>
            <p className="mt-1 text-xs text-muted">예시 식물</p>
          </div>
          <div className="rounded-xl bg-mint p-4">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="mt-1 text-xs text-muted">내 채집 기록</p>
          </div>
        </div>
      </section>

      <Link
        href="/collection"
        className="mt-auto flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-light"
      >
        도감 보기
      </Link>
    </main>
  );
}
