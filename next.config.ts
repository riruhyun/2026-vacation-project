import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["172.30.1.99"],
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
