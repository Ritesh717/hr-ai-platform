import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils/cn";

export interface TextBlockProps {
  content: string;
  className?: string;
}

// Renders agent reply text as sanitized markdown (react-markdown never uses
// dangerouslySetInnerHTML on raw agent output — CLAUDE.md rule 5 / issue #66 security req).
// HTML passthrough is intentionally disabled (no rehype-raw plugin), so even if agent output
// contains raw HTML tags they are rendered as escaped text, not injected into the DOM.
export function TextBlock({ content, className }: TextBlockProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-text",
        "prose-headings:text-text prose-strong:text-text prose-code:text-text",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-glass-border prose-blockquote:text-text-muted",
        "prose-pre:bg-glass-surface prose-pre:border prose-pre:border-glass-border",
        className,
      )}
    >
      {/* disallowedElements / skipHtml: react-markdown doesn't render <script> or inline HTML by
          default (no rehype-raw), but we make it explicit for clarity. */}
      <ReactMarkdown skipHtml>{content}</ReactMarkdown>
    </div>
  );
}
