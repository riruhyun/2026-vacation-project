"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return <Button type="button" variant="ghost" onClick={signOut} disabled={pending}>로그아웃</Button>;
}
