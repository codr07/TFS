import { supabase } from './supabase';

export type SyncEntityType =
  | 'students'
  | 'payments'
  | 'requests'
  | 'admissions'
  | 'catalogs'
  | 'all';

export interface SyncEvent {
  entity: SyncEntityType;
  action?: 'insert' | 'update' | 'delete' | 'refresh';
  id?: string;
  timestamp: number;
}

type SyncListener = (event: SyncEvent) => void;

const listeners = new Set<SyncListener>();

// 1. BroadcastChannel across browser tabs
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('tfs_sync_channel');
    broadcastChannel.onmessage = (e) => {
      if (e.data && e.data.entity) {
        notifyLocalListeners(e.data);
      }
    };
  }
} catch {
  // BroadcastChannel unavailable
}

// 2. Storage event listener for cross-tab fallback
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'tfs_sync_signal' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        notifyLocalListeners(parsed);
      } catch {}
    }
  });

  window.addEventListener('tfs:sync', ((e: CustomEvent<SyncEvent>) => {
    if (e.detail) {
      notifyLocalListeners(e.detail);
    }
  }) as EventListener);
}

// 3. Supabase Realtime channel
let realtimeChannel: any = null;
try {
  if (typeof window !== 'undefined') {
    realtimeChannel = supabase.channel('tfs-realtime-sync', {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    realtimeChannel
      .on('broadcast', { event: 'sync' }, (payload: any) => {
        if (payload?.payload) {
          notifyLocalListeners(payload.payload);
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_profiles' },
        (payload: any) => {
          notifyLocalListeners({
            entity: 'students',
            action: (payload.eventType?.toLowerCase() as any) || 'update',
            id: payload.new?.id || payload.old?.id,
            timestamp: Date.now(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fee_payments' },
        (payload: any) => {
          notifyLocalListeners({
            entity: 'payments',
            action: (payload.eventType?.toLowerCase() as any) || 'update',
            id: payload.new?.id || payload.old?.id,
            timestamp: Date.now(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_requests' },
        (payload: any) => {
          notifyLocalListeners({
            entity: 'requests',
            action: (payload.eventType?.toLowerCase() as any) || 'update',
            id: payload.new?.id || payload.old?.id,
            timestamp: Date.now(),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fee_plans' },
        () => {
          notifyLocalListeners({ entity: 'catalogs', action: 'update', timestamp: Date.now() });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'curriculum_items' },
        () => {
          notifyLocalListeners({ entity: 'catalogs', action: 'update', timestamp: Date.now() });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_items' },
        () => {
          notifyLocalListeners({ entity: 'catalogs', action: 'update', timestamp: Date.now() });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'add_ons' },
        () => {
          notifyLocalListeners({ entity: 'catalogs', action: 'update', timestamp: Date.now() });
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // Subscribed to Supabase Realtime sync channel
        }
      });
  }
} catch (e) {
  console.warn('Realtime sync channel setup notice:', e);
}

function notifyLocalListeners(event: SyncEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.warn('Sync listener error:', err);
    }
  });
}

/**
 * Broadcasts a change event immediately across all tabs, portals, and devices.
 */
export function broadcastSync(
  entity: SyncEntityType = 'all',
  action: 'insert' | 'update' | 'delete' | 'refresh' = 'update',
  id?: string
) {
  const event: SyncEvent = {
    entity,
    action,
    id,
    timestamp: Date.now(),
  };

  // 1. Notify local in-memory listeners
  notifyLocalListeners(event);

  // 2. Broadcast to other tabs via BroadcastChannel
  try {
    broadcastChannel?.postMessage(event);
  } catch {}

  // 3. Fallback via storage event
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tfs_sync_signal', JSON.stringify(event));
    }
  } catch {}

  // 4. Fallback via window custom event
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tfs:sync', { detail: event }));
    }
  } catch {}

  // 5. Send over Supabase Realtime broadcast channel so other devices/browsers receive it
  try {
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'sync',
        payload: event,
      });
    }
  } catch {}
}

/**
 * Subscribes a component to sync events. Returns an unsubscribe function.
 */
export function subscribeToSync(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
