import { useEffect } from 'react';
import { useSSEEvent } from '@/contexts/SSEContext';
import { requestPermission } from '@/lib/notification';
import { showWhenHidden } from '@/lib/notification';
import { SSE_EVENT_USER_MESSAGE, type UserMessagePayload } from '@/lib/sse';
import { toast } from 'sonner';

function isUserMessagePayload(data: unknown): data is UserMessagePayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as UserMessagePayload).message === 'string'
  );
}

export function SSEMessageHandler() {
  useEffect(() => {
    requestPermission();
  }, []);

  useSSEEvent(SSE_EVENT_USER_MESSAGE, (data) => {
    if (!isUserMessagePayload(data)) return;
    const { title, message } = data;
    if (title != null && title !== '') {
      toast(title, { description: message });
    } else {
      toast(message);
    }
    showWhenHidden(title ?? '通知', message);
  });

  return null;
}
