import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button"; // ⚠️ 실제 Button 파일 위치에 맞게 경로 확인

export default function CollectionEmptyState() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <PageHeader title="나의 식물 도감" />
            <p
                style={{
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                    margin: "-12px 0 0",
                }}
            >
                아직 등록한 식물이 없어요.
            </p>

            <PlantIllustration />

            <div style={{ textAlign: "center" }}>
                <h2
                    style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        margin: 0,
                        color: "var(--color-deep-green)",
                    }}
                >
                    첫 식물을 만나러 가볼까요?
                </h2>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--color-text-secondary)",
                        margin: "10px 0 0",
                        lineHeight: 1.6,
                    }}
                >
                    학교 화단이나 집 앞 가로수도
                    <br />
                    멋진 첫 발견이 될 수 있어요.
                </p>
            </div>

            <div
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-card)",
                    padding: "16px 18px",
                }}
            >
                <p
                    style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        margin: 0,
                        color: "var(--color-deep-green)",
                    }}
                >
                    첫 수집 추천
                </p>
                <p style={{ fontSize: "15px", fontWeight: 700, margin: "8px 0 4px" }}>
                    민들레 · 토끼풀 · 은행나무처럼
                </p>
                <p
                    style={{
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                    }}
                >
                    가까이에서 흔히 만나는 식물부터 시작해보세요.
                </p>
            </div>

            <Link href="/capture" style={{ display: "block" }}>
                <Button variant="primary" fullWidth>
                    첫 식물 촬영하기
                </Button>
            </Link>
        </div>
    );
}

function PlantIllustration() {
    return (
        <div
            style={{
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                background: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
            }}
        >
            <svg width="72" height="88" viewBox="0 0 72 88" fill="none">
                <path
                    d="M36 84V28"
                    stroke="var(--color-deep-green)"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
                <path
                    d="M36 58C24 58 16 50 16 40C28 40 36 48 36 58Z"
                    fill="var(--color-deep-green)"
                />
                <path
                    d="M36 70C48 70 56 62 56 52C44 52 36 60 36 70Z"
                    fill="var(--color-deep-green)"
                />
                <circle cx="36" cy="16" r="16" fill="#F4E7B8" />
            </svg>
        </div>
    );
}