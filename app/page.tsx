import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-5 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">식물 도감</h1>
        <p className="mt-3 text-base text-muted">
          사진 한 장으로 식물을 찾고 나만의 카드를 만들어보세요.
        </p>
      </div>

      <div className="mt-10 w-full">
        <Link
          href="/capture"
          className="flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-light"
        >
          식물 사진 촬영하기
        </Link>
      </div>
    </div>
  );
}
