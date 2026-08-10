import type { NextConfig } from "next";

// next/image로 외부 사진을 띄우려면 호스트를 여기에 등록해야 합니다.
// 등록하지 않은 호스트는 400으로 막힙니다.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 상위 폴더에도 package-lock.json이 있어서 Turbopack이 워크스페이스 루트를 상위로 잡습니다.
  // 그러면 청크 이름에 한글 경로가 섞여 빌드가 깨지므로 루트를 이 프로젝트로 고정합니다.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      // Pl@ntNet 후보 이미지
      { protocol: "https", hostname: "bs.plantnet.org", pathname: "/**" },
      // iNaturalist 대표 사진
      { protocol: "https", hostname: "static.inaturalist.org", pathname: "/**" },
      {
        protocol: "https",
        hostname: "inaturalist-open-data.s3.amazonaws.com",
        pathname: "/**",
      },
      // 사용자가 촬영해 Supabase Storage에 올린 사진
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
