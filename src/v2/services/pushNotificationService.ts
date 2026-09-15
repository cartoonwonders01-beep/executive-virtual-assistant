/**
 * Web Push Notification & Proactive Briefing Service
 * Manages ServiceWorker push subscriptions and dispatches proactive briefing notifications.
 */

import { telemetry } from './telemetryLogger';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  timestamp?: number;
}

export class PushNotificationService {
  private isSubscribed: boolean = false;
  private currentSubscription: any = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      telemetry.log('error', { source: 'PushNotification', message: 'Notifications not supported' });
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      telemetry.log('event', { action: 'push_permission_requested', permission });
      return permission;
    } catch (err) {
      telemetry.log('error', { source: 'PushNotification', message: String(err) });
      return 'denied';
    }
  }

  /**
   * Dispatches a local system or push notification
   */
  public async showNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isSupported()) return false;

    if (Notification.permission !== 'granted') {
      const perm = await this.requestPermission();
      if (perm !== 'granted') return false;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.showNotification) {
          await registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge || '/favicon.ico',
            data: { ...(payload.data || {}), timestamp: payload.timestamp || Date.now() }
          });
          telemetry.log('event', { action: 'push_notification_shown', via: 'serviceWorker', title: payload.title });
          return true;
        }
      }

      // Direct fallback to browser Notification object
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico'
      });
      telemetry.log('event', { action: 'push_notification_shown', via: 'native', title: payload.title });
      return true;
    } catch (err) {
      telemetry.log('error', { source: 'PushNotification', message: String(err) });
      return false;
    }
  }

  /**
   * Schedules or emits a proactive morning briefing notification
   */
  public async dispatchMorningBriefingNotification(spokenBriefing: string): Promise<boolean> {
    return this.showNotification({
      title: '☀️ Eve Executive Morning Briefing',
      body: spokenBriefing.slice(0, 140) + '...',
      data: { type: 'morning_briefing', url: '/' }
    });
  }
}

export const pushNotificationService = new PushNotificationService();
