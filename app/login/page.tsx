"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginScreenProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: () => void;
};

function LoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
}: LoginScreenProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg)",
        padding: "76px 24px 28px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <section style={{ marginBottom: 44 }}>
        <h1
          style={{
            margin: 0,
            color: "var(--color-text-primary)",
            fontSize: 31,
            lineHeight: 1.18,
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          기록을 안전하게
          <br />
          보관해요
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            color: "var(--color-text-secondary)",
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          로그인하면 휴대폰을 바꿔도 도감과 레벨이 유지됩니다.
        </p>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일 주소"
          autoComplete="email"
          style={{
            height: 56,
            width: "100%",
            borderRadius: 18,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            padding: "0 18px",
            fontSize: 15,
            color: "var(--color-text-primary)",
            outline: "none",
            boxShadow: "0 1px 2px rgba(17, 24, 39, 0.02)",
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
          autoComplete="current-password"
          style={{
            height: 56,
            width: "100%",
            borderRadius: 18,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            padding: "0 18px",
            fontSize: 15,
            color: "var(--color-text-primary)",
            outline: "none",
            boxShadow: "0 1px 2px rgba(17, 24, 39, 0.02)",
          }}
        />

        <button
          type="button"
          onClick={onSubmit}
          style={{
            height: 54,
            width: "100%",
            border: "none",
            borderRadius: 18,
            backgroundColor: "var(--color-deep-green)",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = "var(--color-deep-green-dark)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "var(--color-deep-green)";
          }}
        >
          이메일로 로그인
        </button>
      </section>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "34px 0 22px",
          color: "var(--color-text-secondary)",
          fontSize: 13,
        }}
      >
        <span style={{ flex: 1, height: 1, backgroundColor: "var(--color-border)" }} />
        <span>또는</span>
        <span style={{ flex: 1, height: 1, backgroundColor: "var(--color-border)" }} />
      </div>

      <button
        type="button"
        style={{
          height: 54,
          width: "100%",
          borderRadius: 18,
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-deep-green)",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(17, 24, 39, 0.02)",
        }}
      >
        Google로 계속하기
      </button>

      <p
        style={{
          margin: "28px 0 0",
          textAlign: "center",
          color: "var(--color-text-secondary)",
          fontSize: 15,
        }}
      >
        아직 계정이 없나요?{" "}
        <span style={{ color: "var(--color-deep-green)", fontWeight: 700 }}>회원가입</span>
      </p>

      <div
        style={{
          marginTop: "auto",
          borderRadius: 22,
          backgroundColor: "var(--color-mint-100)",
          padding: "20px 18px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--color-text-secondary)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          사진과 관찰 기록은 본인 계정에 저장되며,
          <br />
          위치 정보는 사용자의 동의 없이 수집하지 않습니다.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      return;
    }

    router.push("/");
  }

  return (
    <LoginScreen
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={handleSubmit}
    />
  );
}
