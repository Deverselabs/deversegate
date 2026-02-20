'use client';

import * as React from 'react';
import { Sparkles, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MrDChatProps {
  onSendMessage: (message: string) => Promise<string | void>;
  initialMessages?: ChatMessage[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

/** Simple markdown-like renderer: **bold**, *italic*, `code`, [text](url), newlines */
function renderMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const regex =
    /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\n)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{remaining.slice(lastIndex, match.index)}</span>
      );
    }
    if (match[2] !== undefined) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      parts.push(
        <em key={key++} className="italic">
          {match[3]}
        </em>
      );
    } else if (match[4] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
        >
          {match[4]}
        </code>
      );
    } else if (match[5] !== undefined && match[6] !== undefined) {
      parts.push(
        <a
          key={key++}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {match[5]}
        </a>
      );
    } else if (match[0] === '\n') {
      parts.push(<br key={key++} />);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < remaining.length) {
    parts.push(<span key={key++}>{remaining.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

const SUGGESTED_QUESTIONS = [
  'Show me unpaid invoices',
  "What's my revenue this month?",
  'Who are my top clients?',
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MrDChat({
  onSendMessage,
  initialMessages = [],
  className,
}: MrDChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, []);

  React.useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const sendMessage = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setError(null);
      setIsTyping(true);

      try {
        const response = await onSendMessage(trimmed);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: typeof response === 'string' ? response : 'Done.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong.';
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Sorry, I couldn't process that: ${message}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [onSendMessage, isTyping]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (q: string) => {
    sendMessage(q);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={cn('fixed bottom-0 right-0 z-50 flex flex-col', className)}>
      {/* Chat window */}
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-t-2xl border border-amber-500/20 bg-card/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out',
          'bottom-0 right-0',
          isOpen
            ? 'visible h-[600px] w-[400px] translate-y-0 opacity-100 sm:bottom-5 sm:right-5 sm:rounded-2xl sm:h-[600px] sm:w-[400px]'
            : 'invisible h-0 w-0 translate-y-4 opacity-0 sm:invisible',
          'max-sm:fixed max-sm:inset-0 max-sm:h-screen max-sm:w-screen max-sm:rounded-none max-sm:border-0',
          isOpen && 'max-sm:visible max-sm:translate-y-0'
        )}
      >
        {/* Header */}
        <header className="shrink-0 border-b border-transparent bg-gradient-to-r from-amber-500/10 via-transparent to-red-600/10 px-4 py-3 dark:from-amber-500/20 dark:to-red-600/20">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-foreground">
                Mr. D - Your Invoice Assistant
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                Ask me anything about your invoices
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full text-muted-foreground hover:bg-amber-500/10 hover:text-foreground"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 scroll-smooth"
        >
          <div className="flex min-h-full flex-col gap-4 pb-2">
            {isEmpty && !isTyping && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-600/20 p-4">
                  <Bot className="h-10 w-10 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask me about your invoices!
                </p>
                <div className="flex w-full flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSuggestionClick(q)}
                      className="rounded-xl border border-amber-500/20 bg-muted/50 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-amber-500/10 hover:border-amber-500/30 dark:bg-muted/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    msg.role === 'user'
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    'flex max-w-[85%] flex-col gap-0.5 rounded-2xl px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white [&_a]:text-blue-100 [&_a]:underline'
                      : 'bg-muted text-foreground [&_code]:bg-muted-foreground/20'
                  )}
                >
                  <div className="break-words">
                    {typeof renderMarkdown(msg.content) === 'string'
                      ? msg.content
                      : renderMarkdown(msg.content)}
                  </div>
                  <span
                    className={cn(
                      'text-[10px]',
                      msg.role === 'user'
                        ? 'text-blue-100/80'
                        : 'text-muted-foreground'
                    )}
                  >
                    {formatRelativeTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-border bg-background/80 p-3 backdrop-blur-sm"
        >
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your invoices..."
              disabled={isTyping}
              rows={1}
              className="min-h-[44px] max-h-32 resize-none border-amber-500/20 bg-background py-3 focus-visible:ring-amber-500/50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isTyping || !inputValue.trim()}
              className="h-11 w-11 shrink-0 bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90 disabled:opacity-50"
              aria-label="Send message"
            >
              {isTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'fixed bottom-5 right-5 z-50 flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95',
          'bg-gradient-to-br from-amber-500 to-red-600',
          'ring-4 ring-amber-500/30 ring-offset-2 ring-offset-background',
          'animate-pulse focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
          'group/bubble'
        )}
        aria-label={isOpen ? 'Close Mr. D chat' : 'Open Mr. D chat'}
      >
        <Sparkles className="h-7 w-7" strokeWidth={2} />
        <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover/bubble:opacity-100">
          Mr. D
        </span>
      </button>
    </div>
  );
}
