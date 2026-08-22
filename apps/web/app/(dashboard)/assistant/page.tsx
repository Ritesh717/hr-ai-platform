import { Suspense } from "react";
import { AiAssistantScreen } from "@/features/assistant/ai-assistant-screen";
import { AiAssistantScreenLoader } from "@/features/assistant/ai-assistant-screen-loader";

export default function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}) {
  return (
    <Suspense fallback={<AiAssistantScreenLoader />}>
      <AssistantPageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function AssistantPageInner({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}) {
  const { context } = await searchParams;
  return (
    <div className="flex h-full flex-col">
      <AiAssistantScreen context={context} />
    </div>
  );
}
