import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

const RECENT_ACTIVITIES = [
  { id: 1, text: "산철쭉을 새로 발견했어요", time: "오늘", dotColor: "var(--color-primary)" },
  { id: 2, text: "민들레를 다시 관찰했어요", time: "2일 전", dotColor: "var(--color-sun)" },
  { id: 3, text: "레벨 3에 도달했어요", time: "4일 전", dotColor: "var(--color-sun)" },
];

export default function ProfileScreen() {
  const name = "홍길동";
  const level = 3;
  const levelTitle = "새싹 관찰자";
  const xp = 320;
  const xpMax = 500;
  const xpPercent = Math.min(100, Math.round((xp / xpMax) * 100));

  const stats = [
    { label: "발견한 종", value: 7 },
    { label: "관찰 기록", value: 12 },
    { label: "현재 레벨", value: level },
  ];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="내 프로필"
        action={
          <Link href="/settings" className="text-xs font-normal text-[var(--color-sub)]">
            설정
          </Link>
        }
      />

      <div className="-mt-6 flex items-center gap-3.5">
        <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)]">
          <i
            className="ri-user-3-fill text-[32px] leading-none"
            style={{ color: "var(--color-white)" }}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 mb-1 text-xl font-bold text-[var(--color-text)]">{name}</p>
          <p className="m-0 mb-2 text-sm font-bold text-[var(--color-primary)]">
            Lv. {level} {levelTitle}
          </p>
          <div className="h-1.5 w-[220px] max-w-full overflow-hidden rounded-[4px] bg-[#D9E0D8]">
            <div
              className="h-full rounded-[4px] bg-[var(--color-primary)]"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div className="mt-1.5 text-xs font-normal text-[var(--color-sub)]">
            {xp} / {xpMax} XP
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex h-[92px] flex-1 flex-col items-center justify-center rounded-2xl bg-[var(--color-white)] text-center"
          >
            <div className="text-2xl font-bold text-[var(--color-deep)]">{stat.value}</div>
            <div className="mt-1.5 text-xs font-normal text-[var(--color-sub)]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="text-lg font-bold text-[var(--color-text)]">최근 활동</div>

      <div className="flex flex-col gap-4">
        {RECENT_ACTIVITIES.map((activity) => (
          <div
            key={activity.id}
            className="flex h-[58px] w-full items-center gap-3 rounded-2xl bg-[var(--color-white)] px-4"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: activity.dotColor }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-medium text-[var(--color-text)]">
                {activity.text}
              </p>
              <p className="m-0 text-xs font-normal text-[var(--color-sub)]">
                {activity.time}
              </p>
            </div>
            <i className="ri-arrow-right-s-line text-lg text-[var(--color-sub)]" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#EEF3EA] px-4 py-3.5">
        <div className="mb-0.5 text-xs font-bold text-[var(--color-primary)]">위치 정보</div>
        <div className="text-xs font-normal text-[var(--color-sub)]">
          MVP에서는 위치를 저장하지 않아요
        </div>
      </div>
    </div>
  );
}
