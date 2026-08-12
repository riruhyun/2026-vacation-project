"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginScreen from "@/components/login/LoginScreen";

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