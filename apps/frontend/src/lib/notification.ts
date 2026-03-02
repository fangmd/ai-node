/**
 * 浏览器级通知（Web Notifications API）。
 * 仅在页面不可见时发送，避免与页面内 Sonner 重复。
 */

export function supportsNotification(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function requestPermission(): Promise<NotificationPermission> {
  if (!supportsNotification()) return Promise.resolve('denied');
  if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
  return Notification.requestPermission();
}

/**
 * 仅当页面不可见且已授权时发送系统通知。
 */
export function showWhenHidden(title: string, body: string): void {
  if (!supportsNotification() || Notification.permission !== 'granted') return;
  if (document.visibilityState !== 'hidden') return;
  try {
    new Notification(title, { body });
  } catch {
    // 忽略静默失败（如部分环境限制）
  }
}
