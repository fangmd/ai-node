import { useSSEEvent } from '@/contexts/SSEContext';
import {
  SSE_EVENT_USER_MESSAGE,
  type UserMessagePayload,
} from '@/lib/sse';
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
  useSSEEvent(SSE_EVENT_USER_MESSAGE, (data) => {
    if (!isUserMessagePayload(data)) return;
    const { title, message } = data;
    if (title != null && title !== '') {
      toast(title, { description: message });
    } else {
      toast(message);
    }
  });

  return null;
}
