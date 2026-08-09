import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

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
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css"
        />
      </head>
      <body>
        <div className="app-shell">
          <main className="app-content">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}