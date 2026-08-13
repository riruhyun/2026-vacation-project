import type { Metadata } from "next";
import "./globals.css";
import AppFrame from "@/components/layout/AppFrame";

export const metadata: Metadata = {
  title: "초록도감",
  description: "일상에서 발견한 식물을 카드로 수집하는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
