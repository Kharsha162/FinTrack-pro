import React, { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../authContext";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

interface ChatResponse {
  reply: string;
  source: "openai" | "rules";
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = user ? `fintrack-chat-${user.id}` : "fintrack-chat-anon";

  const quickIntents = [
    { label: "💰 Total Income", query: "What is my total income?" },
    { label: "💸 Monthly Spend", query: "How much have I spent this month?" },
    { label: "📈 Trade Advisory", query: "Can I afford to trade today?" },
    { label: "🎯 Saving Plan", query: "Give me a saving plan" },
    { label: "🏥 Health Score", query: "How is my financial health?" }
  ];

  async function handleQuickIntent(query: string) {
    setInput(query);
    // Use a small timeout to allow state to update before submit
    setTimeout(() => {
      const event = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(event, query);
    }, 10);
  }

  async function handleSubmit(event: FormEvent, overrideInput?: string) {
    if (event) event.preventDefault();
    const content = overrideInput || input.trim();
    if (!content || sending) return;
    
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setError(null);
    setSending(true);
    try {
      const res = await api.post<ChatResponse>("/chat", { message: content });
      const reply = res.data.reply || "I could not generate a detailed response right now.";
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setError("Unable to reach the assistant. Please try again in a moment.");
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: "Sorry, something went wrong while generating advice. Please try again shortly.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        setMessages(parsed);
      } else {
        setMessages([
          {
            id: createId(),
            role: "assistant",
            content: "How can I help you today?",
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch {
      setMessages([{ id: createId(), role: "assistant", content: "How can I help you today?", createdAt: new Date().toISOString() }]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  return (
    <section className="space-y-4" aria-label="Personal finance chatbot">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white">AI Finance Advisor</h1>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Real-time insights on your net worth, trading readiness, and risk management.
          </p>
        </div>

        {/* Quick Intent Chips */}
        <div className="flex flex-wrap gap-2">
          {quickIntents.map((intent, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickIntent(intent.query)}
              disabled={sending}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 transition-all disabled:opacity-50"
            >
              {intent.label}
            </button>
          ))}
        </div>

        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl backdrop-blur-sm">
          <div className="h-80 sm:h-96 overflow-y-auto p-4 space-y-3" aria-label="Chat history">
            {messages.map(message => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-8 flex justify-end"
                    : "mr-8 flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[80%] rounded-lg bg-primary-600 px-3 py-2 text-xs text-white"
                      : "max-w-[80%] rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="mr-8 flex justify-start">
                <div className="flex items-center space-x-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none w-fit">
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 px-3 py-2 flex items-center gap-2 rounded-b-2xl"
            aria-label="Send a message to the finance assistant"
          >
            <label htmlFor="chat-input" className="sr-only">
              Ask a question
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Ask about your expenses, budgets, or savings goals…"
              className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex items-center justify-center rounded-md bg-primary-500 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-60 disabled:hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
          {error && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-red-100 dark:bg-red-900/40 px-3 py-2 text-[11px] text-red-700 dark:text-red-100 rounded-b-2xl" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

