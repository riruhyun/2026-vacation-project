import Link from "next/link";

const SETTINGS = ["카메라 촬영 안내", "AI 식별 결과 저장", "위치 기록 사용"];

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold leading-tight text-primary">설정</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          앱에서 사용할 기능을 확인합니다.
        </p>
      </header>

      <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {SETTINGS.map((setting) => (
          <div key={setting} className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-medium text-foreground">{setting}</span>
            <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-primary">
              준비 중
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="mt-auto block w-full py-3 text-center text-sm font-medium text-primary transition-colors hover:text-primary-light"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
