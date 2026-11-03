"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api";

type ChatRole = "user" | "coach" | "error";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const STARTER_PROMPTS = [
  "I feel a bit overwhelmed today.",
  "Help me notice one small win.",
  "I want a calmer way to start my evening.",
];

const ERROR_COPY =
  "Something went wrong reaching your coach - please try again";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  // Keep the newest message in view without jumping the page around the input.
  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isWaiting]);

  async function submitMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isWaiting) return;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsWaiting(true);

    try {
      const reply = await sendChatMessage(trimmed);
      setMessages((current) => [
        ...current,
        { id: newId(), role: "coach", content: reply },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: newId(), role: "error", content: ERROR_COPY },
      ]);
    } finally {
      setIsWaiting(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(draft);
    }
  }

  const showEmptyState = messages.length === 0 && !isWaiting;

  return (
    <section className="flex min-h-[min(720px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-soft">
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-primary">Calm Coach</p>
        <h1 className="mt-1 text-xl font-semibold text-text sm:text-2xl">
          A quiet place to check in
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Share what is on your mind. There is no rush.
        </p>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 sm:px-6"
        aria-live="polite"
      >
        {showEmptyState ? (
          <div className="flex flex-1 flex-col justify-center gap-5 py-6">
            <p className="text-lg text-text">How are you feeling today?</p>
            <div className="flex flex-col gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submitMessage(prompt)}
                  className="rounded-[18px] border border-border bg-bg px-4 py-3 text-left text-sm text-text transition-colors duration-200 ease-in-out hover:border-primary hover:bg-coach-bubble focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => <Bubble key={message.id} message={message} />)
        )}

        {isWaiting ? <ThinkingIndicator /> : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-border bg-surface px-4 py-4 sm:px-6"
      >
        <label htmlFor={inputId} className="sr-only">
          Message to your coach
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            ref={inputRef}
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a few words… Enter to send, Shift+Enter for a new line"
            disabled={isWaiting}
            className="min-h-[3.25rem] max-h-40 flex-1 resize-y rounded-[18px] border border-border bg-bg px-4 py-3 text-base leading-relaxed text-text placeholder:text-text-muted transition-shadow duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={isWaiting || draft.trim().length === 0}
            className="shrink-0 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === "error") {
    return (
      <p
        role="alert"
        className="max-w-[85%] self-start rounded-[18px] border border-error/30 bg-white px-4 py-3 text-sm text-error"
      >
        {message.content}
      </p>
    );
  }

  const isUser = message.role === "user";

  return (
    <p
      className={`max-w-[85%] w-fit whitespace-pre-wrap rounded-[18px] px-4 py-3 text-base leading-relaxed shadow-soft motion-safe:animate-fade-in ${
        isUser
          ? "self-end bg-user-bubble text-white"
          : "self-start bg-coach-bubble text-text"
      }`}
    >
      <span className="sr-only">{isUser ? "You: " : "Coach: "}</span>
      {message.content}
    </p>
  );
}

function ThinkingIndicator() {
  return (
    <div
      className="flex w-fit items-center gap-1.5 rounded-[18px] bg-coach-bubble px-4 py-3"
      aria-label="Coach is thinking"
    >
      <span className="text-sm text-text-muted">Coach is thinking</span>
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse [animation-delay:300ms]" />
      </span>
    </div>
  );
}
