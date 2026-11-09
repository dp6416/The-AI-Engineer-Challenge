/**
 * Resolves the FastAPI chat endpoint.
 *
 * Locally the Python server runs on port 8000. On Vercel the same path is
 * served from this deployment, so we use a same-origin relative URL.
 *
 * Override either environment with NEXT_PUBLIC_API_URL (no trailing slash).
 * That value is public by design — never put API keys here.
 */
export function getChatUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configured) {
    return `${configured.replace(/\/$/, "")}/api/chat`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000/api/chat";
  }

  return "/api/chat";
}

export type ChatResponse = {
  reply: string;
};

/**
 * Sends one user message to the FastAPI backend.
 * Throws on network failure or a non-OK / malformed response so the UI
 * can show a friendly inline error instead of crashing.
 */
export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch(getChatUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Coach request failed with status ${response.status}`);
  }

  const data = (await response.json()) as Partial<ChatResponse>;

  if (typeof data.reply !== "string" || data.reply.length === 0) {
    throw new Error("Coach response was missing a reply");
  }

  return data.reply;
}
