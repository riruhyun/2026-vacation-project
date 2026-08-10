"use client";

import RootPageHeader from "@/components/layout/PageHeader";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, onBack }: PageHeaderProps) {
  return <RootPageHeader title={title} subtitle={subtitle} showBack onBack={onBack} />;
}
