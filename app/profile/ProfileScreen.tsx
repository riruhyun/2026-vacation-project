"use client";

import React, { useState, useEffect } from "react";

const colors = {
  darkText: "#16281c",
  gray: "#a3aca1",
  grayLight: "#b3bcae",
  avatarBg: "#dfeee0",
  flower: "#f0e3ab",
  stem: "#3f7a5a",
  accentGreen: "#3c6e52",
  xpFill: "#2f6b4f",
  xpTrack: "#dfe3db",
  locationBg: "#eef3ea",
  locationTitle: "#2f5940",
  locationSub: "#99a795",
  cardShadow: "0 2px 8px rgba(60,80,60,0.05)",
};

const stats = [
  { label: "발견한 종", value: 0 },
  { label: "관찰 기록", value: 0 },
  { label: "현재 레벨", value: 0 },
];

function SproutIcon() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
      <ellipse cx="15" cy="8" rx="7.5" ry="6" fill={colors.flower} />
      <path
        d="M15 12 L15 30"
        stroke={colors.stem}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M15 21c-4.5 0-6.5-2.3-6.8-5.6"
        stroke={colors.stem}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M15 26c4 0 6-1.9 6.3-4.8"
        stroke={colors.stem}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function ProfileScreen() {
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("user_profile_name");
      if (savedName) return savedName;
    }
    return "홍길동";
  });

  useEffect(() => {
    localStorage.setItem("user_profile_name", name);
  }, [name]);

  const xp = 0;
  const xpMax = 500;
  const xpPercent = Math.min(100, Math.round((xp / xpMax) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: colors.darkText,
            margin: 0,
          }}
        >
          내 프로필
        </h1>
        <span style={{ fontSize: 13, color: colors.gray }}>설정</span>
      </div>

      {/* Profile card */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 20,
            background: colors.avatarBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SproutIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input    /*클릭을 통하여 이름 바꾸기*/
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
            maxLength={10}
            style={{
              fontSize: 16.5,
              fontWeight: 800,
              color: colors.darkText,
              marginBottom: 4,
              border: "none",
              borderBottom: `1.5px dashed ${colors.grayLight}`,
              background: "transparent",
              outline: "none",
              width: "100%",
              padding: "0 0 2px 0",
              fontFamily: "inherit",
            }}
          />
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.accentGreen,
              marginBottom: 8,
            }}
          >
            Lv. 0 새싹 관찰자
          </div>
          <div
            style={{
              width: "100%",
              height: 6,
              borderRadius: 4,
              background: colors.xpTrack,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${xpPercent}%`,
                height: "100%",
                borderRadius: 4,
                background: colors.xpFill,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: colors.grayLight, marginTop: 6 }}>
            {xp} / {xpMax} XP
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: "#ffffff",
              borderRadius: 16,
              padding: "16px 6px",
              textAlign: "center",
              boxShadow: colors.cardShadow,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: colors.darkText }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: colors.gray, marginTop: 5 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Section title */}
      <div style={{ fontSize: 14.5, fontWeight: 800, color: colors.darkText }}>
        최근 활동
      </div>

      <div style={{ height: 350 }} />

      {/* Location card */}
      <div
        style={{
          background: colors.locationBg,
          borderRadius: 16,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: colors.locationTitle,
            marginBottom: 3,
          }}
        >
          위치 정보
        </div>
        <div style={{ fontSize: 11, color: colors.locationSub }}>
          MVP에서는 위치를 저장하지 않아요
        </div>
      </div>
    </div>
  );
}