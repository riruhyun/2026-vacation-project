// 공통 컴포넌트: 진행률 바
// 홈의 XP 진행률, 도감 완성률 등에서 재사용

interface ProgressBarProps {
    percent: number; // 0~100
    trackColor?: string;
    fillColor?: string;
    height?: number;
}

export default function ProgressBar({
    percent,
    trackColor = "rgba(255,255,255,0.25)",
    fillColor = "var(--color-accent)",
    height = 8,
}: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, percent));

    return (
        <div
            style={{
                width: "100%",
                height,
                borderRadius: "var(--radius-pill)",
                background: trackColor,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: `${clamped}%`,
                    height: "100%",
                    background: fillColor,
                    borderRadius: "var(--radius-pill)",
                    transition: "width 0.3s ease",
                }}
            />
        </div>
    );
}