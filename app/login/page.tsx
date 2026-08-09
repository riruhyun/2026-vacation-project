import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-12">
      <h1 className="text-3xl font-bold text-primary">식물 도감</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        선린 방학 프로젝트 1조의 식물 채집 앱입니다.
      </p>

      <div className="mt-10 space-y-3">
        <Link
          href="/capture"
          className="flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-light"
        >
          바로 시작하기
        </Link>
        <Link
          href="/collection"
          className="block w-full py-3 text-center text-sm font-medium text-primary transition-colors hover:text-primary-light"
        >
          예시 도감 보기
        </Link>
      </div>
    </main>
  );
}
