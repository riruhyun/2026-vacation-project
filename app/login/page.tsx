"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginScreen from "@/components/login/LoginScreen";
import { authErrorMessage } from "@/lib/auth-error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await fetch(`/api/auth/${mode === "sign-in" ? "sign-in" : "sign-up"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const body = await result.json();
    setIsSubmitting(false);
    if (!result.ok || !body.success) return setErrorMessage(authErrorMessage({ message: body.error?.message }));
    router.replace("/");
    router.refresh();
  }

  return (
    <LoginScreen
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={handleSubmit}
      mode={mode}
      onToggleMode={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
    />
  );
}
