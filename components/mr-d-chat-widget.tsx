'use client';

import * as React from 'react';
import { MrDChat } from '@/components/mr-d-chat';

const API_URL = '/api/mr-d/chat';

export function MrDChatWidget() {
  const conversationRef = React.useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const onSendMessage = React.useCallback(async (message: string): Promise<string> => {
    conversationRef.current.push({ role: 'user', content: message });

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mr-D-No-Stream': 'true',
      },
      body: JSON.stringify({
        messages: conversationRef.current,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
    }

    const data = (await res.json()) as { message?: string };
    const content = typeof data.message === 'string' ? data.message : '';

    conversationRef.current.push({ role: 'assistant', content });
    return content;
  }, []);

  return <MrDChat onSendMessage={onSendMessage} />;
}
