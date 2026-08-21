import type { ChatMessage } from "@/lib/api/types";
import { RefusalBlock } from "./blocks/refusal-block";
import { TextBlock } from "./blocks/text-block";
import { ToolCallBlock } from "./blocks/tool-call-block";

// Block-type constants — the canonical keys for the registry dispatch below.
// Extend this enum when new block types are added (CitationBlock, DataTableBlock, etc. per
// ui-plan §4.4); never add inline cases to the renderer itself.
export const BLOCK_TYPE = {
  TEXT: "text",
  TOOL_CALL: "tool_call",
  REFUSAL: "refusal",
} as const;

export type BlockType = (typeof BLOCK_TYPE)[keyof typeof BLOCK_TYPE];

export interface TextBlockData {
  type: typeof BLOCK_TYPE.TEXT;
  content: string;
}

export interface ToolCallBlockData {
  type: typeof BLOCK_TYPE.TOOL_CALL;
  name: string;
  input: unknown;
}

export interface RefusalBlockData {
  type: typeof BLOCK_TYPE.REFUSAL;
  message?: string;
}

export type BlockData = TextBlockData | ToolCallBlockData | RefusalBlockData;

// The registry: maps a block type to its renderer. Extensible — adding a new block type means
// registering a new entry here, never rewriting the dispatch logic below.
type BlockRenderer<T extends BlockData> = (block: T) => React.ReactNode;

const REGISTRY: {
  [K in BlockType]: BlockRenderer<Extract<BlockData, { type: K }>>;
} = {
  [BLOCK_TYPE.TEXT]: (block) => <TextBlock content={block.content} />,
  [BLOCK_TYPE.TOOL_CALL]: (block) => (
    <ToolCallBlock toolCall={{ name: block.name, input: block.input }} />
  ),
  [BLOCK_TYPE.REFUSAL]: (block) => <RefusalBlock message={block.message} />,
};

function renderBlock(block: BlockData): React.ReactNode {
  const renderer = REGISTRY[block.type] as BlockRenderer<typeof block>;
  return renderer(block);
}

// Converts a ChatMessage into a sequence of typed BlockData for the registry to render.
// Today's AgentChatResponseDto produces: a free-text `reply` (→ TextBlock) and a `toolCalls[]`
// list of `{ name, input }` (→ ToolCallBlock each). Error messages map to RefusalBlock.
// Future block types (citations, tables, charts, approval cards) extend this mapping without
// touching the renderer registry logic.
function messageToBlocks(message: ChatMessage): BlockData[] {
  const blocks: BlockData[] = [];

  if (message.status === "error") {
    blocks.push({ type: BLOCK_TYPE.REFUSAL, message: message.content || undefined });
    return blocks;
  }

  if (message.toolCalls && message.toolCalls.length > 0) {
    for (const call of message.toolCalls) {
      blocks.push({ type: BLOCK_TYPE.TOOL_CALL, name: call.name, input: call.input });
    }
  }

  if (message.content) {
    blocks.push({ type: BLOCK_TYPE.TEXT, content: message.content });
  }

  return blocks;
}

// The main entry point: given a ChatMessage, produces a rendered sequence of typed blocks.
// ChatPanel/ChatMessage passes this as `renderMessageContent` to replace DefaultMessageContent.
export function ResponseRenderer({ message }: { message: ChatMessage }) {
  // Only assistant messages go through the full block pipeline; user/system messages are plain
  // text and don't need the overhead of block dispatch.
  if (message.role !== "assistant") {
    return (
      <p className="whitespace-pre-wrap break-words text-sm text-text">
        {message.content}
      </p>
    );
  }

  const blocks = messageToBlocks(message);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      {blocks.map((block, index) => (
        <div key={`${block.type}-${index}`}>{renderBlock(block)}</div>
      ))}
    </div>
  );
}
