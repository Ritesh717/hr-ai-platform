"use client";

import { Sparkles } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function AiDrawerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      label="Open HR Copilot"
      intent="ghost"
      onClick={onClick}
      className="relative"
    >
      <Sparkles className="size-4.5" />
    </IconButton>
  );
}
